package fr.wseduc.stats.services;

import static fr.wseduc.webutils.Utils.isNotEmpty;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.entcore.common.validation.ValidationException;

import fr.wseduc.stats.utils.CsvUtils;
import fr.wseduc.stats.utils.DataTable;
import fr.wseduc.stats.utils.ImportCsvTable;
import fr.wseduc.stats.utils.StatsTable;
import fr.wseduc.webutils.Utils;
import io.vertx.core.AsyncResult;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.pgclient.PgPool;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.RowSet;
import io.vertx.sqlclient.Tuple;

import com.opendigitaleducation.repository.SyncRepository;

public class DefaultJobsServiceImpl implements JobsService {

    private static final long NB_MONTHS = 13;
    private final Vertx vertx;
    private final Set<String> allowedTables;
    private PgPool pgPool;
    private final String platformId;
    private final List<String> allowedPartitions;
    private final List<String> allowedEntities;
    private SyncRepository syncRepository;

    public DefaultJobsServiceImpl(Vertx vertx, String platformId, JsonObject allowedValuesConf) {
        this.vertx = vertx;
        final JsonObject allowedValues;
        if (allowedValuesConf == null || allowedValuesConf.isEmpty()) {
            allowedValues = Utils.loadFromResource("api-allowed-values.json");
        } else {
            allowedValues = allowedValuesConf;
        }
        this.platformId = platformId;
        final List<String> indicators = allowedValues.getJsonArray("indicators").getList();
        final List<String> levels = allowedValues.getJsonArray("entities-levels").getList();
        final List<String> frequencies = allowedValues.getJsonArray("frequencies").getList();
        final List<String> devices = Arrays.asList("", "device_");
        this.allowedTables = initAllowedTables(indicators, levels, frequencies, devices);
        this.allowedEntities = allowedValues.getJsonArray("referential-entities").getList();
        this.allowedPartitions = allowedValues.getJsonArray("referential-partitions").getList();
    }

    private Set<String> initAllowedTables(List<String> indicators, List<String> levels, List<String> frequencies, List<String> devices) {
        final Set<String> tableNames = new HashSet<>();
        for (String indicator : indicators) {
            for (String level : levels) {
                for (String frequency : frequencies) {
                    for (String device : devices) {
                        tableNames.add("stats." + indicator + "_" + device + level + "_" + frequency + "s");
                    }
                }
            }
        }
        return tableNames;
    }


    @Override
    public void importStats(ImportCsvTable importCsvTable, Handler<AsyncResult<Void>> handler) {
        final String tableName = importCsvTable.getTableName();
        if (!allowedTables.contains(tableName)) { // prevent SQL injection or table name manipulation
            handler.handle(Future.failedFuture(new ValidationException("invalid.table.name")));
            return;
        }
        CsvUtils.readCsv(vertx, importCsvTable, ar -> {
            if (ar.succeeded()) {
                final DataTable dataTable = ar.result();
                final List<String> columnsNames = dataTable.getColumns();
                 String query =
                        "INSERT INTO " + tableName + columnsNames.stream().collect(Collectors.joining(",", "(", ")")) +
                        " VALUES " + IntStream.rangeClosed(1, columnsNames.size()).boxed().map(i -> "$" + i).collect(Collectors.joining(",", "(", ")"));
                if (importCsvTable.isOnConflictUpdate()) {
                    query += "ON CONFLICT (id) DO UPDATE SET " + columnsNames.stream()
                            .filter(c -> !"id".equals(c)).map(c -> c + " = EXCLUDED." + c)
                            .collect(Collectors.joining(", "));
                }
                pgPool.preparedQuery(query).executeBatch(dataTable.getData(), ar2 -> {
                    if (ar2.succeeded()) {
                        handler.handle(Future.succeededFuture());
                    } else {
                        handler.handle(Future.failedFuture(ar2.cause()));
                    }
                });
            } else {
                handler.handle(Future.failedFuture(ar.cause()));
            }
        });
    }

    @Override
    public Set<String> getAllowedTables() {
        return allowedTables;
    }

    public void setPgPool(PgPool pgPool) {
        this.pgPool = pgPool;
    }

    @Override
    public void exportReferential(String entity, String partition, String partitionValue, Handler<AsyncResult<RowSet<Row>>> handler) {
        if (!allowedEntities.contains(entity)) {
            handler.handle(Future.failedFuture(new ValidationException("invalid.entity.name")));
            return;
        }
        String query = "SELECT * FROM repository." + entity;
        if (allowedPartitions.contains(partition) && isNotEmpty(partitionValue)) {
            query += " WHERE " + partition + " LIKE $1";
        }
        pgPool.preparedQuery(query).execute(partitionValue != null ? Tuple.of("%" + partitionValue) : Tuple.tuple(), ar -> {
            if (ar.succeeded()) {
                handler.handle(Future.succeededFuture(ar.result()));
            } else {
                handler.handle(Future.failedFuture(ar.cause()));
            }
        });
    }

    @Override
    public void syncRepository(Handler<AsyncResult<Void>> handler) {
        syncRepository.setMasterPgPool(pgPool);
        syncRepository.setSlavePgPool(pgPool);
        syncRepository.sync(handler);
    }

    public void setSyncRepository(SyncRepository syncRepository) {
        this.syncRepository = syncRepository;
    }

    @Override
    public void getAllowedTablesWithLastUpdate(Handler<AsyncResult<List<StatsTable>>> handler) {
        final StringBuilder query = new StringBuilder();
        for (String allowedTable: allowedTables) {
            query.append("SELECT platform_id, '").append(allowedTable).append("' as name, MAX(date) as lastdate FROM ")
                    .append(allowedTable).append(" WHERE platform_id = $1 GROUP BY 1, 2 UNION ");
        }
        pgPool.preparedQuery(query.substring(0, query.length() - 6)).execute(Tuple.of(platformId), ar -> {
            if (ar.succeeded()) {
                final Map<String, StatsTable> statsTables = new HashMap<>();
                for (Row row : ar.result()) {
                    statsTables.put(row.getString("name"), new StatsTable(row.getString("name"),
                            row.getString("platform_id"),
                            row.getLocalDateTime("lastdate")));
                }
                if (statsTables.size() != allowedTables.size()) {
                    allowedTables.stream().filter(t -> !statsTables.containsKey(t)).forEach(t -> {
                        statsTables.put(t, new StatsTable(t, platformId, LocalDateTime.now().minusMonths(NB_MONTHS)));
                    });
                }
                handler.handle(Future.succeededFuture(statsTables.values().stream().collect(Collectors.toList())));
            } else {
                handler.handle(Future.failedFuture(ar.cause()));
            }
        });
    }

}
