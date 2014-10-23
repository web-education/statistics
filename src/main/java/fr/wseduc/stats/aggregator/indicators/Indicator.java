package fr.wseduc.stats.aggregator.indicators;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.Calendar;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Map.Entry;

import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import com.mongodb.QueryBuilder;

import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.mongodb.MongoUpdateBuilder;
import fr.wseduc.stats.aggregator.AggregationTools;
import fr.wseduc.stats.aggregator.filters.IndicatorFilter;
import fr.wseduc.stats.aggregator.groups.IndicatorGroup;
import static fr.wseduc.stats.aggregator.MongoConstants.*;

/**
 * An Indicator is an object used to aggregate into a single value multiple ent-core traces from Mongo and write the result as multiple Mongo documents.<br>
 * <br>
 * Indicators contain two collections, Filters and Groups :
 * <ul>
 * 	<li> Filters are used to filter traces (like by date, or user) </li>
 *  <li> Groups are used to group the aggregation by criteria (like the SQL group by clause) </li>
 * </ul>
 * By default, indicators only aggregate traces with the Mongo type field equal to the String passed to the constructor.
 *
 */
public class Indicator {
	
	//MongoDB instance
	protected final MongoDb mongo;
	
	//Indicator key - must match a trace collection type
	private final String indicator_key;
	
	//Filters and groups
	private Collection<IndicatorFilter> filters;
	private Collection<IndicatorGroup> groups;
	
	//Memoization map, used to buffer distinct values from Mongo and avoiding unnecessary database queries.
	private final HashMap<String, JsonArray> memoizeDistincts = new  HashMap<String, JsonArray>();
	
	/**
	 * Creates a new Indicator without filters or groups.<br>
	 * @param key : Traces will be filtered using this String and an equality check against the type of trace.
	 */
	public Indicator(String key){
		this.indicator_key = key;
		this.mongo = MongoDb.getInstance();
		this.filters = new ArrayList<IndicatorFilter>();
		this.groups = new ArrayList<IndicatorGroup>();
	}
	/**
	 * Creates a new Indicator with filters and / or groups.<br>
	 * @param key : Traces will be filtered using this String and an equality check against the type of trace.
	 * @param filters : Filters are used to filter traces further than the default type filtering.
	 * @param groups : Groups are used to group results by several keys or combination of keys.
	 */
	public Indicator(String key, Collection<IndicatorFilter> filters, Collection<IndicatorGroup> groups){
		this.indicator_key = key;
		this.mongo = MongoDb.getInstance();
		this.filters = filters;
		this.groups = groups;
	}
	
	/* GETTERS */
	
	/**
	 * Returns the indicator key.
	 * @return Indicator key
	 */
	protected String getKey(){
		return indicator_key;
	}
	/**
	 * Returns the collection of filters.
	 * @return Indicator filters.
	 */
	protected Collection<IndicatorFilter> getFilters(){
		return filters;
	}
	/**
	 * Returns the collection of groups.
	 * @return Indicator groups.
	 */
	protected Collection<IndicatorGroup> getGroups(){
		return groups;
	}
	
	/* WRITE TO DB */
	
	//Write to the database, shortcut without group
	private Handler<Message<JsonObject>> writeStats(){
		return writeStats(null, null);
	}
	//Write aggregated data to the database, using data from a Mongo count
	private Handler<Message<JsonObject>> writeStats(final IndicatorGroup group, final HashMap<String, String> group_ids){
		return new Handler<Message<JsonObject>>(){
			public void handle(Message<JsonObject> event) {
				if ("ok".equals(event.body().getString("status"))) {
					
					//Retrieve Mongo count result
					int countResult = event.body().getInteger("count");
					
					//If no documents found, write nothing
					if(countResult == 0)
						return;
					
					//Document data, default to today's date at midnight
					Date today = AggregationTools.setToMidnight(Calendar.getInstance());
					
					QueryBuilder criteriaQuery = QueryBuilder.start();
					
					if(group == null){
						//When not using groups, set groupedBy specifically to not exists
						criteriaQuery.put("date").is(MongoDb.formatDate(today)).and("groupedBy").exists(false);
					} else {
						//Retrieve all the group chain keys and append them into groupedBy.
						LinkedList<String> groupedByKeys = new LinkedList<String>();
						groupedByKeys.add(group.getKey());
						
						IndicatorGroup parent = group.getParent();
						while(parent != null){
							groupedByKeys.addFirst(parent.getKey()+"/");
							parent = parent.getParent();
						}
						StringBuilder groupedByString = new StringBuilder();
						for(String groupKey : groupedByKeys){
							groupedByString.append(groupKey);
						}
						criteriaQuery
							.put("date").is(MongoDb.formatDate(today))
							.and("groupedBy").is(groupedByString.toString());
						
						//For the group and its ancestors, retrieve each group id and add it to the document.
						for(Entry<String, String> group_id : group_ids.entrySet()){
							criteriaQuery.and(group_id.getKey()+"_id").is(group_id.getValue());
						}
					}
					
					MongoUpdateBuilder objNewQuery = new MongoUpdateBuilder();
					//Increment the counter
					objNewQuery.inc(indicator_key, countResult);
					
					//Write the document (increments if it already exists, else creates it) 
					mongo.update(STATS_COLLECTION, MongoQueryBuilder.build(criteriaQuery), objNewQuery.build(), true, true);
				} else {
					//TODO : better issue handling
					//No results returned or query issue - do nothing
				}
			}
		};
	}
	
