package fr.wseduc.stats.filters;

import java.util.ArrayList;
import java.util.List;
import java.util.Map.Entry;

import org.entcore.common.http.filter.ResourcesProvider;
import org.entcore.common.user.UserInfos;
import org.vertx.java.core.Handler;
import org.vertx.java.core.http.HttpServerRequest;

import fr.wseduc.webutils.http.Binding;

public class StatsFilter implements ResourcesProvider {
	
	private static final ArrayList<String> authorizedGroupedBy = new ArrayList<>();
	
	static {
		authorizedGroupedBy.add("module");
		authorizedGroupedBy.add("profil");
		authorizedGroupedBy.add("profil/module");
	}

	@Override
	public void authorize(HttpServerRequest resourceRequest, Binding binding, UserInfos user, Handler<Boolean> handler) {
		
		//Structure and class check + GroupedBy check
		List<String> userStructures = user.getStructures();
		List<String> userClasses = user.getClasses();
		for(Entry<String, String> entry : resourceRequest.params().entries()){
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
