package fr.wseduc.stats.aggregator.filters;

import java.util.Date;

import com.mongodb.QueryBuilder;

import static fr.wseduc.stats.aggregator.MongoConstants.*;

/**
 * Filters traces by a date interval.
 */
public class DateFilter implements IndicatorFilter {
	
	private Date from, to;

	/**
	 * Creates a new DateFilter which will filter traces based on the two Date arguments.
	 * @param from : Lower bound (inclusive)
	 * @param to : Higher bound (not inclusive)
	 */
	public DateFilter(Date from, Date to) {
		this.from = from;
		this.to = to;
	}

	public void filter(QueryBuilder builder) {
		builder.and(TRACE_FIELD_DATE).greaterThanEquals(from.getTime()).lessThan(to.getTime());
	}

}
