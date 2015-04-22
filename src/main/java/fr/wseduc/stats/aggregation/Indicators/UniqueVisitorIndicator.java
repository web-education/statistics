package fr.wseduc.stats.aggregation.Indicators;

import java.util.Collection;

import static org.entcore.common.aggregation.MongoConstants.*;

import org.entcore.common.aggregation.filters.mongo.IndicatorFilterMongoImpl;
import org.entcore.common.aggregation.groups.IndicatorGroup;
import org.entcore.common.aggregation.indicators.mongo.IndicatorMongoImpl;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

/**
 * Indicator to measure unique visitors.
 */
public class UniqueVisitorIndicator extends IndicatorMongoImpl{

	public static final String STATS_UNIQUEVISITORS_KEY = "UNIQUE_VISITORS";

	public UniqueVisitorIndicator(){
		super(TRACE_TYPE_CONNEXION);
		this.setWriteKey(STATS_UNIQUEVISITORS_KEY);
	}
	public UniqueVisitorIndicator(Collection<IndicatorFilterMongoImpl> filters, Collection<IndicatorGroup> groups) {
		super(TRACE_TYPE_CONNEXION, filters, groups);
		this.setWriteKey(STATS_UNIQUEVISITORS_KEY);
	}

	@Override
	protected void customizeGroupBy(JsonObject groupBy){
		groupBy
			.getObject("$group", new JsonObject())
				.putObject("userIds", new JsonObject()
					.putString("$addToSet", "$"+TRACE_FIELD_USER));
	}

	@Override
	protected void customizePipeline(JsonArray pipeline){
		pipeline.add(new JsonObject()
			.putObject("$project", new JsonObject()
				.putObject("count", new JsonObject()
					.putString("$size", "$userIds"))));
	}
}
