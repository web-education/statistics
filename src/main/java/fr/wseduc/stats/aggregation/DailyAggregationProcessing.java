package fr.wseduc.stats.aggregation;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;

import org.entcore.common.aggregation.AggregationTools;
import org.entcore.common.aggregation.AggregationTools.HandlerChainer;
import org.entcore.common.aggregation.MongoConstants.COLLECTIONS;
import org.entcore.common.aggregation.filters.IndicatorFilter;
import org.entcore.common.aggregation.filters.mongo.DateFilter;
import org.entcore.common.aggregation.groups.IndicatorGroup;
import org.entcore.common.aggregation.indicators.Indicator;
import org.entcore.common.aggregation.indicators.mongo.IndicatorMongoImpl;
import org.entcore.common.aggregation.processing.AggregationProcessing;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.json.JsonObject;

import com.mongodb.QueryBuilder;

import static org.entcore.common.aggregation.MongoConstants.*;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.stats.aggregation.Indicators.UniqueVisitorIndicator;

/**
 * Daily traces aggregation routine for One.
 */
public class DailyAggregationProcessing extends AggregationProcessing{

	private final MongoDb mongo = MongoDb.getInstance();

	/**
	 * Cleanup if stats documents already exist.
	 * @param day : Day to clean up.
	 */
	public void cleanUp(Date day){
		Calendar calendarDay = Calendar.getInstance();
		calendarDay.setTime(day);
		Date lowerDay = AggregationTools.setToMidnight(calendarDay);
		calendarDay.add(Calendar.DATE, 1);
		Date higherDay = AggregationTools.setToMidnight(calendarDay);

		QueryBuilder statsFilter = QueryBuilder.start().put(STATS_FIELD_DATE).greaterThanEquals(MongoDb.formatDate(lowerDay)).lessThan(MongoDb.formatDate(higherDay));
		mongo.delete(COLLECTIONS.stats.name(), MongoQueryBuilder.build(statsFilter));
	}

	private IndicatorMongoImpl createHourPeakIndicator(final Date day, int hour){
		IndicatorMongoImpl hourPeakIndicator = new IndicatorMongoImpl(TRACE_TYPE_CONNEXION);
		Calendar calendarDay = Calendar.getInstance();
		calendarDay.setTime(day);
		final Date lowerHour = AggregationTools.setHourTo(calendarDay, hour);
		final Date higherHour = AggregationTools.setHourTo(calendarDay, hour+1);

		hourPeakIndicator.setWriteKey(TRACE_TYPE_CONNEXION+"_H"+hour);
		hourPeakIndicator.addFilter(new DateFilter(lowerHour, higherHour));

		return hourPeakIndicator;
	}

	private void addDayFilter(Indicator i, Date day){
		Calendar calendarDay = Calendar.getInstance();
		calendarDay.setTime(day);
		Date lowerDay = AggregationTools.setToMidnight(calendarDay);
		calendarDay.add(Calendar.DATE, 1);
		Date higherDay = AggregationTools.setToMidnight(calendarDay);

		IndicatorFilter dayFilter = new DateFilter(lowerDay, higherDay);

		i.addFilter(dayFilter);
	}

	private void addDefaultDayIndicators(Date day){
		ArrayList<IndicatorMongoImpl> dayIndicators = new ArrayList<>();

		/// SET INDICATORS HERE & ADD THEM TO THE ARRAY LIST

		//Connexions
		IndicatorMongoImpl connexionIndicator = new IndicatorMongoImpl(TRACE_TYPE_CONNEXION);
		//Connexion hour peaks
		IndicatorMongoImpl[] hourPeakIndicators = new IndicatorMongoImpl[24];
		for(int i = 0; i < 24; i++){
			hourPeakIndicators[i] = createHourPeakIndicator(day, i);
		}

		//Account creation, deletion & activation
		IndicatorMongoImpl userCreationIndicator = new IndicatorMongoImpl(TRACE_TYPE_CREATE_USER);
		IndicatorMongoImpl userDeletionIndicator = new IndicatorMongoImpl(TRACE_TYPE_DELETE_USER);
		IndicatorMongoImpl userActivationIndicator = new IndicatorMongoImpl(TRACE_TYPE_ACTIVATION);

		//Add to arraylist
		dayIndicators.add(connexionIndicator);
		dayIndicators.add(userCreationIndicator);
		dayIndicators.add(userDeletionIndicator);
		dayIndicators.add(userActivationIndicator);

		////////////////////////////////////////////////////

		//Add to every indicator a filter by day
		for(Indicator indicator: dayIndicators){
			addDayFilter(indicator, day);
			indicators.add(indicator);
		}

		//For hour peaks, skip adding the day filter
		for(IndicatorMongoImpl i : hourPeakIndicators){
			indicators.add(i);
		}
	}

	private void addDefaultMonthlyIndicators(Date day){
		Calendar calendarDay = Calendar.getInstance();
		calendarDay.setTime(day);
		calendarDay.add(Calendar.DATE, 1);
		Date higherDay = AggregationTools.setToMidnight(calendarDay);
		calendarDay.add(Calendar.DATE, -30);
		Date lowerDay = calendarDay.getTime();

		ArrayList<IndicatorMongoImpl> monthlyIndicators = new ArrayList<>();

		/// SET INDICATORS HERE & ADD THEM TO THE ARRAY LIST

		//Unique visitors
		IndicatorMongoImpl uniqueVisitorIndicator = new UniqueVisitorIndicator();

		//Add to arraylist
		monthlyIndicators.add(uniqueVisitorIndicator);

		////////////////////////////////////////////////////

		//Add to every indicator a filter to get traces from the last 30 days
		IndicatorFilter monthlyFilter = new DateFilter(lowerDay, higherDay);

		for(Indicator indicator: monthlyIndicators){
			indicator.addFilter(monthlyFilter);
			indicators.add(indicator);
		}
	}

