/*
 * Copyright © "Open Digital Education" (SAS “WebServices pour l’Education”), 2014
 *
 * This program is published by "Open Digital Education" (SAS “WebServices pour l’Education”).
 * You must indicate the name of the software and the company in any production /contribution
 * using the software and indicate on the home page of the software industry in question,
 * "powered by Open Digital Education" with a reference to the website: https: //opendigitaleducation.com/.
 *
 * This program is free software, licensed under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, version 3 of the License.
 *
 * You can redistribute this application and/or modify it since you respect the terms of the GNU Affero General Public License.
 * If you modify the source code and then use this modified source code in your creation, you must make available the source code of your modifications.
 *
 * You should have received a copy of the GNU Affero General Public License along with the software.
 * If not, please see : <http://www.gnu.org/licenses/>. Full compliance requires reading the terms of this license and following its directives.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

package fr.wseduc.stats.filters;

import static org.entcore.common.user.DefaultFunctions.SUPER_ADMIN;

import java.util.List;

import org.entcore.common.user.UserInfos;
import org.entcore.common.user.UserUtils;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.http.HttpServerRequest;

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
