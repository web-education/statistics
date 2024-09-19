package fr.wseduc.stats.services;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.entcore.common.validation.ValidationException;

import fr.wseduc.stats.utils.CsvUtils;
import fr.wseduc.stats.utils.DataTable;
import fr.wseduc.stats.utils.ImportCsvTable;
import fr.wseduc.webutils.Utils;
import io.vertx.core.AsyncResult;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.pgclient.PgPool;

public class DefaultJobsServiceImpl implements JobsService {

    private static final Logger log = LoggerFactory.getLogger(DefaultJobsServiceImpl.class);

    private static final long NB_MONTHS = 13;
    private final Vertx vertx;
    private final Set<String> allowedTables;
    private PgPool pgPool;
    private final JsonObject allowedValues;
    private final String platformId;

    public DefaultJobsServiceImpl(Vertx vertx, String platformId, JsonObject allowedValues) {
        this.vertx = vertx;
        if (allowedValues == null || allowedValues.isEmpty()) {
            this.allowedValues = Utils.loadFromResource("api-allowed-values.json");
        } else {
            this.allowedValues = allowedValues;
        }
        this.platformId = platformId;
        final List<String> indicators = this.allowedValues.getJsonArray("indicators").getList();
        final List<String> levels = this.allowedValues.getJsonArray("entities-levels").getList();
        final List<String> frequencies = this.allowedValues.getJsonArray("frequencies").getList();
        final List<String> devices = Arrays.asList("", "_device");
        this.allowedTables = initAllowedTables(indicators, levels, frequencies, devices);
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
            log.error("Invalid table name : " + tableName);
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
                    query += " ON CONFLICT (id) DO UPDATE SET " + columnsNames.stream()
                            .filter(c -> !"id".equals(c)).map(c -> c + " = EXCLUDED." + c)
                            .collect(Collectors.joining(", "));
                }
                pgPool.preparedQuery(query).executeBatch(dataTable.getData(), ar2 -> {
                    if (ar2.succeeded()) {
                        handler.handle(Future.succeededFuture());
                    } else {
                        log.error("Error when insert data in table : " + tableName, ar2.cause());
                        handler.handle(Future.failedFuture(ar2.cause()));
                    }
                });
            } else {
                log.error("Error when read csv", ar.cause());
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

}