	/* AGGREGATE */
	
	//Action to be performed for each distinct value of the group key in the traces
	private void distinctAction(JsonArray distinctValues, final IndicatorGroup group, HashMap<String, String> group_ids){
		for(final Object distinctValue : distinctValues){
			String groupValue = (String) distinctValue;
			
			//For the group and for each parent group, adding the filter on the group key value in the trace.
			Collection<IndicatorFilter> groupFilters = new ArrayList<IndicatorFilter>();
			groupFilters.addAll(filters);
			for(final Entry<String, String> group_id : group_ids.entrySet()){
				groupFilters.add(new IndicatorFilter() {
					public void filter(QueryBuilder builder) {
						builder.and(group_id.getKey()).is(group_id.getValue());
					}
				});
			}
			groupFilters.add(new IndicatorFilter() {
				public void filter(QueryBuilder builder) {
					builder.and(group.getKey()).is(distinctValue);
				}
			});
			
			//Filter by trace type + custom filters + group & parent groups ids
			final QueryBuilder filteringQuery = QueryBuilder.start(TRACE_FIELD_TYPE).is(indicator_key);
			for(IndicatorFilter filter : groupFilters){
				filter.filter(filteringQuery);
			}
			
			//Cloning the map and adding this group id.
			HashMap<String, String> new_group_ids = new HashMap<String, String>();
			new_group_ids.putAll(group_ids);
			new_group_ids.put(group.getKey(), groupValue);
			
			//Count the traces, then write the document.
			mongo.count(TRACE_COLLECTION, MongoQueryBuilder.build(filteringQuery), writeStats(group, new_group_ids));
			
			//For each child, recurse.
			for(IndicatorGroup child : group.getChildren()){
				aggregateGroup(child, new_group_ids);
			}
		}		
	}
	
	//Aggregation process for a single group, if the group has children this function is recursively called for each child.
	//The group_ids HashMap is an accumulator used to store the parent group(s) trace value(s) (id) which will be written in the Mongo document.
	private void aggregateGroup(final IndicatorGroup group, final HashMap<String, String> group_ids){
		
		//If the memoization map already contains the group distinct key values.
		if(memoizeDistincts.containsKey(group.getKey())){
			JsonArray distinctValues = memoizeDistincts.get(group.getKey());
			distinctAction(distinctValues, group, group_ids);
		} else {
			//Filtering by trace type + custom filters.
			final QueryBuilder filteringQuery = QueryBuilder.start(TRACE_FIELD_TYPE).is(indicator_key);
			for(IndicatorFilter filter : filters){
				filter.filter(filteringQuery);
			}
			//Counting distinct values of group keys in the traces.
			mongo.distinct(TRACE_COLLECTION, group.getKey(), MongoQueryBuilder.build(filteringQuery), new Handler<Message<JsonObject>>(){
				public void handle(Message<JsonObject> event) {
					if ("ok".equals(event.body().getString("status"))) {
						JsonArray distinctValues = event.body().getArray("values", new JsonArray());
						memoizeDistincts.put(group.getKey(), distinctValues);
						distinctAction(distinctValues, group, group_ids);
					} else {
						//TODO : better issue handling
						//No results returned or query issue - do nothing
					}
				}
			});
		}
		
	}
	
	/* MAIN AGGREGATION */
	
	/**
	 * Launch the aggregation process which consists of :
	 * <ul>
	 * 	<li>Filter the traces based on the default filtering and IndicatorFilters if the collection of filters is not empty.</li>
	 *  <li>Count the number of traces.</li>
	 *  <li>Write to the database this aggregated number.</li>
	 *  <li>For each IndicatorGroup, repeat the process recursively.</li>
	 * <ul>
	 */
	public void aggregate(){
		//Filtering by trace type + custom filters.
		QueryBuilder filteringQuery = QueryBuilder.start(TRACE_FIELD_TYPE).is(indicator_key);
		for(IndicatorFilter filter : filters){
			filter.filter(filteringQuery);
		}
		//Counting the results & writing down the aggregation.
		mongo.count(TRACE_COLLECTION, MongoQueryBuilder.build(filteringQuery), writeStats());
		
		for(IndicatorGroup group : groups){
			aggregateGroup(group, new HashMap<String, String>());
		}
	}
	
}
