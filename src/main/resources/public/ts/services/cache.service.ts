import { dateService } from "./date.service";
import { Entity, EntityLevel } from "./entities.service";
import { StatsResponse, statsApiService } from "./stats-api.service";
import { Indicator, IndicatorApi, IndicatorFrequency, IndicatorName } from "../indicators/abstractIndicator";

export class CacheService {
    private cachedStatsApiData: Array<CachedData>;

	/**
	 * Get api data if cached or retrieve from API and stores in cache
	 * @param api accounts or access API
	 * @param frequency 
	 * @param entityLevel
	 * @param entityId 
	 * @param device 
	 * @returns api data from cache or API
	 */
	async getData(api: IndicatorApi, frequency: IndicatorFrequency, entityLevel: EntityLevel, entityId: string, device: boolean): Promise<Array<StatsResponse>> {
		if (!this.cachedStatsApiData) {
			this.cachedStatsApiData = [];
		}
		const cachedData = this.cachedStatsApiData.find(x => x.api === api && x.frequency === frequency && x.entityLevel === entityLevel && x.device === device);
		if (!cachedData) {
			let data = await statsApiService.getStats(
				api, 
				dateService.getSinceDateISOStringWithoutMs(), 
				frequency,
				entityLevel,
				[entityId],
				device
			);
			this.cachedStatsApiData.push({api, frequency, entityLevel, device, data});
			return data;
		}
		return cachedData.data;
	}
    
	/**
	 * Get data from cached indicator in entity cache. If cache is not found, retrieve data from API and stores in entity cache
	 * @param indicator 
	 * @param entity 
	 * @returns data from cached indicator in entity cache.
	 */
    public async getIndicatorData(indicator: Indicator, entity: Entity): Promise<Array<StatsResponse>> {		
		// get data from entity cache data if present
		let cachedIndicator = this.getIndicatorFromEntityCache(indicator.name, indicator.frequency, entity);
		if (cachedIndicator && !cacheService.needsRefresh(entity.cacheData.lastUpdate)) {
			return cachedIndicator.data;
		}
		
		// otherwise get data from cache service
		const devices: boolean = indicator.name === 'stats.devices'? true: false;
        let response: Array<StatsResponse> = await this.getData(
			indicator.api, 
            indicator.frequency,
            entity.level,
			entity.id,
			devices
		);
		// add data to entity cache
		if (cachedIndicator) {
			entity.cacheData.indicators = entity.cacheData.indicators.filter(i => i.name === cachedIndicator.name && i.frequency === cachedIndicator.frequency);
		}
		entity.cacheData.indicators.push({
			name: indicator.name,
			apiType: indicator.apiType,
			data: response,
			frequency: indicator.frequency
		});
		entity.cacheData.lastUpdate = new Date();
		
		return response;
	}
    
	public getIndicatorFromEntityCache(indicatorName: IndicatorName, indicatorFrequency: IndicatorFrequency, entity: Entity) {
		if (entity.cacheData && entity.cacheData.indicators) {
			return entity.cacheData.indicators.find(i => i.name === indicatorName && i.frequency === indicatorFrequency);
		}
		return null;
	}

    public needsRefresh(date: Date): boolean {
        return dateService.moreThanOneHourAgo(date);
    }
}

export type CachedData = {
	api: IndicatorApi, 
	frequency: IndicatorFrequency,
	entityLevel: EntityLevel,
	device: boolean,
	data: Array<StatsResponse>
}

export const cacheService = new CacheService();