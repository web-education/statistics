package fr.wseduc.stats.cron;

import java.util.Calendar;
import java.util.Date;
import java.util.ServiceLoader;

import org.entcore.common.aggregation.processing.AggregationProcessing;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.core.logging.impl.LoggerFactory;

public class CronAggregationTask implements Handler<Long>{

	private static final Logger log = LoggerFactory.getLogger(CronAggregationTask.class);

	private final Date processingDate;

	public CronAggregationTask(int dayDelta) {
		Calendar cal = Calendar.getInstance();
		cal.add(Calendar.DAY_OF_YEAR, dayDelta);
		processingDate = cal.getTime();
	}

	@Override
	public void handle(Long event) {
		log.info("[Aggregation][Processing] Executing aggregation task, date marker set at : {"+processingDate.toString()+"}");
		ServiceLoader<AggregationProcessing> implementations = ServiceLoader.load(AggregationProcessing.class);

		for(AggregationProcessing processor: implementations){
			final Date start = new Date();
			log.info("[Aggregation][Processing] Launching implementation : "+processor.getClass().getName());
			processor.process(processingDate, new Handler<JsonObject>() {
				public void handle(JsonObject event) {
					final Date end = new Date();
					log.info("[Aggregation][Processing] Over, took ["+(end.getTime() - start.getTime())+"] ms");
				}
			});
		}
	}


}
