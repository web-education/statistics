package fr.wseduc.stats.services;

import java.util.List;
import java.util.Map.Entry;

import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;

import fr.wseduc.webutils.Either;

/**
 * Generic REST service for Stats.
 */
public interface StatsService {

	public void listStats(List<Entry<String, String>> data, Handler<Either<String, JsonArray>> handler);
	
}
