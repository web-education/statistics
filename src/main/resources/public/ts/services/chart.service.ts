import { idiom as lang } from "entcore";
import { StatsResponse, StatsAccountsResponse } from "./stats-api.service";
import { Entity } from "../services/entities.service";
import { statsApiService } from '../services/stats-api.service';
import { datasetService, Dataset } from "./dataset.service";
import { cacheService } from "./cache.service";
import { Indicator } from "../indicators/indicator";
import { mostUsedToolIndicator } from "../indicators/bar.indicators";
import { connectionsIndicator, uniqueVisitorsIndicator, activationIndicator } from "../indicators/line.indicators";
import { connectionsDailyPeakIndicator, connectionsWeeklyPeakIndicator } from "../indicators/stackedbar.indicators";
import { dateService } from "./date.service";

declare const Chart: any;

export type Frequency = 'hour' | 'day' | 'week' | 'month';
export type ChartType = 'line' | 'bar' | 'stackedbar';

export interface ChartData {
	
}

export interface ChartDataGroupedByProfile extends ChartData {
	Student?: Array<number>;
	Teacher?: Array<number>;
	Personnel?: Array<number>;
	Relative?: Array<number>;
	Guest?: Array<number>;
	Total?: Array<number>;
}

export interface ChartDataGroupedByProfileWithDate extends ChartData {
	Student?: Array<{date: Date, value: number}>;
	Teacher?: Array<{date: Date, value: number}>;
	Personnel?: Array<{date: Date, value: number}>;
	Relative?: Array<{date: Date, value: number}>;
	Guest?: Array<{date: Date, value: number}>;
	Total?: Array<{date: Date, value: number}>;
}

export interface ChartDataGroupedByModule extends ChartData {
	Conversation?: Array<number>;
	Blog?: Array<number>;
	Wiki?: Array<number>;
	Pages?: Array<number>;
	// TODO add modules
}

export interface ChartDataGroupedByProfileAndModule extends ChartData {
	Student?: ChartDataGroupedByModule;
	Teacher?: ChartDataGroupedByModule;
	Personnel?: ChartDataGroupedByModule;
	Relative?: ChartDataGroupedByModule;
	Guest?: ChartDataGroupedByModule;
	Total?: ChartDataGroupedByModule;
}

export class ChartService {
	
