import { idiom as lang } from "entcore";
import { cacheService } from "../../services/cache.service";
import { Entity } from "../../services/entities.service";
import { StatsAccountsResponse, StatsResponse } from "../../services/stats-api.service";
import { IndicatorApi, IndicatorApiType, IndicatorChartType, IndicatorFrequency, IndicatorName } from "../abstractIndicator";
import { AbstractStackedBarIndicator } from "./abstractStackedBarIndicator";

export class ConnectionsWeeklyPeakIndicator extends AbstractStackedBarIndicator {
    name: IndicatorName = 'stats.weeklyPeak';
    chartType: IndicatorChartType = 'stackedbar';
    since = '';
    icon = 'calendar-button';
    api: IndicatorApi = 'accounts';
    apiType: IndicatorApiType = 'authentications';
    chartTitle = lang.translate('stats.labels.weeklyPeak');
    frequency: IndicatorFrequency = 'day';

    private static readonly INSTANCE = new ConnectionsWeeklyPeakIndicator();

    private constructor() {
        super();
    }

    public static getInstance() {
        return ConnectionsWeeklyPeakIndicator.INSTANCE;
    }

    getChartLabels(): Array<string> {
        var labels: Array<string> = [];
        labels.push(lang.translate("stats.monday"));
        labels.push(lang.translate("stats.tuesday"));
        labels.push(lang.translate("stats.wednesday"));
        labels.push(lang.translate("stats.thursday"));
        labels.push(lang.translate("stats.friday"));
        labels.push(lang.translate("stats.saturday"));
        labels.push(lang.translate("stats.sunday"));
        return labels;
	}
	
	async getChartData(entity: Entity): Promise<any> {
        let chartData: any = {};
        let data: StatsAccountsResponse[] = await cacheService.getIndicatorData(this, entity) as StatsAccountsResponse[];
        
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
    
    async initTotal(entity: Entity): Promise<void> {
        let chartData: any = {};
		const connectionsWeeklyPeakIndicator = cacheService.getIndicatorFromEntityCache(this.name, this.frequency, entity);
		
        let apiData: Array<StatsResponse> = await cacheService.getData(
			this.api,
			this.frequency,
			entity.level,
			entity.id,
            false
		);
		
		if (apiData && apiData.length === 0) {
			connectionsWeeklyPeakIndicator.totalValue = '-';
			return;
		}
		
		const dataGroupedByProfileAndDay = apiData.reduce((acc, x) => {
            if (!acc[x['profile']]) {
                acc[x['profile']] = {};
            }
            (acc[x['profile']][new Date(x.date).getDay()] = acc[x['profile']][new Date(x.date).getDay()] || []).push(x['authentications']);
            return acc;
		}, {});
		
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
		
		const sumAll = [];
		Object.keys(chartData).forEach(profile => {
			if (sumAll.length === 0) {
				sumAll.push(...chartData[profile]);
			} else {
				chartData[profile].forEach((sumDay, i) => sumAll[i] += sumDay);
			}
		});
		const indexOfMaxValue = sumAll.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
		var daysMatch = [
			'stats.monday',
			'stats.tuesday',
			'stats.wednesday',
			'stats.thursday',
			'stats.friday',
			'stats.saturday',
			'stats.sunday',
		];
		
		// save value to Entity cache data
		connectionsWeeklyPeakIndicator.totalValue = lang.translate(daysMatch[indexOfMaxValue]);
    }

    /**
     * Overwrite getTotal for total value in indicator card
     * @param entity 
     * @returns 
     */
    getTotal(entity: Entity): number | string {
        let cachedIndicator = null;
        cachedIndicator = cacheService.getIndicatorFromEntityCache(this.name, 'day', entity);
        if (cachedIndicator) {
            return cachedIndicator.totalValue;
        }
        return 0;
    }

    isDataExportable(): boolean {
        return false;
    }

    showProfileFilter(): boolean {
        return false;
    }

    postInit(entity: Entity) {

    }
}