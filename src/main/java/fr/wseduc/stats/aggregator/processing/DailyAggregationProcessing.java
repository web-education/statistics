package fr.wseduc.stats.aggregator.processing;

import java.util.Calendar;
import java.util.Date;

import com.mongodb.QueryBuilder;

import static fr.wseduc.stats.aggregator.MongoConstants.*;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.stats.aggregator.AggregationTools;
import fr.wseduc.stats.aggregator.indicators.Indicator;

/**
 * Daily traces aggregation routine.
 */
public class DailyAggregationProcessing extends AggregationProcessing{

	private final MongoDb mongo = MongoDb.getInstance();
	
	/**
	 * Launch the aggregation routine for the current day.
	 */
	@Override
	public void process(){
		process(new Date());
	}
	/**
	 * Launch the aggregation routine for a specific day.
	 * @param day : Traces from that day will be processed.
	 */
	public void process(Date day){
		Calendar calendarDay = Calendar.getInstance();
		calendarDay.setTime(day);
		Date lowerDay = AggregationTools.setToMidnight(calendarDay);
		calendarDay.add(Calendar.DATE, 1);
		Date higherDay = calendarDay.getTime();
		
		//Cleanup if stats documents already exist today.
		QueryBuilder statsFilter = QueryBuilder.start().put(STATS_FIELD_DATE).greaterThanEquals(MongoDb.formatDate(lowerDay)).lessThan(MongoDb.formatDate(higherDay));
		
		mongo.delete(STATS_COLLECTION, MongoQueryBuilder.build(statsFilter));
		
		for(Indicator indicator: indicators){
			indicator.aggregate();
		}
	}
	
}
