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

package fr.wseduc.stats.services;

import static org.entcore.common.aggregation.MongoConstants.*;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Map.Entry;

import org.entcore.common.mongodb.MongoDbResult;
import org.entcore.common.service.impl.MongoDbCrudService;
import io.vertx.core.Handler;
import io.vertx.core.MultiMap;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import com.mongodb.QueryBuilder;

import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.webutils.Either;

/**
 * MongoDB implementation of the REST service.
 * Methods are usually self-explanatory.
 */
public class StatsServiceMongoImpl extends MongoDbCrudService implements StatsService{

	private final String collection;
	private final MongoDb mongo;

	public StatsServiceMongoImpl(final String collection) {
		super(collection);
		this.collection = collection;
		this.mongo = MongoDb.getInstance();
	}

	public void listStats(MultiMap d, Handler<Either<String, JsonArray>> handler){
		final List<Entry<String, String>> data = (d != null) ? d.entries() : new ArrayList<>();
		QueryBuilder filterBuilder = QueryBuilder.start();

		//Gets rid of the annoying jQuery underscore query parameter
		int i = 0;
		for(Entry<String, String> entry : data){
			if(entry.getKey().equals("_")){
				data.remove(i);
				break;
			}
			i++;
		}

		if(!data.isEmpty()){
			String groupedByModifier = "";
			boolean structuresCheck = false;
			boolean classesCheck = false;

			for(Entry<String, String> entry : data){
				if(entry.getKey().equals("groupedBy")){
					groupedByModifier = entry.getValue();
					continue;
				}
				else if(entry.getKey().equals("structures"))
					structuresCheck = true;
				else if(entry.getKey().equals("classes"))
					classesCheck = true;

				filterBuilder.and(entry.getKey()+"_id").is(entry.getValue());
			}

			String groupedBy = classesCheck ? "structures/classes" : structuresCheck ? "structures" : "";
			if(groupedByModifier.length() > 0)
				groupedBy = groupedBy.length() == 0 ? groupedByModifier : groupedBy + "/" + groupedByModifier;

			filterBuilder.and(STATS_FIELD_GROUPBY).is(groupedBy);
		} else {
			filterBuilder.put(STATS_FIELD_GROUPBY).exists(false);
		}


		//Stats from September the 1st
		Calendar cal = Calendar.getInstance();
		cal.add(Calendar.MONTH, -12);
		cal.set(Calendar.DAY_OF_MONTH, 1);
		cal.set(Calendar.HOUR_OF_DAY, 0);
		cal.set(Calendar.MINUTE, 0);
		cal.set(Calendar.SECOND, 0);
		cal.set(Calendar.MILLISECOND, 0);

		filterBuilder.and(STATS_FIELD_DATE).greaterThanEquals(MongoDb.formatDate(cal.getTime()));

		//Sort by date - ascending
		JsonObject sortObject = new JsonObject().put("date", -1);

		mongo.find(collection, MongoQueryBuilder.build(filterBuilder), sortObject, new JsonObject(), MongoDbResult.validResultsHandler(handler));
	}

}
