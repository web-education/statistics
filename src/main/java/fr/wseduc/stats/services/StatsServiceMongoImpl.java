package fr.wseduc.stats.services;

import static org.entcore.common.aggregation.MongoConstants.*;

import java.util.Calendar;
import java.util.List;
import java.util.Map.Entry;

import org.entcore.common.mongodb.MongoDbResult;
import org.entcore.common.service.impl.MongoDbCrudService;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

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

	public void listStats(List<Entry<String, String>> data, Handler<Either<String, JsonArray>> handler){
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

		int year = cal.get(Calendar.YEAR);
		if(cal.get(Calendar.MONTH) < 8)
			year--;

		cal.set(Calendar.MILLISECOND, 0);
		cal.set(year, 8, 1, 0, 0, 0);

		filterBuilder.and(STATS_FIELD_DATE).greaterThanEquals(MongoDb.formatDate(cal.getTime()));

		//Sort by date - ascending
		JsonObject sortObject = new JsonObject().putNumber("date", -1);

		mongo.find(collection, MongoQueryBuilder.build(filterBuilder), sortObject, new JsonObject(), MongoDbResult.validResultsHandler(handler));
	}

}
