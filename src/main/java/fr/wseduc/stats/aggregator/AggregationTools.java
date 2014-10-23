package fr.wseduc.stats.aggregator;

import java.util.Calendar;
import java.util.Date;

public class AggregationTools {

	//Sets a calendar date to midnght, then returns a Date representation.
	public static Date setToMidnight(Calendar cal){
		cal.set(Calendar.HOUR_OF_DAY, 0);
		cal.set(Calendar.MINUTE, 0);
		cal.set(Calendar.SECOND, 0);
		cal.set(Calendar.MILLISECOND, 0);
		return cal.getTime();
	}
}
