package fr.wseduc.stats;

import org.entcore.common.http.BaseServer;
import org.entcore.common.http.filter.ShareAndOwner;
import org.entcore.common.mongodb.MongoDbConf;

import fr.wseduc.stats.controllers.StatsController;
import static fr.wseduc.stats.aggregator.MongoConstants.*;

public class Stats extends BaseServer {

	@Override
	public void start() {
		super.start();
		addController(new StatsController(STATS_COLLECTION));
		MongoDbConf.getInstance().setCollection(STATS_COLLECTION);
		setDefaultResourceFilter(new ShareAndOwner());
	}

}
