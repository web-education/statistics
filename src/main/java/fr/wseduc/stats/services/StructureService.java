package fr.wseduc.stats.services;

import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.neo4j.Neo4jResult;

import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

public class StructureService {
    private final Neo4j neo4j = Neo4j.getInstance();

    public void getStructuresAndClassesForUser(String userId, boolean hierarchical,
            Handler<Either<String, JsonArray>> handler) {
        final String structPart = hierarchical ? "(s:Structure)<-[:HAS_ATTACHMENT*0..]-(s2:Structure)"
                : "(s2:Structure)";
        final String query = "match (u:User)-[IN]->(pg:ProfileGroup)-[DEPENDS]->(c:Class)-[:BELONGS]-> " + structPart
                + " where u.id = {userId} return distinct s2.id as id, s2.name + case when exists(s2.UAI) then '(' + s2.UAI +')' else '' end as name, "
                + " collect(distinct {id: c.id, name: c.name, level: c.level}) as classes";
        final JsonObject params = new JsonObject().put("userId", userId);
        neo4j.execute(query, params, Neo4jResult.validResultHandler(handler));
    }
}