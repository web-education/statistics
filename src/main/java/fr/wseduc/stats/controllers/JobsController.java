package fr.wseduc.stats.controllers;


import fr.wseduc.rs.Get;
import fr.wseduc.rs.Put;
import fr.wseduc.security.SecuredAction;
import fr.wseduc.stats.services.JobsService;
import fr.wseduc.stats.utils.CsvUtils;
import fr.wseduc.webutils.http.BaseController;
import io.vertx.core.http.HttpServerRequest;

import static org.entcore.common.http.response.DefaultResponseHandler.asyncVoidResponseHandler;

public class JobsController extends BaseController {

    private JobsService jobsService;

    @Put("/import/stats/:indicator")
    @SecuredAction("stats.import")
    public void importStats(HttpServerRequest request) {
        CsvUtils.uploadImport(vertx, request, config.getString("stats-impory-path", System.getProperty("java.io.tmpdir")), res -> {
			if (res.succeeded()) {
				jobsService.importStats(res.result(), asyncVoidResponseHandler(request));
			} else {
				badRequest(request);
			}
		});
    }

	public void setJobsService(JobsService jobsService) {
		this.jobsService = jobsService;
	}

}