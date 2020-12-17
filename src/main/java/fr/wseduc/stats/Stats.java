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

package fr.wseduc.stats;

import java.text.ParseException;

import org.entcore.common.aggregation.MongoConstants.COLLECTIONS;
import org.entcore.common.events.EventHelper;
import org.entcore.common.events.EventStore;
import org.entcore.common.events.EventStoreFactory;
import org.entcore.common.http.BaseServer;
import org.entcore.common.mongodb.MongoDbConf;

import io.reactiverse.pgclient.PgClient;
import io.reactiverse.pgclient.PgPool;
import io.reactiverse.pgclient.PgPoolOptions;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

import fr.wseduc.cron.CronTrigger;
import fr.wseduc.stats.controllers.StatsController;
import fr.wseduc.stats.cron.CronAggregationTask;
import fr.wseduc.stats.filters.WorkflowFilter;
import fr.wseduc.stats.services.PGStatsService;
import fr.wseduc.stats.services.StatsService;
import fr.wseduc.stats.services.StatsServiceMongoImpl;

public class Stats extends BaseServer {

	private static final Logger logger = LoggerFactory.getLogger(Stats.class);

	@Override
	public void start() throws Exception {
		super.start();

		// CRON
		// Default at 00:00AM every day
		final String aggregationCron = config.getString("aggregation-cron");
		// Day delta, default : processes yesterday events
		int dayDelta = config.getInteger("dayDelta", -1);

		if (aggregationCron != null && !aggregationCron.trim().isEmpty()) {
			try {
				new CronTrigger(vertx, aggregationCron).schedule(new CronAggregationTask(dayDelta));
			} catch (ParseException e) {
				logger.fatal(e.getMessage(), e);
				vertx.close();
				return;
			}
		}

		final String platformId;
		final String eventStoreConf = (String) vertx.sharedData().getLocalMap("server").get("event-store");
		final JsonObject eventStoreConfig;
		if (eventStoreConf != null) {
			eventStoreConfig = new JsonObject(eventStoreConf);
			platformId = eventStoreConfig.getString("platform");
		} else {
			platformId = null;
			eventStoreConfig = null;
		}

		final StatsService statsService;
		final JsonObject readPGConfig = config.getJsonObject("read-pg-config");
		final boolean oldStats = config.getBoolean("mongo-stats-service", false);
		if (readPGConfig != null && !readPGConfig.isEmpty() && !oldStats) {
			final PgPoolOptions options = new PgPoolOptions().setPort(readPGConfig.getInteger("port", 5432))
					.setHost(readPGConfig.getString("host")).setDatabase(readPGConfig.getString("database"))
					.setUser(readPGConfig.getString("user")).setPassword(readPGConfig.getString("password"))
					.setMaxSize(readPGConfig.getInteger("pool-size", 5));
			PgPool pgPool = PgClient.pool(vertx, options);
			statsService = new PGStatsService(platformId, config.getJsonObject("api-allowed-values"));
			((PGStatsService) statsService).setReadPgPool(pgPool);
		} else if (eventStoreConfig != null && eventStoreConfig.getJsonObject("postgresql-slave") != null && !oldStats) {
			final JsonObject eventStorePGConfig = eventStoreConfig.getJsonObject("postgresql-slave");
			final PgPoolOptions options = new PgPoolOptions()
				.setPort(eventStorePGConfig.getInteger("port", 5432))
				.setHost(eventStorePGConfig.getString("host"))
				.setDatabase(eventStorePGConfig.getString("database"))
				.setUser(eventStorePGConfig.getString("user"))
				.setPassword(eventStorePGConfig.getString("password"))
				.setMaxSize(eventStorePGConfig.getInteger("pool-size", 5));
			PgPool pgPool = PgClient.pool(vertx, options);
			statsService = new PGStatsService(platformId, config.getJsonObject("api-allowed-values"));
			((PGStatsService) statsService).setReadPgPool(pgPool);
        } else {
			statsService = new StatsServiceMongoImpl(COLLECTIONS.stats.name());
		}

		final StatsController statsController = new StatsController(COLLECTIONS.stats.name());
		statsController.setStatsService(statsService);
		final EventStore eventStore = EventStoreFactory.getFactory().getEventStore(Stats.class.getSimpleName());
		final EventHelper eventHelper =  new EventHelper(eventStore);
		statsController.setEventHelper(eventHelper);

		// REST BASICS
		addController(statsController);
		MongoDbConf.getInstance().setCollection(COLLECTIONS.stats.name());
		addFilter(new WorkflowFilter(this.vertx.eventBus(), "stats.view", "fr.wseduc.stats.controllers.StatsController|view"));
	}

}
