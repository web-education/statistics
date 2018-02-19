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
import org.entcore.common.http.BaseServer;
import org.entcore.common.mongodb.MongoDbConf;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

import fr.wseduc.cron.CronTrigger;
import fr.wseduc.stats.controllers.StatsController;
import fr.wseduc.stats.cron.CronAggregationTask;
import fr.wseduc.stats.filters.WorkflowFilter;

public class Stats extends BaseServer {

	private static final Logger logger = LoggerFactory.getLogger(Stats.class);

	@Override
	public void start() throws Exception {
		super.start();

		//CRON
		//Default at 00:00AM every day
		final String aggregationCron = config.getString("aggregation-cron");
		//Day delta, default : processes yesterday events
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

		//REST BASICS
		addController(new StatsController(COLLECTIONS.stats.name()));
		MongoDbConf.getInstance().setCollection(COLLECTIONS.stats.name());
		addFilter(new WorkflowFilter(this.vertx.eventBus(), "stats.view", "fr.wseduc.stats.controllers.StatsController|view"));
	}

}
