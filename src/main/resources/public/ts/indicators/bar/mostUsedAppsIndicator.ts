import { cacheService } from "../../services/cache.service";
import { Entity } from "../../services/entities.service";
import { StatsResponse } from "../../services/stats-api.service";
import { IndicatorApi, IndicatorApiType, IndicatorName, IndicatorChartType, IndicatorFrequency } from "../abstractIndicator";
import { AbstractBarIndicator } from "./abstractBarIndicator";

export class MostUsedAppsIndicator extends AbstractBarIndicator {
    name: IndicatorName = 'stats.mostUsedApp';
    chartType: IndicatorChartType = 'bar';
    since = "";
    icon = 'stats-service-icon';
    api: IndicatorApi = 'access';
    apiType: IndicatorApiType = 'access';
    chartTitle = 'stats.labels.mostUsedApps';
    chartProfile = 'total';
    chartProfiles = ['total', 'Teacher', 'Personnel', 'Relative', 'Student'];
    frequency: IndicatorFrequency = 'month';

    private static readonly INSTANCE = new MostUsedAppsIndicator();

    private constructor() {
        super();
    }

    public static getInstance() {
        return MostUsedAppsIndicator.INSTANCE;
    }

    async getApiData(entity: Entity): Promise<Array<StatsResponse>> {
        let apiData: Array<StatsResponse> = await cacheService.getData(this.api, 'month', entity.level, entity.id, false);
        apiData = apiData.filter(x => x['type'] === 'ACCESS');
        return apiData;
    }

    isDataExportable(): boolean {
        return true;
    }

    showProfileFilter(): boolean {
        return true;
    }

    postInit(apiData: Array<StatsResponse>) {

    }
}