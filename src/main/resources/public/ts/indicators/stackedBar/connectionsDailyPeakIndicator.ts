import { idiom as lang } from "entcore";
import { cacheService } from "../../services/cache.service";
import { Entity } from "../../services/entities.service";
import { StatsAccountsResponse, StatsResponse } from "../../services/stats-api.service";
import { IndicatorApi, IndicatorApiType, IndicatorFrequency, IndicatorName } from "../abstractIndicator";
import { AbstractStackedBarIndicator } from "./abstractStackedBarIndicator";

export class ConnectionsDailyPeakIndicator extends AbstractStackedBarIndicator {
    name: IndicatorName = 'stats.dailyPeak';
    since = '';
    api: IndicatorApi = 'accounts';
    apiType: IndicatorApiType = 'authentications';
    icon = 'clock-icon';
    chartTitle = lang.translate('stats.labels.dailyPeak');
    frequency: IndicatorFrequency = 'hour';

    private static readonly INSTANCE = new ConnectionsDailyPeakIndicator();

    private constructor() {
        super();
    }

    public static getInstance() {
        return ConnectionsDailyPeakIndicator.INSTANCE;
    }

    getChartLabels(): Array<string> {
        let labels: Array<string> = [];
        for(let i = 0; i < 24; i++){
            let hour1 = ("0"+i).slice(-2)
            let hour2 = ("0"+(i+1)).slice(-2)
            labels.push(hour1+'h-'+hour2+'h')
        }
        return labels;
	}
	
	async getChartData(entity: Entity): Promise<any> {
        let chartData = {};
        let data: StatsAccountsResponse[] = await cacheService.getIndicatorData(this, entity) as StatsAccountsResponse[];
        
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
                chartData[profile].push(sum || 0); // push 0 in case sum is null to prevent gaps in graph
            });
        });
        
        return chartData;
	}

    async initTotal(entity: Entity): Promise<void> {
        let chartData = {};
		const connectionsDailyPeakIndicator = cacheService.getIndicatorFromEntityCache(this.name, this.frequency, entity);
		
		let accountsData: Array<StatsResponse> = await cacheService.getData(
			this.api,
			this.frequency,
			entity.level,
			entity.id,
            false
		);
		
		if (accountsData && accountsData.length === 0) {
			connectionsDailyPeakIndicator.totalValue = '-';
			return;
		}
		
		const dataGroupedByProfileAndDay = accountsData.reduce((acc, x) => {
            if (!acc[x['profile']]) {
                acc[x['profile']] = {};
            }
            (acc[x['profile']][new Date(x.date).getHours()] = acc[x['profile']][new Date(x.date).getHours()] || []).push(x['authentications']);
            return acc;
		}, {});
		
		Object.keys(dataGroupedByProfileAndDay).forEach(profile => {
            chartData[profile] = [];
            Object.keys(dataGroupedByProfileAndDay[profile]).forEach((day, i) => {
                let sum = dataGroupedByProfileAndDay[profile][day].reduce((acc, x) => acc + x);
                chartData[profile].push(sum);
            });
		});
		
		const sumAll = [];
		Object.keys(chartData).forEach(profile => {
			if (sumAll.length === 0) {
				sumAll.push(...chartData[profile]);
			} else {
				chartData[profile].forEach((sumHours, i) => sumAll[i] += sumHours);
			}
		});
		const indexOfMaxValue = sumAll.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
		
		// save value to Entity cache data
		connectionsDailyPeakIndicator.totalValue = indexOfMaxValue + 'h';
    }

    /**
     * Overwrite getTotal for total value in indicator card
     * @param entity 
     * @returns 
     */
    getTotal(entity: Entity): number | string {
        let cachedIndicator = null;
        cachedIndicator = cacheService.getIndicatorFromEntityCache(this.name, 'hour', entity);
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

    postInit(apiData: Array<StatsResponse>): void {

    }
}