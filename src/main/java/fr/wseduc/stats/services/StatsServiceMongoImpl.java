package fr.wseduc.stats.services;

import org.entcore.common.service.impl.MongoDbCrudService;
import fr.wseduc.mongodb.MongoDb;

/**
 * MongoDB implementation of the REST service.
 * Methods are usually self-explanatory.
 */
public class StatsServiceMongoImpl extends MongoDbCrudService implements StatsService{

	private final String collection;
	private final MongoDb mongo;

	public StatsServiceMongoImpl(final String collection) {
		super(collection);
		this.collection = collection;
		this.mongo = MongoDb.getInstance();
	}
	
	//TODO : proper MongoDb querying methods 
	
}
