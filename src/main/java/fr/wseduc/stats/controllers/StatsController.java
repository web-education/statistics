package fr.wseduc.stats.controllers;

import static org.entcore.common.http.response.DefaultResponseHandler.*;

import java.util.ArrayList;
import java.util.Map;

import fr.wseduc.stats.filters.StatsFilter;
import fr.wseduc.stats.services.StatsService;
import fr.wseduc.stats.services.StatsServiceMongoImpl;
import fr.wseduc.rs.*;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;
import fr.wseduc.webutils.Either;

import org.entcore.common.http.filter.ResourceFilter;
import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.vertx.java.core.Handler;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

/**
 * Vert.x backend controller for the application using Mongodb.
 */
public class StatsController extends MongoDbControllerHelper {

	//Computation service
	private final StatsService statsService;

	//Permissions
	private static final String
		view = "stats.view",
		list = "",
		export = "";

	/**
	 * Creates a new controller.
	 * @param collection Name of the collection stored in the mongoDB database.
	 */
	public StatsController(String collection) {
		super(collection);
		statsService = new StatsServiceMongoImpl(collection);
	}

	/**
	 * Displays the home view.
	 * @param request Client request
	 */
	@Get("")
	@SecuredAction(value = view)
	public void view(HttpServerRequest request) {
		renderView(request);
	}

	/**
	 * Returns the list of statistics.<br>
	 * Request may contain filters as query parameters.
	 * @param request Client request
	 */
	@Get("/list")
	@SecuredAction(value = list, type = ActionType.RESOURCE)
	@ResourceFilter(StatsFilter.class)
	public void listStats(final HttpServerRequest request) {
		statsService.listStats(request.params().entries(), arrayResponseHandler(request));
	}

	/**
	 * Exports global aggregations.
	 * @param request Client request
	 */
	@Get("/export")
	@SecuredAction(value = export, type = ActionType.RESOURCE)
	@ResourceFilter(StatsFilter.class)
	public void export(final HttpServerRequest request) {
		Handler<Either<String, JsonArray>> handler = new Handler<Either<String, JsonArray>>() {
			@Override
			public void handle(Either<String, JsonArray> r) {
				if (r.isRight()) {
					processTemplate(request, "text/export.template.csv",
							new JsonObject().putArray("list", r.right().getValue()), new Handler<String>() {
						@Override
						public void handle(final String export) {
							if (export != null) {
								request.response().putHeader("Content-Type", "application/csv");
								request.response().putHeader("Content-Disposition",
										"attachment; filename=export-stats.csv");
								request.response().end(export);
							} else {
								renderError(request);
							}
						}
					});
				} else {
					renderJson(request, new JsonObject().putString("error", r.left().getValue()), 400);
				}
			}
		};
		statsService.listStats(new ArrayList<Map.Entry<String,String>>(), handler);
	}
}
