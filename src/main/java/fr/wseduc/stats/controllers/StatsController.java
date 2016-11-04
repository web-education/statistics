/*
 * Copyright © "Open Digital Education" (SAS “WebServices pour l’Education”), 2014
 *
 * This program is published by "Open Digital Education" (SAS “WebServices pour l’Education”).
 * You must indicate the name of the software and the company in any production /contribution
 * using the software and indicate on the home page of the software industry in question,
 * "powered by Open Digital Education" with a reference to the website: https: //opendigitaleducation.com/.
 *
 * This program is free software, licensed under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, version 3 of the License.
 *
 * You can redistribute this application and/or modify it since you respect the terms of the GNU Affero General Public License.
 * If you modify the source code and then use this modified source code in your creation, you must make available the source code of your modifications.
 *
 * You should have received a copy of the GNU Affero General Public License along with the software.
 * If not, please see : <http://www.gnu.org/licenses/>. Full compliance requires reading the terms of this license and following its directives.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

package fr.wseduc.stats.controllers;

import static org.entcore.common.http.response.DefaultResponseHandler.*;

import java.util.ArrayList;
import java.util.Map;

import fr.wseduc.stats.filters.ExportStatsResourceProvider;
import fr.wseduc.stats.filters.ListStatsResourceProvider;
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
	 * Returns the user functions allowed to see the statistics at project scope and export them, if put in the configuration Json file.
	 * @param request
	 */
	@Get("/allowed")
	@SecuredAction(value="", type = ActionType.AUTHENTICATED)
	public void listAllowedFunctions(HttpServerRequest request) {
		renderJson(request, container.config().getArray("overviewAllowedFunctions", new JsonArray()));
	}

	/**
	 * Returns the list of statistics.<br>
	 * Request may contain filters as query parameters.
	 * @param request Client request
	 */
	@Get("/list")
	@SecuredAction(value = list, type = ActionType.RESOURCE)
	@ResourceFilter(ListStatsResourceProvider.class)
	public void listStats(final HttpServerRequest request) {
		statsService.listStats(request.params().entries(), arrayResponseHandler(request));
	}

	/**
	 * Exports global aggregations.
	 * @param request Client request
	 */
	@Get("/export")
	@SecuredAction(value = export, type = ActionType.RESOURCE)
	@ResourceFilter(ExportStatsResourceProvider.class)
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

		statsService.listStats(new ArrayList<Map.Entry<String,String>>(), handler);
	}
}
