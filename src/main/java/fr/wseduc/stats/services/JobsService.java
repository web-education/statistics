package fr.wseduc.stats.services;

import java.util.Set;

import fr.wseduc.stats.utils.ImportCsvTable;
import io.vertx.core.AsyncResult;
import io.vertx.core.Handler;

public interface JobsService {

    void importStats(ImportCsvTable importCsvTable, Handler<AsyncResult<Void>> handler);

    Set<String> getAllowedTables();

}
