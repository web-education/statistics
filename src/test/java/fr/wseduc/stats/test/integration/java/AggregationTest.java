package fr.wseduc.stats.test.integration.java;

import java.util.ArrayList;
import java.util.Date;

import org.entcore.common.aggregation.AggregationTools.HandlerChainer;
import org.entcore.common.aggregation.groups.IndicatorGroup;
import org.entcore.common.aggregation.indicators.Indicator;
import org.entcore.common.aggregation.indicators.mongo.IndicatorMongoImpl;
import org.junit.Test;
import org.vertx.java.core.AsyncResult;
import org.vertx.java.core.AsyncResultHandler;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;
import org.vertx.testtools.TestVerticle;

import static org.vertx.testtools.VertxAssert.*;
import static org.entcore.common.aggregation.MongoConstants.*;

import com.mongodb.QueryBuilder;

import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.stats.aggregation.DailyAggregationProcessing;
import fr.wseduc.stats.aggregation.Indicators.UniqueVisitorIndicator;

public class AggregationTest extends TestVerticle {

	private static final String MONGO_PERSISTOR = "wse.mongodb.persistor";
	private final MongoDb mongo = MongoDb.getInstance();

	// // Utility

	private static <T> ArrayList<T> arrayToArrayList(T[] array) {
		ArrayList<T> arrayList = new ArrayList<>();
		for (T item : array) {
			arrayList.add(item);
		}
		return arrayList;
	}

	// // Mocking events

	private static class User {

		public String userId;
		public String profil;
		public String[] structures;
		public String[] classes;
		public String[] groups;

		public User(String userId, String profil, String[] structures,
				String[] classes, String[] groups) {
			this.userId = userId;
			this.profil = profil;
			this.structures = structures;
			this.classes = classes;
			this.groups = groups;
		}

	}

	private class Event {

		public String type;
		public String module;
		public long date;
		public String userId;
		public String profil;
		public ArrayList<String> structures;
		public ArrayList<String> classes;
		public ArrayList<String> groups;

		public Event(String type, String module, Date date, User user) {
			this.type = type;
			this.module = module;
			this.date = date.getTime();
			this.userId = user.userId;
			this.profil = user.profil;
			this.structures = arrayToArrayList(user.structures);
			this.classes = arrayToArrayList(user.classes);
			this.groups = arrayToArrayList(user.groups);
		}

		private void writeEvent(Handler<Message<JsonObject>> handler) {
			QueryBuilder builder = QueryBuilder.start(TRACE_FIELD_TYPE)
					.is(type);
			builder.and(TRACE_FIELD_MODULE).is(module).and(TRACE_FIELD_DATE)
					.is(date).and(TRACE_FIELD_USER).is(userId)
					.and(TRACE_FIELD_PROFILE).is(profil)
					.and(TRACE_FIELD_STRUCTURES).is(structures)
					.and(TRACE_FIELD_CLASSES).is(classes)
					.and(TRACE_FIELD_GROUPS).is(groups);

			mongo.insert(COLLECTIONS.events.name(), MongoQueryBuilder.build(builder), handler);
		}
	}



