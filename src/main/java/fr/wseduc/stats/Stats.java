package fr.wseduc.stats;

import java.text.ParseException;

import org.entcore.common.aggregation.MongoConstants.COLLECTIONS;
import org.entcore.common.http.BaseServer;
import org.entcore.common.http.filter.ShareAndOwner;
import org.entcore.common.mongodb.MongoDbConf;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.core.logging.impl.LoggerFactory;

import fr.wseduc.cron.CronTrigger;
import fr.wseduc.stats.controllers.StatsController;
import fr.wseduc.stats.cron.CronAggregationTask;

public class Stats extends BaseServer {
	
	private static final Logger logger = LoggerFactory.getLogger(Stats.class);

	@Override
	public void start() {
		super.start();
		
		//CRON
		//Default at 11:59PM every day
		final String aggregationCron = container.config().getString("aggregation-cron", "0 59 23 * * ?");
		try {
			new CronTrigger(vertx, aggregationCron).schedule(new CronAggregationTask());
		} catch (ParseException e) {
			logger.fatal(e.getMessage(), e);
			vertx.stop();
			return;
		}
		
		//REST BASICS
		addController(new StatsController(COLLECTIONS.stats.name()));
		MongoDbConf.getInstance().setCollection(COLLECTIONS.stats.name());
		setDefaultResourceFilter(new ShareAndOwner());
	}

}
