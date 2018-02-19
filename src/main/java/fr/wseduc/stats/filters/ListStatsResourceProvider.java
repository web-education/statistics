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

import java.util.ArrayList;
import java.util.List;
import java.util.Map.Entry;

import org.entcore.common.http.filter.ResourcesProvider;
import org.entcore.common.user.UserInfos;
import io.vertx.core.Handler;
import io.vertx.core.http.HttpServerRequest;

import fr.wseduc.webutils.http.Binding;

public class ListStatsResourceProvider implements ResourcesProvider {

	private static final ArrayList<String> authorizedGroupedBy = new ArrayList<>();

	static {
		authorizedGroupedBy.add("module");
		authorizedGroupedBy.add("profil");
		authorizedGroupedBy.add("profil/module");
	}

	@Override
	public void authorize(HttpServerRequest request, Binding binding, UserInfos user, Handler<Boolean> handler) {

		//Super-admin "hack"
		if(user.getFunctions().containsKey(SUPER_ADMIN)) {
			handler.handle(true);
			return;
		}

		//If no structures or classes filters are specified, meaning we are listing at a global scope :
		if(!request.params().contains("structures") && !request.params().contains("classes")){
			//Then we check if specific functions are configured, if so we ensure that the user is at proper credentials level.
			if(!StatsSecurityUtils.isUserAllowed(user)){
				//If not: return 401
				handler.handle(false);
				return;
			}
		}

		//Structure and class check + GroupedBy check
		List<String> userStructures = user.getStructures();
		List<String> userClasses = user.getClasses();
		for(Entry<String, String> entry : request.params().entries()){
			String key = entry.getKey();
			String value = entry.getValue();
			if(key.equals("structures")){
				if(!userStructures.contains(value)){
					handler.handle(false);
					return;
				}
			} else if(key.equals("classes")){
				if(!userClasses.contains(value)){
					handler.handle(false);
					return;
				}
			} else if(key.equals("groupedBy")){
				if(!authorizedGroupedBy.contains(value)){
					handler.handle(false);
					return;
				}
			}
		}

		handler.handle(true);
	}


}
