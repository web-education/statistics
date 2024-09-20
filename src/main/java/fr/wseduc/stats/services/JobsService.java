package fr.wseduc.stats.services;

import java.util.Set;

import fr.wseduc.stats.utils.ImportCsvTable;
import io.vertx.core.AsyncResult;
import io.vertx.core.Handler;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.RowSet;

public interface JobsService {

    void importStats(ImportCsvTable importCsvTable, Handler<AsyncResult<Void>> handler);

    void exportReferential(String entity, String partition, String partitionValue, Handler<AsyncResult<RowSet<Row>>> handler);

    Set<String> getAllowedTables();

}
