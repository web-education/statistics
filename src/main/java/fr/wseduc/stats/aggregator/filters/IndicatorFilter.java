package fr.wseduc.stats.aggregator.filters;

import com.mongodb.QueryBuilder;

/**
 * An IndicatorFilter is used by an Indicator to filter traces.
 */
public interface IndicatorFilter {

	/**
	 * Add to an existing QueryBuilder filtering clauses.
	 * @param builder : Already initialized filtering query builder, which can be appended with filtering clauses.
	 */
	public void filter(QueryBuilder builder);
	
}
