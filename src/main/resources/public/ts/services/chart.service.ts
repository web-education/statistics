import { Indicator } from "../indicators/indicator";
import { StatsResponse } from "./stats-api.service";
import { Entity } from "../services/entities.service";
import { statsApiService } from '../services/stats-api.service';
import { dateService } from "./date.service";
import { datasetService, SingleBarDataset, ProfileDataset } from "./dataset.service";
import { cacheService } from "./cache.service";

declare const Chart: any;

export type Frequency = 'hour' | 'day' | 'week' | 'month';
export type ChartType = 'line' | 'bar' | 'stackedbar';

export type ChartDataGroupedByProfile = {
	Student?: Array<number>;
	Teacher?: Array<number>;
	Personnel?: Array<number>;
	Relative?: Array<number>;
	Guest?: Array<number>;
	Total?: Array<number>;
}

export type ChartDataGroupedByModule = {
	Conversation?: Array<number>;
	Blog?: Array<number>;
	Wiki?: Array<number>;
	Pages?: Array<number>;
	// TODO add modules
}

export type ChartDataGroupedByProfileAndModule = {
	Student?: ChartDataGroupedByModule;
	Teacher?: ChartDataGroupedByModule;
	Personnel?: ChartDataGroupedByModule;
	Relative?: ChartDataGroupedByModule;
	Guest?: ChartDataGroupedByModule;
	Total?: ChartDataGroupedByModule;
}

export class ChartService {
	
	/**
	 * Builds and return a Line Chart for Chart.js
	 * @param ctx canvas context of chart.js dom element
	 * @param indicator 
	 * @param entity 
	 */
    public async getLineChart(ctx: any, indicator: Indicator, entity: Entity): Promise<typeof Chart> {
		let datasets: Array<ProfileDataset> = datasetService.getProfileDataset();
		let chartData: ChartDataGroupedByProfile = await indicator.getChartData(entity) as ChartDataGroupedByProfile;
		
		// add Total dataset
		if (Object.keys(chartData).length > 0 && chartData.constructor === Object) {
			chartData['Total'] = Object.values(chartData).reduce((array1: [], array2: []) => {
				return array1.map((value, index) => {
					return value + array2[index];
				});
			});
		}
		
		// fill the chart datasets data array with the data just collected from API
		datasets.forEach(dataset => {
			if (chartData[dataset.key] && chartData[dataset.key].length > 0) {
				dataset.data = chartData[dataset.key];
			}
			delete dataset.key;
		});
		
		return new Chart(ctx, {
			type: indicator.chartType,
			data: {
				'labels': indicator.getChartLabels(),
				'datasets': datasets
			},
			options: {
				lineTension: 0.1,
				legend: {
					display: true,
					position: 'bottom',
					align: 'center',
					labels: {
						padding: 30
					}
				},
				responsive: true
			}
		});
	}
	
	/**
	 * Builds and return a Bar Chart for Chart.js
	 * @param ctx canvas context of chart.js dom element
	 * @param indicator 
	 * @param entity 
	 */
	public async getBarChart(ctx: any, indicator: Indicator, entity: Entity): Promise<typeof Chart> {
		// get dataset for selected profile
		let datasets: Array<SingleBarDataset> = datasetService.getSingleBarDataset(indicator.chartProfile);
		// get chart data from API or cache
		let chartData: ChartDataGroupedByProfileAndModule = await indicator.getChartData(entity) as ChartDataGroupedByProfileAndModule;
		
		// calculate Total datas
		let total = {};
		Object.keys(chartData).forEach(profileKey => {
			Object.keys(chartData[profileKey]).forEach(moduleKey => {
				if (!total[moduleKey]) {
					total[moduleKey] = [];
				}
				total[moduleKey].push(...chartData[profileKey][moduleKey]);
			})
		});
		chartData['total'] = total;
		
		// sum data for each module for chartProfile
		let sumData = [];
		if (chartData[indicator.chartProfile]) {
			Object.keys(chartData[indicator.chartProfile]).forEach(moduleKey => {
				sumData.push(chartData[indicator.chartProfile][moduleKey].reduce((acc, x) => acc + x));
			});
		}
		datasets[0].data = sumData;
		
		return new Chart(ctx, {
			type: indicator.chartType,
			data: {
				'labels': indicator.getChartLabels(chartData),
				datasets: datasets,
			},
			options: {
				responsive: true,
				legend: {
					display: true,
					position: 'bottom',
					align: 'center',
					labels: {
						padding: 30
					}
				}
			}
		});
	}
	
	/**
	 * Builds and return a StackedBar Chart for Chart.js
	 * @param ctx canvas context of chart.js dom element
	 * @param indicator 
	 * @param entity 
	 */
    public async getStackedBarChart(ctx: any, indicator: Indicator, entity: Entity): Promise<typeof Chart> {
		let labels: Array<string> = indicator.getChartLabels();
		let datasets: Array<ProfileDataset> = datasetService.getProfileDataset().slice(1);
		let chartData: ChartDataGroupedByProfile = await indicator.getChartData(entity) as ChartDataGroupedByProfile;
		
		// fill the chart datasets data array with the data just collected from API
		datasets.forEach(dataset => {
			if (chartData[dataset.key] && chartData[dataset.key].length > 0) {
				dataset.data = chartData[dataset.key];
			}
			delete dataset.key;
		});
		
		return Promise.resolve(new Chart(ctx, {
			type: 'bar', // see options below for StackedBar configuration
			data: {
				'labels': labels,
				'datasets': datasets
			},
			options: {
				// StackedBar configuration
				scales: {
					xAxes: [{
						stacked: true
					}],
					yAxes: [{
						stacked: true
					}]
				},
				lineTension: 0.1,
				legend: {
					display: true,
					position: 'bottom'
				},
				responsive: true
			}
		}));
	}
	
	public async getDataFromApiOrCache(indicator: Indicator, entity: Entity): Promise<Array<StatsResponse>> {
		if (indicator.apiType === 'mixed') {
			return [];
		}
		
		// get data from entity cache data if present
		let cacheIndicator = entity.cacheData.indicators.find(i => i.name === indicator.name && i.frequency === indicator.frequency);
		if (cacheIndicator && !cacheService.needsRefresh(entity.cacheData.lastUpdate)) {
			return cacheIndicator.data;
		}
		
		// otherwise get data from Stats API
        let response: Array<StatsResponse> = await statsApiService.getStats(
			indicator.api,
            dateService.getSinceDateISOStringWithoutMs(), 
            indicator.frequency,
            entity.level,
			[entity.id]);
		// add data to entity cache
		if (cacheIndicator) {
			entity.cacheData.indicators = entity.cacheData.indicators.filter(i => i.name === cacheIndicator.name && i.frequency === cacheIndicator.frequency);
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
	
	public async getDataGroupedByProfile(indicator: Indicator, entity: Entity): Promise<ChartDataGroupedByProfile> {
		let data: Array<StatsResponse> = await this.getDataFromApiOrCache(indicator, entity);
		return statsApiService.groupByKey(data, 'profile', indicator.apiType);
	}
	
	public async getDataGroupedByProfileAndModule(indicator: Indicator, entity: Entity): Promise<ChartDataGroupedByProfileAndModule> {
		let data = await this.getDataFromApiOrCache(indicator, entity);
		return statsApiService.groupByKeys(data, 'profile', 'module', indicator.apiType);
	}
}

export const chartService = new ChartService();