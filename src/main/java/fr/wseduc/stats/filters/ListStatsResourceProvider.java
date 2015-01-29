package fr.wseduc.stats.filters;

import static org.entcore.common.user.DefaultFunctions.SUPER_ADMIN;

import java.util.ArrayList;
import java.util.List;
import java.util.Map.Entry;

import org.entcore.common.http.filter.ResourcesProvider;
import org.entcore.common.user.UserInfos;
import org.vertx.java.core.Handler;
import org.vertx.java.core.http.HttpServerRequest;

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
