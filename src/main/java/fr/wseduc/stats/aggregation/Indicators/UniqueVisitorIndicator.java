package fr.wseduc.stats.aggregation.Indicators;

import java.util.Collection;

import static org.entcore.common.aggregation.MongoConstants.*;
import org.entcore.common.aggregation.filters.dbbuilders.MongoDBBuilder;
import org.entcore.common.aggregation.filters.mongo.IndicatorFilterMongoImpl;
import org.entcore.common.aggregation.groups.IndicatorGroup;
import org.entcore.common.aggregation.indicators.mongo.IndicatorMongoImpl;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import fr.wseduc.mongodb.MongoQueryBuilder;

/**
 * Indicator to measure unique visitors.
 */
public class UniqueVisitorIndicator extends IndicatorMongoImpl{
	
	private static final String STATS_UNIQUEVISITORS_KEY = "UNIQUE_VISITORS";

	public UniqueVisitorIndicator(){
		super(TRACE_TYPE_CONNEXION);
		this.setWriteKey(STATS_UNIQUEVISITORS_KEY);
	}
	public UniqueVisitorIndicator(Collection<IndicatorFilterMongoImpl> filters, Collection<IndicatorGroup> groups) {
		super(TRACE_TYPE_CONNEXION, filters, groups);
		this.setWriteKey(STATS_UNIQUEVISITORS_KEY);
	}

	@Override
	protected void countTraces(MongoDBBuilder filteringQuery, final Handler<Integer> callBack){
		//Aggregates connexions with distinct user id values as unique visitors.
		mongo.distinct(COLLECTIONS.events.name(), TRACE_FIELD_USER, MongoQueryBuilder.build(filteringQuery), new Handler<Message<JsonObject>>(){
			public void handle(Message<JsonObject> message) {
				if ("ok".equals(message.body().getString("status"))) {
					JsonArray distinctValues = message.body().getArray("values", new JsonArray());
					callBack.handle(distinctValues.size());
				} else {
					callBack.handle(0);
				}
			}
		});
	}
}
