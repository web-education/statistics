import { Entity } from "../../services/entities.service";
import { StatsResponse } from "../../services/stats-api.service";
import { IndicatorApi, IndicatorApiType, IndicatorName, IndicatorChartType, IndicatorFrequency } from "../abstractIndicator";
import { AbstractLineIndicator } from "./abstractLineIndicator";

export class ConnectionsIndicator extends AbstractLineIndicator {
    name: IndicatorName = 'stats.connections';
    since = '';
    icon = 'connection-icon';
    api: IndicatorApi = 'accounts';
    apiType: IndicatorApiType = 'authentications';
    chartTitle = 'stats.labels.connections';
    chartFrequencies: Array<IndicatorFrequency> = ['day', 'week', 'month'];
    frequency: IndicatorFrequency = 'month';
    chartProfile = null;
    chartProfiles = null;
    
    private static readonly INSTANCE = new ConnectionsIndicator();

    private constructor() {
        super();
    }

    public static getInstance() {
        return ConnectionsIndicator.INSTANCE;
    }

    isDataExportable(): boolean {
        return true;
    }
    
    showProfileFilter(): boolean {
        return false;
    }

    postInit(apiData: Array<StatsResponse>): void {

    }
}