	private void feedEvents(Handler<Message<JsonObject>> handler) {
		// 6 Users total
		User[] users = new User[] {
				new User("1", "Teacher", new String[] { "1" }, new String[] { "1" }, new String[] { "1 - Teacher" }),
				new User("2", "Teacher", new String[] { "1" }, new String[] { "2" }, new String[] { "1 - Teacher" }),
				new User("3", "Student", new String[] { "1" }, new String[] { "1" }, new String[] { "1 - Student" }),
				new User("4", "Personnel", new String[] { "1", "2" }, new String[] { "" }, new String[] { "1 - Personnel", "2 - Personnel" }),
				new User("5", "Teacher", new String[] { "2" }, new String[] { "1" }, new String[] { "2 - Teacher" }),
				new User("6", "Relative", new String[] { "2" }, new String[] { "1" }, new String[] { "2 - Relative" }) };

		// Total : 9 Connexion traces
		// 6 Teachers, 1 Student, 1 Personnel, 1 Relative
		HandlerChainer<Event, Message<JsonObject>> chainer = new HandlerChainer<Event, Message<JsonObject>>(){
			public void executeItem(Event event, Handler<Message<JsonObject>> nextCallback) {
				event.writeEvent(nextCallback);
			}
		};
		chainer.chainItem(new Event(TRACE_TYPE_CONNEXION, "Auth", new Date(), users[0]))
			   .chainItem(new Event(TRACE_TYPE_CONNEXION, "Auth", new Date(), users[0]))
			   .chainItem(new Event(TRACE_TYPE_CONNEXION, "Auth", new Date(), users[1]))
			   .chainItem(new Event(TRACE_TYPE_CONNEXION, "Auth", new Date(), users[2]))
			   .chainItem(new Event(TRACE_TYPE_CONNEXION, "Auth", new Date(), users[3]))
			   .chainItem(new Event(TRACE_TYPE_CONNEXION, "Auth", new Date(), users[4]))
			   .chainItem(new Event(TRACE_TYPE_CONNEXION, "Auth", new Date(), users[1]))
			   .chainItem(new Event(TRACE_TYPE_CONNEXION, "Auth", new Date(), users[5]))
			   .chainItem(new Event(TRACE_TYPE_CONNEXION, "Auth", new Date(), users[0]));

		// Total : 3 Ressource access traces
		// 1 Teacher, 1 Student, 1 Relative
		chainer.chainItem(new Event(TRACE_TYPE_RSC_ACCESS, "Workspace", new Date(), users[4]))
			   .chainItem(new Event(TRACE_TYPE_RSC_ACCESS, "Workspace", new Date(), users[2]))
			   .chainItem(new Event(TRACE_TYPE_RSC_ACCESS, "Workspace", new Date(), users[5]));

		chainer.executeChain(handler);
	}

	// Init & destruct

	@Override
	public void start() {
		initialize();

		JsonObject mongoConfig = new JsonObject()
				.putString("address", MONGO_PERSISTOR)
				.putString("host", "localhost").putNumber("port", 27017)
				.putString("db_name", "one_stats_integration_tests")
				.putNumber("pool-size", 10);

		container.deployModule("io.vertx~mod-mongo-persistor~2.0.2-final-WSE", mongoConfig, 1, new AsyncResultHandler<String>(){
			public void handle(AsyncResult<String> asyncResult) {
				if(asyncResult.failed()) {
					container.logger().error(asyncResult.cause());
				}
				assertTrue(asyncResult.succeeded());
				assertNotNull(
						"MongoDB persistor deploymentID should not be null",
						asyncResult.result());

				if(asyncResult.succeeded()){
					mongo.init(vertx.eventBus(), MONGO_PERSISTOR);
					// Cleanup before
					mongo.delete(COLLECTIONS.events.name(), new JsonObject());
					mongo.delete(COLLECTIONS.stats.name(), new JsonObject());
					// Feeding the database
					feedEvents(new Handler<Message<JsonObject>>() {
						public void handle(Message<JsonObject> message) {
							startTests();
						}
					});
				}

			}
		});
	}

