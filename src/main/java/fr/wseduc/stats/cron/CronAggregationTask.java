package fr.wseduc.stats.cron;

import java.util.Date;
import java.util.ServiceLoader;

import org.entcore.common.aggregation.processing.AggregationProcessing;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.core.logging.impl.LoggerFactory;

public class CronAggregationTask implements Handler<Long>{
	
	private static final Logger log = LoggerFactory.getLogger(CronAggregationTask.class);

	@Override
	public void handle(Long event) {
		log.info("Execute aggregation task.");
		ServiceLoader<AggregationProcessing> implementations = ServiceLoader.load(AggregationProcessing.class);
		
		for(AggregationProcessing processor: implementations){
			final Date start = new Date();
			log.info("Launching implementation : "+processor.getClass().getName());
			processor.process(new Handler<Message<JsonObject>>() {
				public void handle(Message<JsonObject> event) {
					final Date end = new Date();
					log.info("Aggregation processing over. (took ["+(end.getTime() - start.getTime())+"] ms)");
				}
			});
		}
	}

	
}
