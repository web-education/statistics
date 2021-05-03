import { StatsResponse, statsApiService } from "../../services/stats-api.service";
import { IndicatorApi, IndicatorApiType, IndicatorFrequency, IndicatorName } from "../abstractIndicator";
import { AbstractLineIndicator } from "./abstractLineIndicator";
import { Entity } from "../../services/entities.service";
import { cacheService } from "../../services/cache.service";
import { AppService } from "../../services/app.service";

export class AppDetailsIndicator extends AbstractLineIndicator {
    name: IndicatorName = 'stats.appDetails';
    api: IndicatorApi = 'access';
    apiType: IndicatorApiType = 'access';
    frequency: IndicatorFrequency = 'month';
    since: string = '';
    icon: string = 'stats-service-icon';
    chartTitle: string = 'stats.labels.mostUsedApps';
    chartFrequencies: Array<IndicatorFrequency> = ['day', 'week', 'month'];
    chartProfile = null;
    chartProfiles = null;
    // apps combo select
    appNames: Array<{key: string, value: string}>;
    exportFrequency: IndicatorFrequency = 'day';
    
    private static readonly INSTANCE = new AppDetailsIndicator();
    
    private constructor() {
        super();
    }
    
    public static getInstance() {
        return AppDetailsIndicator.INSTANCE;
    }

    async getChartData(entity: Entity): Promise<any> {
		let cachedIndicatorData = await cacheService.getIndicatorData(this, entity);
        cachedIndicatorData = cachedIndicatorData.filter(data => data.module === AppService.getInstance().getSelectedAppName());
		return statsApiService.groupByKeyWithDate(cachedIndicatorData, 'profile', this.apiType);
	}

    postInit(apiData: Array<StatsResponse>): void {
        // initialize apps list for apps combo select
        apiData = apiData.filter(data => data.type === 'ACCESS');
        this.appNames = AppService.getInstance().getAppNames(apiData);
    }

    isDataExportable(): boolean {
        return true;
    }

    showProfileFilter(): boolean {
        return false;
    }
}