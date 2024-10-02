package fr.wseduc.stats.services;

import java.util.List;
import java.util.Set;

import fr.wseduc.stats.utils.ImportCsvTable;
import fr.wseduc.stats.utils.StatsTable;
import io.vertx.core.AsyncResult;
import io.vertx.core.Handler;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.RowSet;

public interface JobsService {

    void importStats(ImportCsvTable importCsvTable, Handler<AsyncResult<Void>> handler);

    void exportReferential(String entity, String partition, String partitionValue, Handler<AsyncResult<RowSet<Row>>> handler);

    void syncRepository(Handler<AsyncResult<Void>> handler);

    Set<String> getAllowedTables();

    void getAllowedTablesWithLastUpdate(Handler<AsyncResult<List<StatsTable>>> handler);

}
