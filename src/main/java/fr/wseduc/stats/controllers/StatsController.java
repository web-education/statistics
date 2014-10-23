package fr.wseduc.stats.controllers;

import fr.wseduc.stats.services.StatsService;
import fr.wseduc.stats.services.StatsServiceMongoImpl;
import org.entcore.common.mongodb.MongoDbControllerHelper;

/**
 * Vert.x backend controller for the application using Mongodb.
 */
public class StatsController extends MongoDbControllerHelper {

	//Computation service
	private final StatsService statsService;
	
	//Permissions
	private static final String
		read_only = "stats.view";

	/**
	 * Creates a new controller.
	 * @param collection Name of the collection stored in the mongoDB database.
	 */
	public StatsController(String collection) {
		super(collection);
		statsService = new StatsServiceMongoImpl(collection);
	}
	
	//TODO : controller methods for querying MongoDb stats collection
}
