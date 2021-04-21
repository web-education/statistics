import { currentLanguage } from "entcore";
import { cacheService } from "../services/cache.service";
import { dateService } from "../services/date.service";
import { Entity } from "../services/entities.service";
import { StatsResponse } from "../services/stats-api.service";

declare const Chart: any;

export abstract class Indicator {
    name: IndicatorName;
    api: IndicatorApi;
    apiType: IndicatorApiType;
    frequency: IndicatorFrequency;
	since: string;
    icon: string;
    chartType: IndicatorChartType;
    chartTitle: string;
    chartFrequencies: Array<IndicatorFrequency>;
    chartProfile: string;
    chartProfiles: Array<string>;

    /**
     * Indicator initialization:
     * - get data
     * - stores data in entity cache
     * - specific calculation with postInit
     * @param entity 
     */
     async init(entity: Entity): Promise<void> {
        const apiData = await this.getApiData(entity);
        this.initCache(entity, apiData);
        this.initTotal(entity);
        this.postInit(apiData);
    }

    /**
     * Store apiData in Entity cache
     * @param entity 
     * @param apiData 
     */
    private initCache(entity: Entity, apiData: Array<StatsResponse>): void {
        if (!entity.cacheData) {
            entity.cacheData = {
                indicators: [],
                lastUpdate: null
            };
        }
        if (!cacheService.getIndicatorFromEntityCache(this.name, this.frequency, entity)) {
            entity.cacheData.indicators.push({
                name: this.name,
                apiType: this.apiType,
                data: apiData,
                frequency: this.frequency
            });
            entity.cacheData.lastUpdate = new Date();
        }
    }

    /**
     * Get apiData
     * Overwrite this method for specific data retrieving (for example for apps/connectors, and device, see specific Indicators)
     * @param entity 
     * @returns month data
     */
    async getApiData(entity: Entity): Promise<Array<StatsResponse>> {
        const apiData: Array<StatsResponse> = await cacheService.getData(this.api, this.frequency, entity.level, entity.id, false);
        return apiData;
    }
    
    /**
     * Get Since Date to display on cards
     * @param entity 
     * @returns 
     */
    getSinceDate(entity: Entity): string {
        if (!this.since) {
			const cachedIndicator = cacheService.getIndicatorFromEntityCache(this.name, this.frequency, entity);
			if (cachedIndicator && cachedIndicator.data && cachedIndicator.data.length > 0) {
				let minDate = cachedIndicator.data.reduce((a, b) => a.date < b.date ? a : b);
				return new Date(minDate.date).toLocaleString([currentLanguage], {month: "long", year: "numeric"});
			} else {
				return dateService.getSinceDate().toLocaleString([currentLanguage], {month: "long", year: "numeric"});
			}
		}
		return this.since;
    }

    /**
     * Returns total value for indicator card
     * @param entity 
     * @returns total
     */
    getTotal(entity: Entity): number | string {
        let cachedIndicator = cacheService.getIndicatorFromEntityCache(this.name, 'month', entity);
        if (cachedIndicator) {
            return cachedIndicator.totalValue;
        }
        return 0;
    }

    abstract initTotal(entity: Entity): void;
    abstract postInit(apiData: Array<StatsResponse>): void;
    abstract getChart(ctx: any, entity: Entity): Promise<typeof Chart>;
    abstract getChartData(entity: Entity, apiData: Array<StatsResponse>, specificApiType: IndicatorApiType): Promise<any>;
    abstract getChartLabels(entity: Entity, chartDates: Array<Date>): Array<string> | Promise<Array<string>>;
    abstract isDataExportable(): boolean;
    abstract showProfileFilter(): boolean;
}

export type IndicatorName =
    'stats.connections' |
    'stats.uniqueVisitors' |
    'stats.connectionsByUniqueVisitors' |
    'stats.activatedAccounts' |
    'stats.mostUsedApp' |
    'stats.mostUsedConnector' |
    'stats.devices' |
    'stats.dailyPeak' |
    'stats.weeklyPeak';
    
export type IndicatorApi = 
    'accounts' | 
    'access';

export type IndicatorApiType = 
    'authentications' | 
    'activations' | 
    'activated' |
    'loaded' |
    'access' | 
    'unique_visitors' | 
    'device_type' |
    // mixed type stands for indicator type which data can't be retrieved directly from API 
    // but is a calculation of 2 indicators data (for example: ConnectionsDividedByUniqueVisitors)
    'mixed';

export type IndicatorFrequency = 'hour' | 'day' | 'week' | 'month';
export type IndicatorChartType = 'line' | 'bar' | 'stackedbar';

export const TOOLTIPS_CONFIG = {
	mode: 'index',
	position: 'nearest'
};
export const LEGEND_CONFIG = {
	display: true,
	position: 'bottom',
	align: 'center',
	labels: {
		padding: 10,
		boxWidth: 20
	}
};
export const SCALES_CONFIG = {
	yAxes: [{
		ticks: {
			beginAtZero: true,
			precision: 0
		}
	}]
}