	// Tests
	private void checkRow(JsonObject row){
		if(!row.containsField(STATS_FIELD_GROUPBY)){
			assertEquals("[Ungrouped] ["+TRACE_TYPE_CONNEXION+"] = 9", 9, row.getNumber(TRACE_TYPE_CONNEXION));
			assertEquals("[Ungrouped] ["+TRACE_TYPE_RSC_ACCESS+"] = 3", 3, row.getNumber(TRACE_TYPE_RSC_ACCESS));
			return;
		}
		else {
			String groupByValue = row.getString(STATS_FIELD_GROUPBY);
			switch(groupByValue){
				case "profil":
					if(row.getString("profil_id").equals("Teacher")){
						assertEquals("[profil : Teacher] ["+TRACE_TYPE_CONNEXION+"]", 6, row.getNumber(TRACE_TYPE_CONNEXION));
						assertEquals("[profil : Teacher] ["+TRACE_TYPE_RSC_ACCESS+"]", 1, row.getNumber(TRACE_TYPE_RSC_ACCESS));
					} else if(row.getString("profil_id").equals("Personnel")){
						assertEquals("[profil : Personnel] ["+TRACE_TYPE_CONNEXION+"]", 1, row.getNumber(TRACE_TYPE_CONNEXION));
						assertNull("[profil : Personnel] ["+TRACE_TYPE_RSC_ACCESS+"]", row.getNumber(TRACE_TYPE_RSC_ACCESS));
					} else if(row.getString("profil_id").equals("Student")){
						assertEquals("[profil : Student] ["+TRACE_TYPE_CONNEXION+"]", 1, row.getNumber(TRACE_TYPE_CONNEXION));
						assertEquals("[profil : Student] ["+TRACE_TYPE_RSC_ACCESS+"]", 1, row.getNumber(TRACE_TYPE_RSC_ACCESS));
					} else if(row.getString("profil_id").equals("Relative")){
						assertEquals("[profil : Relative] ["+TRACE_TYPE_CONNEXION+"]", 1, row.getNumber(TRACE_TYPE_CONNEXION));
						assertEquals("[profil : Relative] ["+TRACE_TYPE_RSC_ACCESS+"]", 1, row.getNumber(TRACE_TYPE_RSC_ACCESS));
					}
					return;
				case "structures":
					if(row.getString("structures_id").equals("1")){
						assertEquals("[structure : 1] ["+TRACE_TYPE_CONNEXION+"]", 7, row.getNumber(TRACE_TYPE_CONNEXION));
						assertEquals("[structure : 1] ["+TRACE_TYPE_RSC_ACCESS+"]", 1, row.getNumber(TRACE_TYPE_RSC_ACCESS));
					} else if(row.getString("structures_id").equals("2")){
						assertEquals("[structure : 2] ["+TRACE_TYPE_CONNEXION+"]", 3, row.getNumber(TRACE_TYPE_CONNEXION));
						assertEquals("[structure : 2] ["+TRACE_TYPE_RSC_ACCESS+"]", 2, row.getNumber(TRACE_TYPE_RSC_ACCESS));
					}
					return;
				case "structures/profil":
					if(row.getString("structures_id").equals("1")){
						if(row.getString("profil_id").equals("Teacher")){
							assertEquals("[structure : 1 & profil : Teacher] ["+TRACE_TYPE_CONNEXION+"]", 5, row.getNumber(TRACE_TYPE_CONNEXION));
							assertNull("[structure : 1 & profil : Teacher] ["+TRACE_TYPE_RSC_ACCESS+"]", row.getNumber(TRACE_TYPE_RSC_ACCESS));
						} else if(row.getString("profil_id").equals("Personnel")){
							assertEquals("[structure : 1 & profil : Personnel] ["+TRACE_TYPE_CONNEXION+"]", 1, row.getNumber(TRACE_TYPE_CONNEXION));
							assertNull("[structure : 1 & profil : Personnel] ["+TRACE_TYPE_RSC_ACCESS+"]", row.getNumber(TRACE_TYPE_RSC_ACCESS));
						} else if(row.getString("profil_id").equals("Student")){
							assertEquals("[structure : 1 & profil : Student] ["+TRACE_TYPE_CONNEXION+"]", 1, row.getNumber(TRACE_TYPE_CONNEXION));
							assertEquals("[structure : 1 & profil : Student] ["+TRACE_TYPE_RSC_ACCESS+"]", 1, row.getNumber(TRACE_TYPE_RSC_ACCESS));
						} else if(row.getString("profil_id").equals("Relative")){
							assertNull("[structure : 1 & profil : Relative] ["+TRACE_TYPE_CONNEXION+"]", row.getNumber(TRACE_TYPE_CONNEXION));
							assertNull("[structure : 1 & profil : Relative] ["+TRACE_TYPE_RSC_ACCESS+"]", row.getNumber(TRACE_TYPE_RSC_ACCESS));
						}
					} else if(row.getString("structures_id").equals("2")){
						if(row.getString("profil_id").equals("Teacher")){
							assertEquals("[structure : 2 & profil : Teacher] ["+TRACE_TYPE_CONNEXION+"]", 1, row.getNumber(TRACE_TYPE_CONNEXION));
							assertEquals("[structure : 2 & profil : Teacher] ["+TRACE_TYPE_RSC_ACCESS+"]", 1, row.getNumber(TRACE_TYPE_RSC_ACCESS));
						} else if(row.getString("profil_id").equals("Personnel")){
							assertEquals("[structure : 2 & profil : Personnel] ["+TRACE_TYPE_CONNEXION+"]", 1, row.getNumber(TRACE_TYPE_CONNEXION));
							assertNull("[structure : 2 & profil : Personnel] ["+TRACE_TYPE_RSC_ACCESS+"]", row.getNumber(TRACE_TYPE_RSC_ACCESS));
						} else if(row.getString("profil_id").equals("Student")){
							assertNull("[structure : 2 & profil : Student] ["+TRACE_TYPE_CONNEXION+"]", row.getNumber(TRACE_TYPE_CONNEXION));
							assertNull("[structure : 2 & profil : Student] ["+TRACE_TYPE_RSC_ACCESS+"]", row.getNumber(TRACE_TYPE_RSC_ACCESS));
						} else if(row.getString("profil_id").equals("Relative")){
							assertEquals("[structure : 2 & profil : Relative] ["+TRACE_TYPE_CONNEXION+"]", 1, row.getNumber(TRACE_TYPE_CONNEXION));
							assertEquals("[structure : 2 & profil : Relative] ["+TRACE_TYPE_RSC_ACCESS+"]", 1, row.getNumber(TRACE_TYPE_RSC_ACCESS));
						}
					}
					return;
			}
		}

	}

