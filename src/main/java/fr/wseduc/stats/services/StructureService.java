package fr.wseduc.stats.services;

import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.neo4j.Neo4jResult;

import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

public class StructureService {
    private final Neo4j neo4j = Neo4j.getInstance();

    public void getStructuresForUser(String userId, boolean hierarchical,
            Handler<Either<String, JsonArray>> handler) {
//        final String structPart = hierarchical ? "(s:Structure)<-[:HAS_ATTACHMENT*0..]-(s2:Structure)"
//                : "(s2:Structure)";
//        final String query = "match (u:User)-[IN]->(pg:ProfileGroup)-[DEPENDS]-> " + structPart
//                + " where u.id = {userId} "
//                + " return distinct s2.id as id, s2.name as name ";
//        final JsonObject params = new JsonObject().put("userId", userId);
//        neo4j.execute(query, params, Neo4jResult.validResultHandler(handler));

        final String structPart = hierarchical ? "(s:Structure)<-[:HAS_ATTACHMENT*0..]-(s2:Structure)"
                : "(s2:Structure)";
        final String query = "MATCH (u:User)-[IN]->(pg:ProfileGroup)-[DEPENDS]->(s:Structure)" +
                " WHERE u.id = {userId} " +
                " OPTIONAL MATCH (s)-[r:HAS_ATTACHMENT]->(ps:Structure)" +
                " WITH s, COLLECT({id: ps.id, name: ps.name}) as parents" +
                " return distinct s.id as id, s.name as name, parents as parents ";
        final JsonObject params = new JsonObject().put("userId", userId);
        neo4j.execute(query, params, Neo4jResult.validResultHandler(handler));
    }

    public void getClassesForUser(String userId, Handler<Either<String, JsonArray>> handler) {
        final String query = "match (u:User)-[IN]->(pg:ProfileGroup)-[DEPENDS]->(c:Class)-[:BELONGS]->(s:Structure) "
                + " where u.id = {userId} "
                + " return distinct c.id as id, c.name as name ";
        final JsonObject params = new JsonObject().put("userId", userId);
        neo4j.execute(query, params, Neo4jResult.validResultHandler(handler));
    }

    public void getStructuresHierarchyAndClasses(String userId, Handler<Either<String, JsonArray>> handler) {
        final String query =
                "MATCH (u:User {id: {userId}})-[:IN]->(pg:ProfileGroup)-[:DEPENDS]->(s:Structure)" +
                " OPTIONAL MATCH (s)-[:HAS_ATTACHMENT]->(ps:Structure)<-[:DEPENDS]-(g:ProfileGroup)<-[:IN]-(u)" +
                " WITH u, s, COLLECT(distinct {id: ps.id, name: ps.name}) as parents" +
                " OPTIONAL MATCH (u)-[:IN]->(pg:ProfileGroup)-[:DEPENDS]->(c:Class)-[:BELONGS]->(s)" +
                " WITH u, s, parents, COLLECT(distinct {id: c.id, name: c.name}) as classes" +
                " RETURN DISTINCT s.id as id, s.name as name, CASE WHEN any(p in parents where p <> {id: null, name: null}) THEN parents END as parents," +
                " CASE WHEN any(c in classes where c <> {id: null, name: null}) THEN classes END as classes";

        final JsonObject params = new JsonObject().put("userId", userId);
        neo4j.execute(query, params, Neo4jResult.validResultHandler(handler));
    }
}