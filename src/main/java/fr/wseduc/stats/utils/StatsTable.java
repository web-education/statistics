package fr.wseduc.stats.utils;

import java.time.LocalDateTime;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;

public class StatsTable {

    private final String name;
    private final String platformId;

    @JsonSerialize(using = LocalDateTimeSerializer.class)
    private final LocalDateTime lastUpdate;

    public StatsTable(String name, String platformId, LocalDateTime lastUpdate) {
        this.name = name;
        this.platformId = platformId;
        this.lastUpdate = lastUpdate;
    }

    public String getName() {
        return name;
    }

    public String getPlatformId() {
        return platformId;
    }

    public LocalDateTime getLastUpdate() {
        return lastUpdate;
    }

}
