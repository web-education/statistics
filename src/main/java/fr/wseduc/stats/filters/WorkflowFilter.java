package fr.wseduc.stats.filters;

import static org.entcore.common.user.DefaultFunctions.SUPER_ADMIN;

import java.util.List;

import org.entcore.common.user.UserInfos;
import org.entcore.common.user.UserUtils;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.EventBus;
import org.vertx.java.core.http.HttpServerRequest;

import fr.wseduc.webutils.http.Renders;
import fr.wseduc.webutils.request.filter.Filter;

public class WorkflowFilter implements Filter {

	private final UserInfos.Action workflowAuth;
	private final EventBus eb;

	public WorkflowFilter(EventBus eb, String displayName, String name){
		this.eb = eb;
		workflowAuth = new UserInfos.Action();
		workflowAuth.setDisplayName(displayName);
		workflowAuth.setName(name);
		workflowAuth.setType("SECURED_ACTION_WORKFLOW");
	}

	public WorkflowFilter(EventBus eb, UserInfos.Action action){
		this.eb = eb;
		workflowAuth = action;
	}

	@Override
	public void canAccess(final HttpServerRequest request, final Handler<Boolean> handler) {
		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			public void handle(UserInfos user) {
				if(user.getFunctions().containsKey(SUPER_ADMIN)) {
					handler.handle(true);
					return;
				}

				//Checks whether the user has the proper workflow credentials.
				List<UserInfos.Action> authorizedActions = user.getAuthorizedActions();
				boolean isAuthorized = false;
				for(UserInfos.Action action : authorizedActions){
					if(action.getDisplayName().equals(workflowAuth.getDisplayName()) &&
					   action.getName().equals(workflowAuth.getName()) &&
					   action.getType().equals(workflowAuth.getType())
					  ){
						isAuthorized = true;
						break;
					}
				}

				if(isAuthorized){
					handler.handle(true);
					return;
				}

				handler.handle(false);
			}
		});
	}

	@Override
	public void deny(HttpServerRequest request) {
		Renders.unauthorized(request);
	}


}
