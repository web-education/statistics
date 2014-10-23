package fr.wseduc.stats.aggregator;

/**
 * List of MongoDB constants needed for aggregation processing.
 */
public class MongoConstants {
	
	//COLLECTION NAMES
	public static final String TRACE_COLLECTION = "traces";
	public static final String STATS_COLLECTION = "stats";

	//TRACE COLLECTION FIELD NAMES
	public static final String TRACE_FIELD_TYPE = "type";
	public static final String TRACE_FIELD_DATE = "timestamp";
	
	//TRACE COLLECTION TYPES
	public static final String TRACE_TYPE_CONNEXION = "connexion";
	
	//STATS COLLECTION FIELD NAMES
	public static final String STATS_FIELD_DATE = "date";
}
