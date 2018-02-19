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

package fr.wseduc.stats.cron;

import java.util.Calendar;
import java.util.Date;
import java.util.ServiceLoader;

import org.entcore.common.aggregation.processing.AggregationProcessing;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

public class CronAggregationTask implements Handler<Long>{

	private static final Logger log = LoggerFactory.getLogger(CronAggregationTask.class);

	private final int dayDelta;

	public CronAggregationTask(int dayDelta) {
		this.dayDelta = dayDelta;
	}

	@Override
	public void handle(Long event) {
		Calendar cal = Calendar.getInstance();
		cal.add(Calendar.DAY_OF_YEAR, dayDelta);
		final Date processingDate = cal.getTime();
		log.info("[Aggregation][Processing] Executing aggregation task, date marker set at : {"+processingDate.toString()+"}");
		ServiceLoader<AggregationProcessing> implementations = ServiceLoader.load(AggregationProcessing.class);

		for(AggregationProcessing processor: implementations){
			final Date start = new Date();
			log.info("[Aggregation][Processing] Launching implementation : "+processor.getClass().getName());
			processor.process(processingDate, new Handler<JsonObject>() {
				public void handle(JsonObject event) {
					final Date end = new Date();
					log.info("[Aggregation][Processing] Over, took ["+(end.getTime() - start.getTime())+"] ms");
				}
			});
		}
	}


}
