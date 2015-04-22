package fr.wseduc.stats;

import java.text.ParseException;

import org.entcore.common.aggregation.MongoConstants.COLLECTIONS;
import org.entcore.common.http.BaseServer;
import org.entcore.common.mongodb.MongoDbConf;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.core.logging.impl.LoggerFactory;

import fr.wseduc.cron.CronTrigger;
import fr.wseduc.stats.controllers.StatsController;
import fr.wseduc.stats.cron.CronAggregationTask;
import fr.wseduc.stats.filters.WorkflowFilter;

public class Stats extends BaseServer {

	private static final Logger logger = LoggerFactory.getLogger(Stats.class);

	@Override
	public void start() {
		super.start();

		//CRON
		//Default at 00:00AM every day
		final String aggregationCron = container.config().getString("aggregation-cron", "0 0 0 * * ?");
		//Day delta, default : processes yesterday events
		int dayDelta = container.config().getInteger("dayDelta", -1);

		try {
			new CronTrigger(vertx, aggregationCron).schedule(new CronAggregationTask(dayDelta));
		} catch (ParseException e) {
			logger.fatal(e.getMessage(), e);
			vertx.stop();
			return;
		}

		//REST BASICS
		addController(new StatsController(COLLECTIONS.stats.name()));
		MongoDbConf.getInstance().setCollection(COLLECTIONS.stats.name());
		addFilter(new WorkflowFilter(this.vertx.eventBus(), "stats.view", "fr.wseduc.stats.controllers.StatsController|view"));
	}

}
