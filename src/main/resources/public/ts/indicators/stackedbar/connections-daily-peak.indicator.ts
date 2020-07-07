import { idiom as lang } from "entcore";
import { IndicatorApiType, IndicatorApi } from "../indicator";
import { ChartDataGroupedByProfile, chartService, Frequency } from "../../services/chart.service";
import { dateService } from "../../services/date.service";
import { Entity } from "../../services/entities.service";
import { StackedBarIndicator } from "./stackedbar.indicator";
import { StatsAccountsResponse } from "../../services/stats-api.service";

export class ConnectionsDailyPeakIndicator extends StackedBarIndicator {
    name = "stats.dailyPeak";
    since = dateService.getSinceDateLabel();
    api: IndicatorApi = 'accounts';
    apiType: IndicatorApiType = 'authentications';
    icon = "clock-icon";
    chartTitle = lang.translate("stats.labels.dailyPeak");
    frequency: Frequency = 'hour';
    chartFrequencies: Array<Frequency> = null;
    chartProfile: string = null;
    
    public async getChartLabels(entity: Entity): Promise<Array<string>> {
        let labels: Array<string> = [];
        for(let i = 0; i < 24; i++){
            let hour1 = ("0"+i).slice(-2)
            let hour2 = ("0"+(i+1)).slice(-2)
            labels.push(hour1+'h-'+hour2+'h')
        }
        return Promise.resolve(labels);
    }
    
    public async getChartData(entity: Entity): Promise<ChartDataGroupedByProfile> {
        let chartData: ChartDataGroupedByProfile = {};
        let data: StatsAccountsResponse[] = await chartService.getDataFromApiOrCache(this, entity) as StatsAccountsResponse[];
        
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
}