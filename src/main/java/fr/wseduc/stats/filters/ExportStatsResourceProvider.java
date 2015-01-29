package fr.wseduc.stats.filters;

import org.entcore.common.http.filter.ResourcesProvider;
import org.entcore.common.user.UserInfos;
import org.vertx.java.core.Handler;
import org.vertx.java.core.http.HttpServerRequest;

import fr.wseduc.webutils.http.Binding;

public class ExportStatsResourceProvider implements ResourcesProvider {

	@Override
	public void authorize(HttpServerRequest request, Binding binding, UserInfos user, Handler<Boolean> handler) {
		handler.handle(StatsSecurityUtils.isUserAllowed(user));
	}

}