	/**
	 * Builds and return a Line Chart for Chart.js from indicator data/labels and entity
	 * @param ctx canvas context of chart.js dom element
	 * @param indicator 
	 * @param entity 
	 */
    public async getLineChart(ctx: any, indicator: Indicator, entity: Entity): Promise<typeof Chart> {
		let chartDateLabels: Array<string> = [];
		let chartDateArray: Array<Date> = [];
		let chartData: ChartDataGroupedByProfileWithDate = {};
		let datasets: Array<Dataset> = [];
		
		// get data from cache if exists otherwise from API
		let data: Array<StatsResponse> = await cacheService.getDataFromCacheOrApi(indicator, entity);
		
		if (data && data.length > 0) {
			// sort response data by date
			data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
			// generate chart labels from dates in response data
			chartDateArray = dateService.getDates(
				dateService.getMinDateFromData(data)
				, dateService.getMaxDateFromData(data)
				, indicator.frequency);
			switch (indicator.frequency) {
				case 'month':
					chartDateLabels = dateService.getMonthLabels(chartDateArray);
					break;
				case 'week':
					chartDateLabels = dateService.getWeekLabels(chartDateArray);
					break;
				case 'day':
					chartDateLabels = dateService.getDayLabels(chartDateArray);
					break;
				default:
					break;
			}
			
			// group data by Profile with date, exemple:
			// Personnel: [{date: '01/01/2020', value: 30}, ...]
			chartData = statsApiService.groupByProfileWithDate(data, indicator.apiType) as ChartDataGroupedByProfileWithDate;
			
			// for every dates in chart, fill the chartData with 0 value if no data for that date and replace null values by O
			chartDateArray.forEach((date, index) => {
				Object.values(chartData).forEach((profileData: Array<{date: Date, value: number}>) => {
					if (!profileData.find(x => dateService.isInSameRange(date, x.date, indicator.frequency))) {
						profileData.splice(index, 0, {date: date, value: 0});
					}
					profileData.forEach((data, index) => {
						if (data.value === null) {
							profileData.splice(index, 1, {date: data.date, value: 0});
						}
					});
				});
			});
			
			// add Total dataset
			if (Object.keys(chartData).length > 0 && chartData.constructor === Object) {
				chartData['Total'] = Object.values(chartData).reduce((array1: Array<{date: Date, value: number}>, array2: Array<{date: Date, value: number}>) => {
					return array1.map((item, index) => {
						return {date: item.date, value: item.value + array2[index].value};
					});
				});
			}
			
			// fill the chart datasets data array with data values
			datasets = datasetService.getAllProfilesDataset();
			datasets.forEach(dataset => {
				if (chartData[dataset.key] && chartData[dataset.key].length > 0) {
					dataset.data = chartData[dataset.key].map(x => x.value);
				}
				delete dataset.key;
			});
		}
		
		return new Chart(ctx, {
			type: indicator.chartType,
			data: {
				'labels': chartDateLabels,
				'datasets': datasets
			},
			options: {
				tooltips: {
					mode: 'index',
					position: 'nearest'
				},
				lineTension: 0.1,
				legend: {
					display: true,
					position: 'bottom',
					align: 'center',
					labels: {
						padding: 30
					}
				},
				responsive: true,
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero: true,
							precision: 0
						}
					}]
				}
			}
		});
	}
	
	/**
	 * Builds and return a Line Chart for Chart.js from indicator data/labels and entity
	 * @param ctx canvas context of chart.js dom element
	 * @param indicator 
	 * @param entity 
	 */
    public async getConnectionsUniqueVisitorsLineChart(ctx: any, indicator: Indicator, entity: Entity): Promise<typeof Chart> {
		let chartDateLabels: Array<string> = [];
		let chartDateArray: Array<Date> = [];
		let datasets: Array<Dataset> = [];
		
		// get connections data from cache if exists otherwise from API
		connectionsIndicator.frequency = indicator.frequency;
		let data: Array<StatsResponse> = await cacheService.getDataFromCacheOrApi(connectionsIndicator, entity);
		
		if (data && data.length > 0) {
			// sort response data by date
			data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
			// generate chart labels from dates in response data
			chartDateArray = dateService.getDates(
				dateService.getMinDateFromData(data)
				, dateService.getMaxDateFromData(data)
				, indicator.frequency);
			switch (indicator.frequency) {
				case 'month':
					chartDateLabels = dateService.getMonthLabels(chartDateArray);
					break;
				case 'week':
					chartDateLabels = dateService.getWeekLabels(chartDateArray);
					break;
				case 'day':
					chartDateLabels = dateService.getDayLabels(chartDateArray);
					break;
				default:
					break;
			}
			
			// group data by Profile with date, exemple:
			// Personnel: [{date: '01/01/2020', value: 30}, ...]
			let connectionsChartData: ChartDataGroupedByProfileWithDate = statsApiService.groupByProfileWithDate(data, connectionsIndicator.apiType);
			// for every dates in chart, fill the chartData with 0 value if no data for that date and replace null values by O
			chartDateArray.forEach((date, index) => {
				Object.values(connectionsChartData).forEach((profileData: Array<{date: Date, value: number}>) => {
					if (!profileData.find(x => dateService.isInSameRange(date, x.date, indicator.frequency))) {
						profileData.splice(index, 0, {date: date, value: 0});
					}
					profileData.forEach((data, index) => {
						if (data.value === null) {
							profileData.splice(index, 1, {date: data.date, value: 0});
						}
					});
				});
			});
			
			// group data by Profile with date, exemple:
			// Personnel: [{date: '01/01/2020', value: 30}, ...]
			let uniqueVisitorsChartData: ChartDataGroupedByProfileWithDate = statsApiService.groupByProfileWithDate(data, uniqueVisitorsIndicator.apiType);
			// for every dates in chart, fill the chartData with 0 value if no data for that date and replace null values by O
			chartDateArray.forEach((date, index) => {
				Object.values(uniqueVisitorsChartData).forEach((profileData: Array<{date: Date, value: number}>) => {
					if (!profileData.find(x => dateService.isInSameRange(date, x.date, indicator.frequency))) {
						profileData.splice(index, 0, {date: date, value: 0});
					}
					profileData.forEach((data, index) => {
						if (data.value === null) {
							profileData.splice(index, 1, {date: data.date, value: 0});
						}
					});
				});
			});
			
			// Divide connectionsChartData with uniqueVisitorsChartData to obtain final chart data
			let chartData: ChartDataGroupedByProfileWithDate = {};
			Object.keys(connectionsChartData).forEach(key => {
				let divisionArray = connectionsChartData[key].map((connectionsDateAndValue: {date: Date, value: number}, i) => {
					if (!connectionsDateAndValue.value || isNaN(connectionsDateAndValue.value)) {
						return {date: connectionsDateAndValue.date, value: 0};
					}
					
					let uniqueVisitorsDateAndValue: {date: Date, value: number} = uniqueVisitorsChartData[key][i];
					if (!uniqueVisitorsDateAndValue.value || isNaN(uniqueVisitorsDateAndValue.value)) {
						return {date: uniqueVisitorsDateAndValue.date, value: 0};
					}
					return {date: connectionsDateAndValue.date, value: Math.round((connectionsDateAndValue.value / uniqueVisitorsDateAndValue.value) * 100) / 100};
				});
				chartData[key] = divisionArray;
			});
			
			// add Total dataset
			if (Object.keys(chartData).length > 0 && chartData.constructor === Object) {
				chartData['Total'] = Object.values(chartData).reduce((array1: Array<{date: Date, value: number}>, array2: Array<{date: Date, value: number}>) => {
					return array1.map((item, index) => {
						return {date: item.date, value: item.value + array2[index].value};
					});
				});
			}
			
			// fill the chart datasets data array with data values
			datasets = datasetService.getAllProfilesDataset();
			datasets.forEach(dataset => {
				if (chartData[dataset.key] && chartData[dataset.key].length > 0) {
					dataset.data = chartData[dataset.key].map(x => x.value);
				}
				delete dataset.key;
			});
		}
		
		return new Chart(ctx, {
			type: 'line',
			data: {
				'labels': chartDateLabels,
				'datasets': datasets
			},
			options: {
				tooltips: {
					mode: 'index',
					position: 'nearest'
				},
				lineTension: 0.1,
				legend: {
					display: true,
					position: 'bottom',
					align: 'center',
					labels: {
						padding: 30
					}
				},
				responsive: true,
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero: true,
							precision: 0
						}
					}]
				}
			}
		});
	}
	
	/**
	 * Builds and return a Line Chart for Chart.js from indicator data/labels and entity
	 * @param ctx canvas context of chart.js dom element
	 * @param indicator 
	 * @param entity 
	 */
    public async getActivationsAndLoadedLineChart(ctx: any, indicator: Indicator, entity: Entity): Promise<typeof Chart> {
		let chartDateLabels: Array<string> = [];
		let chartDateArray: Array<Date> = [];
		let datasets: Array<Dataset> = [];
		
		// get accounts data to get activated and loaded data
		let accountsData: Array<StatsResponse> = await statsApiService.getStats(
			'accounts',
			dateService.getSinceDateISOStringWithoutMs(),
			'month',
			entity.level,
			[entity.id]
		);
		
		if (accountsData && accountsData.length > 0) {
			// sort response data by date
			accountsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
			// generate chart labels from dates in response data
			chartDateArray = dateService.getDates(
				dateService.getMinDateFromData(accountsData)
				, dateService.getMaxDateFromData(accountsData)
				, indicator.frequency);
			switch (indicator.frequency) {
				case 'month':
					chartDateLabels = dateService.getMonthLabels(chartDateArray);
					break;
				case 'week':
					chartDateLabels = dateService.getWeekLabels(chartDateArray);
					break;
				case 'day':
					chartDateLabels = dateService.getDayLabels(chartDateArray);
					break;
				default:
					break;
			}
			
			// group data by Profile with date, exemple:
			// Personnel: [{date: '01/01/2020', value: 30}, ...]
			let activatedChartData: ChartDataGroupedByProfileWithDate = statsApiService.groupByProfileWithDate(accountsData, 'activated');
			// for every dates in chart, fill the chartData with 0 value if no data for that date and replace null values by O
			chartDateArray.forEach((date, index) => {
				Object.values(activatedChartData).forEach((profileData: Array<{date: Date, value: number}>) => {
					if (!profileData.find(x => dateService.isInSameRange(date, x.date, indicator.frequency))) {
						profileData.splice(index, 0, {date: date, value: 0});
					}
					profileData.forEach((data, index) => {
						if (data.value === null) {
							profileData.splice(index, 1, {date: data.date, value: 0});
						}
					});
				});
			});
			
			// group data by Profile with date, exemple:
			// Personnel: [{date: '01/01/2020', value: 30}, ...]
			let loadedChartData: ChartDataGroupedByProfileWithDate = statsApiService.groupByProfileWithDate(accountsData, 'loaded');
			// for every dates in chart, fill the chartData with 0 value if no data for that date and replace null values by O
			chartDateArray.forEach((date, index) => {
				Object.values(loadedChartData).forEach((profileData: Array<{date: Date, value: number}>) => {
					if (!profileData.find(x => dateService.isInSameRange(date, x.date, indicator.frequency))) {
						profileData.splice(index, 0, {date: date, value: 0});
					}
					profileData.forEach((data, index) => {
						if (data.value === null) {
							profileData.splice(index, 1, {date: data.date, value: 0});
						}
					});
				});
			});
			
			// add Total dataset
			if (Object.keys(activatedChartData).length > 0 && activatedChartData.constructor === Object) {
				activatedChartData['total'] = Object.values(activatedChartData).reduce((array1: Array<{date: Date, value: number}>, array2: Array<{date: Date, value: number}>) => {
					return array1.map((item, index) => {
						return {date: item.date, value: item.value + array2[index].value};
					});
				});
			}
			if (Object.keys(loadedChartData).length > 0 && loadedChartData.constructor === Object) {
				loadedChartData['total'] = Object.values(loadedChartData).reduce((array1: Array<{date: Date, value: number}>, array2: Array<{date: Date, value: number}>) => {
					return array1.map((item, index) => {
						return {date: item.date, value: item.value + array2[index].value};
					});
				});
			}
			
			datasets.push({
				label: lang.translate('stats.activatedAccounts.legend'),
				backgroundColor: 'rgb(255, 141, 46)',
				fill: 'origin',
				data: activatedChartData[indicator.chartProfile].map(x => x.value)
			});
			
			datasets.push({
				label: lang.translate('stats.loaded.legend'),
				backgroundColor: '#ccc',
				fill: 'origin',
				data: loadedChartData[indicator.chartProfile].map(x => x.value)
			});
		}
		
		return new Chart(ctx, {
			type: indicator.chartType,
			data: {
				'labels': chartDateLabels,
				'datasets': datasets
			},
			options: {
				tooltips: {
					mode: 'index',
					position: 'nearest'
				},
				lineTension: 0.1,
				legend: {
					display: true,
					position: 'bottom',
					align: 'center',
					labels: {
						padding: 30
					}
				},
				responsive: true,
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero: true,
							precision: 0
						}
					}]
				}
			}
		});
	}
	
	/**
	 * Builds and return a Bar Chart for Chart.js from indicator data/labels and entity
	 * @param ctx canvas context of chart.js dom element
	 * @param indicator 
	 * @param entity 
	 */
	public async getBarChart(ctx: any, indicator: Indicator, entity: Entity): Promise<typeof Chart> {
		// get dataset for selected profile
		let datasets: Array<Dataset> = datasetService.getDatasetByProfile(indicator.chartProfile);
		// get chart data from API or cache
		let chartData: ChartDataGroupedByProfileAndModule;
		switch (indicator.name) {
			case 'stats.mostUsedTool':
				chartData = await this.getMostUsedToolChartData(entity);
				break;
			default:
				break;
		}
		
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
		
		let chartLabels: Array<string>;
		switch (indicator.name) {
			case 'stats.mostUsedTool':
				chartLabels = await this.getMostUsedToolChartLabels(entity);
				break;
			default:
				break;
		}
		
		// sorting		
		let labelAndDataArray: Array<{label: string, data: number}> = chartLabels.map((x, i) => {
			return {
				label: x,
				data: datasets[0].data[i] || 0,
			}
		});
		
		let sortedLabelAndDataArray = labelAndDataArray.sort((a, b) => b.data - a.data);
		let sortedLabels: Array<string> = [];
		let sortedData: Array<number> = [];
		sortedLabelAndDataArray.forEach(x => {
			sortedLabels.push(x.label);
			sortedData.push(x.data);
		});
		datasets[0].data = sortedData;
		
		return new Chart(ctx, {
			type: indicator.chartType,
			data: {
				'labels': sortedLabels,
				datasets: datasets,
			},
			options: {
				responsive: true,
				legend: {
					display: false,
					position: 'bottom',
					align: 'center',
					labels: {
						padding: 30
					}
				},
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero: true,
							precision: 0
						}
					}]
				}
			}
		});
	}
	
	/**
	 * Builds and return a StackedBar Chart for Chart.js from indicator data/labels and entity
	 * @param ctx canvas context of chart.js dom element
	 * @param indicator 
	 * @param entity 
	 */
    public async getStackedBarChart(ctx: any, indicator: Indicator, entity: Entity): Promise<typeof Chart> {
		let labels: Array<string>;
		switch (indicator.name) {
			case 'stats.dailyPeak':
				labels = await this.getConnectionsDailyPeakChartLabels(entity);
				break;
			case 'stats.weeklyPeak':
				labels = await this.getConnectionsWeeklyPeakChartLabels();
				break;
			default:
				break;
		}
		
		let datasets: Array<Dataset> = datasetService.getAllProfilesDataset().slice(1);
		
		let chartData: ChartDataGroupedByProfile;
		switch (indicator.name) {
			case 'stats.dailyPeak':
				chartData = await this.getConnectionsDailyPeakChartData(entity);
				break;
			case 'stats.weeklyPeak':
				chartData = await this.getConnectionsWeeklyPeakChartData(entity);
				break;
			default:
				break;
		}
		
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
						stacked: true,
						ticks: {
							beginAtZero: true,
							precision: 0
						}
					}]
				},
				tooltips: {
					mode: 'index',
					position: 'nearest'
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
	
	private async getMostUsedToolChartLabels(entity: Entity): Promise<Array<string>> {
        let chartData: ChartDataGroupedByProfileAndModule = await cacheService.getDataGroupedByProfileAndModule(mostUsedToolIndicator, entity);
        let labels = [];
		Object.keys(chartData).forEach(profileKey => {
			Object.keys(chartData[profileKey]).forEach(moduleKey => {
                const moduleTranslated = lang.translate(moduleKey.toLowerCase());
				if (!labels.includes(moduleTranslated)) {
					labels.push(moduleTranslated);
				}
			})
        });
        return labels;
	}
	
	private async getMostUsedToolChartData(entity: Entity): Promise<ChartDataGroupedByProfileAndModule> {
        let chartData: ChartDataGroupedByProfileAndModule = await cacheService.getDataGroupedByProfileAndModule(mostUsedToolIndicator, entity);
        return chartData;
	}
	
	private getConnectionsDailyPeakChartLabels(entity: Entity): Array<string> {
        let labels: Array<string> = [];
        for(let i = 0; i < 24; i++){
            let hour1 = ("0"+i).slice(-2)
            let hour2 = ("0"+(i+1)).slice(-2)
            labels.push(hour1+'h-'+hour2+'h')
        }
        return labels;
	}
	
	private async getConnectionsDailyPeakChartData(entity: Entity): Promise<ChartDataGroupedByProfile> {
        let chartData: ChartDataGroupedByProfile = {};
        let data: StatsAccountsResponse[] = await cacheService.getDataFromCacheOrApi(connectionsDailyPeakIndicator, entity) as StatsAccountsResponse[];
        
        // Regroup data by profile and hour:
        // {
        //  Personnel: 
        //      0: [12, 13, ...],
        //      1: [34, 45, ...]
        // }
        let dataGroupedByProfileAndHours = data.reduce((acc, x) => {
            if (!acc[x['profile']]) {
                acc[x['profile']] = {};
            }
            (acc[x['profile']][new Date(x.date).getHours()] = acc[x['profile']][new Date(x.date).getHours()] || []).push(x.authentications);
            return acc;
        }, {});
        
        
        // Build final chart data from dataGroupedByProfileAndHoues
        // final chart data structure :
        // {
        //  Personnel: [sum0, sum1, sum2, sum3, sum4, ..., sum23],
        //  Student: [sum0, sum1, sum2, sum3, sum4, ..., sum23]
        //  ...
        // }
        Object.keys(dataGroupedByProfileAndHours).forEach(profile => {
            chartData[profile] = [];
            Object.keys(dataGroupedByProfileAndHours[profile]).forEach((day, i) => {
                let sum = dataGroupedByProfileAndHours[profile][day].reduce((acc, x) => acc + x);
                chartData[profile].push(sum);
            });
        });
        
        return chartData;
	}
	
	private getConnectionsWeeklyPeakChartLabels(): Array<string> {
        var labels = [];
        labels.push(lang.translate("stats.monday"));
        labels.push(lang.translate("stats.tuesday"));
        labels.push(lang.translate("stats.wednesday"));
        labels.push(lang.translate("stats.thursday"));
        labels.push(lang.translate("stats.friday"));
        labels.push(lang.translate("stats.saturday"));
        labels.push(lang.translate("stats.sunday"));
        return labels;
	}
	
	private async getConnectionsWeeklyPeakChartData(entity: Entity): Promise<ChartDataGroupedByProfile> {
        let chartData: ChartDataGroupedByProfile = {};
        let data: StatsAccountsResponse[] = await cacheService.getDataFromCacheOrApi(connectionsWeeklyPeakIndicator, entity) as StatsAccountsResponse[];
        
        // Regroup data by profile and day like this (O is Sunday):
        // {
        //  Personnel: 
        //      0: [12, 13, ...],
        //      1: [34, 45, ...]
        // }
        let dataGroupedByProfileAndDay = data.reduce((acc, x) => {
            if (!acc[x['profile']]) {
                acc[x['profile']] = {};
            }
            (acc[x['profile']][new Date(x.date).getDay()] = acc[x['profile']][new Date(x.date).getDay()] || []).push(x.authentications);
            return acc;
        }, {});
        
        
        // Build final chart data from dataGroupedByProfileAndDay
        // final chart data structure :
        // {
        //  Personnel: [sumMonday, sumTuesday, sumWednesday, sumThursday, sumFriday, sumSaturday, sumSunday],
        //  Student: [sumMonday, sumTuesday, sumWednesday, sumThursday, sumFriday, sumSaturday, sumSunday],
        //  ...
        // }
        Object.keys(dataGroupedByProfileAndDay).forEach(profile => {
            chartData[profile] = [];
            Object.keys(dataGroupedByProfileAndDay[profile]).forEach((day, i) => {
                let sum = dataGroupedByProfileAndDay[profile][day].reduce((acc, x) => acc + x);
                chartData[profile].push(sum);
            });
            // move Sunday value to the last array element
            let sundayValue = chartData[profile].shift();
            chartData[profile].push(sundayValue);
        });
        
        return chartData;
    }
}

export const chartService = new ChartService();