import { cacheService } from "../../services/cache.service";
import { Entity } from "../../services/entities.service";
import { StatsResponse } from "../../services/stats-api.service";
import { IndicatorApi, IndicatorApiType, IndicatorName, IndicatorChartType, IndicatorFrequency } from "../abstractIndicator";
import { AbstractBarIndicator } from "./abstractBarIndicator";

export class MostUsedConnectorsIndicator extends AbstractBarIndicator {
    name: IndicatorName = 'stats.mostUsedConnector';
    chartType: IndicatorChartType = 'bar';
    since = "";
    icon = 'stats-service-icon';
    api: IndicatorApi = 'access';
    apiType: IndicatorApiType = 'access';
    chartTitle = 'stats.labels.mostUsedConnectors';
    chartProfile = 'total';
    chartProfiles = ['total', 'Teacher', 'Personnel', 'Relative', 'Student'];
    frequency: IndicatorFrequency = 'month';

    private static readonly INSTANCE = new MostUsedConnectorsIndicator();

    private constructor() {
        super();
    }

    public static getInstance() {
        return MostUsedConnectorsIndicator.INSTANCE;
    }

    async getApiData(entity: Entity): Promise<Array<StatsResponse>> {
        let apiData: Array<StatsResponse> = await cacheService.getData(this.api, 'month', entity.level, entity.id, false);
        apiData = apiData.filter(x => x['type'] === 'CONNECTOR');
        return apiData;
    }

    isDataExportable(): boolean {
        return true;
    }

    showProfileFilter(): boolean {
        return true;
    }

    postInit(entity: Entity) {

    }
}