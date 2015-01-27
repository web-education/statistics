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
import fr.wseduc.webutils.request.RequestUtils;

import org.entcore.common.http.filter.ResourceFilter;
import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.entcore.common.user.UserInfos;
import org.entcore.common.user.UserUtils;
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
	 * Returns the user functions allowed to see the statistics at project scope and export them, if put in the configuration Json file.
	 * @param request
	 */
	@Get("/allowed")
	@SecuredAction(value="", type = ActionType.AUTHENTICATED)
	public void listAllowedFunctions(HttpServerRequest request) {
		renderJson(request, container.config().getArray("overviewAllowedFunctions", new JsonArray()));
	}

	//True : If the user has a function contained in the allowed array.
	private boolean isUserAllowed(UserInfos user){
		JsonArray allowedFunctions = container.config().getArray("overviewAllowedFunctions", new JsonArray());

		if(allowedFunctions.size() == 0)
			return true;

		for(Object functionObj : allowedFunctions){
			String function = (String) functionObj;
			if(user.getFunctions().containsKey(function))
					return true;
		}

		return false;
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
		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			public void handle(final UserInfos user) {
				if (user != null) {
					//If no structures or classes filters are specified, meaning we are listing at a global scope :
					if(!request.params().contains("structures") && !request.params().contains("classes")){
						//Then we check if specific functions are configured, if so we ensure that the user is at proper credentials level.
						if(!isUserAllowed(user)){
							//If not: return 401
							unauthorized(request);
							return;
						}
					}
					statsService.listStats(request.params().entries(), arrayResponseHandler(request));
				} else {
					badRequest(request);
				}
			}
		});
	}

	/**
	 * Exports global aggregations.
	 * @param request Client request
	 */
	@Get("/export")
	@SecuredAction(value = export, type = ActionType.RESOURCE)
	@ResourceFilter(StatsFilter.class)
	public void export(final HttpServerRequest request) {
		final Handler<Either<String, JsonArray>> handler = new Handler<Either<String, JsonArray>>() {
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

		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			public void handle(final UserInfos user) {
				if (user != null) {
					//If only specific functions can access export :
					if(isUserAllowed(user)){
						statsService.listStats(new ArrayList<Map.Entry<String,String>>(), handler);
					} else {
						unauthorized(request);;
					}
				} else {
					badRequest(request);
				}
			}
		});
	}
}