	private void addDefaultSeptemberIndicators(Date day){
		Calendar calendarDay = Calendar.getInstance();
		calendarDay.setTime(day);
		calendarDay.add(Calendar.DATE, 1);
		Date higherDay = AggregationTools.setToMidnight(calendarDay);

		int year = calendarDay.get(Calendar.YEAR);
		if(calendarDay.get(Calendar.MONTH) < 8)
			year--;

		calendarDay.set(year, 8, 1, 0, 0, 0);
		calendarDay.set(Calendar.MILLISECOND, 0);
		Date september = calendarDay.getTime();

		ArrayList<IndicatorMongoImpl> septemberIndicators = new ArrayList<>();

		/// SET INDICATORS HERE & ADD THEM TO THE ARRAY LIST

		////////////////////////////////////////////////////

		//Add to every indicator a filter to get traces from september 1
		IndicatorFilter septemberFilter = new DateFilter(september, higherDay);

		for(Indicator indicator: septemberIndicators){
			indicator.addFilter(septemberFilter);
			indicators.add(indicator);
		}
	}

	private HandlerChainer<Indicator, Message<JsonObject>> chainIndicators(){
		HandlerChainer<Indicator, Message<JsonObject>> chainer = new HandlerChainer<Indicator, Message<JsonObject>>(){
			protected void executeItem(Indicator indicator, Handler<Message<JsonObject>> nextCallback) {
				indicator.aggregate(nextCallback);
			}
		};

		for(Indicator indicator: indicators){
			chainer.chainItem(indicator);
		}

		return chainer;
	}

	/**
	 * Launch the aggregation routine for the current day with default indicators.
	 * @param callBack : Handler called when processing is over.
	 */
	@Override
	public void process(Handler<Message<JsonObject>> callBack){
		process(new Date(), callBack);
	}
	/**
	 * Launch the aggregation routine for a specific day with default indicators.
	 * @param day : Traces from that day will be processed.
	 * @param callBack : Handler called when processing is over.
	 */
	public void process(Date day, Handler<Message<JsonObject>> callBack){
		//Sets recording date to midnight at "day" parameter time
		Calendar dayCalendar = Calendar.getInstance();
		dayCalendar.setTime(day);
		Date recordingDate = AggregationTools.setToMidnight(dayCalendar);

		//Clean up stats from the day if they already exist.
		cleanUp(day);

		//Adding default indicators
		addDefaultDayIndicators(day);
		addDefaultMonthlyIndicators(day);
		addDefaultSeptemberIndicators(day);

		///// Default groups :
		//Profile
		IndicatorGroup profileGroup = new IndicatorGroup(TRACE_FIELD_PROFILE);
		//Structure + Structure/Profile + Structure/Classes + Structure/Classes/Profile
		IndicatorGroup structureGroup = new IndicatorGroup(TRACE_FIELD_STRUCTURES)
			.addChild(new IndicatorGroup(TRACE_FIELD_CLASSES).addChild(TRACE_FIELD_PROFILE))
			.addChild(new IndicatorGroup(TRACE_FIELD_PROFILE));

		//Adding groups
		for(Indicator indic : indicators){
			indic.addGroup(profileGroup)
				 .addGroup(structureGroup);
		}

		///// Special treatment for the service access Indicator : indicator has to be also grouped by module name :
		IndicatorMongoImpl serviceAccessIndicator = new IndicatorMongoImpl(TRACE_TYPE_SVC_ACCESS);

		//Add day filter
		addDayFilter(serviceAccessIndicator, day);

		//Module
		IndicatorGroup moduleGroup = new IndicatorGroup(TRACE_FIELD_MODULE);
		//Profile/Module
		IndicatorGroup profileModuleGroup = new IndicatorGroup(TRACE_FIELD_PROFILE).addChild(TRACE_FIELD_MODULE);

		//Structure
		IndicatorGroup structGroup = new IndicatorGroup(TRACE_FIELD_STRUCTURES);
		//Structure/Module
		structGroup.addChild(TRACE_FIELD_MODULE)
		//Structure/Profil/Module
			.addAndReturnChild(TRACE_FIELD_PROFILE)
				.addChild(TRACE_FIELD_MODULE);
		//Structure/Class/Profile/Module
		IndicatorGroup classGroup = new IndicatorGroup(TRACE_FIELD_CLASSES);
		structGroup
			.addAndReturnChild(classGroup)
				.addChild(TRACE_FIELD_MODULE)
			.addAndReturnChild(TRACE_FIELD_PROFILE)
				.addChild(TRACE_FIELD_MODULE);

		serviceAccessIndicator
			.addGroup(moduleGroup)
			.addGroup(profileModuleGroup)
			.addGroup(structGroup);

		indicators.add(serviceAccessIndicator);

		////// Setting the recording time for all indicators
		for(Indicator i : indicators){
			i.setWriteDate(recordingDate);
		}

		////// Chaining Indicators and executing the process.
		chainIndicators().executeChain(callBack);

	}

	/**
	 * Process without default indicators.
	 * @param callBack : Handler called when processing is over.
	 */
	public void processBlank(Handler<Message<JsonObject>> callBack){
		// Chaining Indicators
		chainIndicators().executeChain(callBack);
	}

}