	@Test
	public void aggregationTest(){
		DailyAggregationProcessing processor = new DailyAggregationProcessing();

		IndicatorMongoImpl connexion_indicator = new IndicatorMongoImpl(TRACE_TYPE_CONNEXION);
		IndicatorMongoImpl ressource_indicator = new IndicatorMongoImpl(TRACE_TYPE_RSC_ACCESS);
		IndicatorMongoImpl unique_visits_indicator = new UniqueVisitorIndicator();
		processor.addIndicator(connexion_indicator).addIndicator(ressource_indicator).addIndicator(unique_visits_indicator);

		//Profile
		IndicatorGroup profileGroup = new IndicatorGroup(TRACE_FIELD_PROFILE);
		//Structure + Structure/Profile + Structure/Classes + Structure/Classes/Profile
		IndicatorGroup structureGroup = new IndicatorGroup(TRACE_FIELD_STRUCTURES);
		IndicatorGroup classesGroup = new IndicatorGroup(TRACE_FIELD_CLASSES);
		structureGroup.addChild(classesGroup.addChild(TRACE_FIELD_PROFILE))
					  .addChild(new IndicatorGroup(TRACE_FIELD_PROFILE));
		//Group
		IndicatorGroup groupGroup = new IndicatorGroup(TRACE_FIELD_GROUPS);

		for(Indicator indic : processor.getIndicators()){
			indic.addGroup(profileGroup)
				 .addGroup(structureGroup)
				 .addGroup(groupGroup);
		}

		processor.processBlank(new Handler<Message<JsonObject>>(){
			public void handle(Message<JsonObject> event) {
				mongo.find(COLLECTIONS.stats.name(), new JsonObject(), new Handler<Message<JsonObject>>() {
					public void handle(Message<JsonObject> message) {
						if ("ok".equals(message.body().getString("status"))) {
							JsonArray results = message.body().getArray("results", new JsonArray());

							for(Object obj : results){
								JsonObject row = (JsonObject) obj;
								checkRow(row);
							}

							testComplete();

						} else {
							fail("Error querying the stats collection.");
						}

						// Cleanup after completion
						mongo.command("{ dropDatabase: 1 }");
					}
				});


			}
		});
	}
}
