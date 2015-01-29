package fr.wseduc.stats.filters;

import org.entcore.common.user.UserInfos;
import org.entcore.common.utils.Config;
import org.vertx.java.core.json.JsonArray;

public class StatsSecurityUtils {

	//True : If the user has a function contained in the allowed array.
	public static boolean isUserAllowed(UserInfos user){
		JsonArray allowedFunctions = Config.getConf().getArray("overviewAllowedFunctions", new JsonArray());

		if(allowedFunctions.size() == 0)
			return true;

		for(Object functionObj : allowedFunctions){
			String function = (String) functionObj;
			if(user.getFunctions().containsKey(function))
					return true;
		}

		return false;
	}

}
