import { idiom as lang } from "entcore";
import { IndicatorApi, IndicatorApiType } from "../indicator";
import { dateService } from "../../services/date.service";
import { ChartDataGroupedByProfile, chartService, Frequency } from "../../services/chart.service";
import { Entity } from "../../services/entities.service";
import { StackedBarIndicator } from "./stackedbar.indicator";
import { StatsAccountsResponse } from "../../services/stats-api.service";

export class ConnectionsWeeklyPeakIndicator extends StackedBarIndicator {
    name = "stats.weeklyPeak";
    since = dateService.getSinceDateLabel();
    icon = "calendar-button";
    api: IndicatorApi = 'accounts';
    apiType: IndicatorApiType = 'authentications';
    chartTitle = lang.translate("stats.labels.weeklyPeak");
    frequency: Frequency = 'day';
    chartFrequencies: Array<Frequency> = null;
    chartProfile: string = null;
    
    public async getChartLabels(): Promise<Array<string>> {
        var labels = [];
        labels.push(lang.translate("stats.monday"));
        labels.push(lang.translate("stats.tuesday"));
        labels.push(lang.translate("stats.wednesday"));
        labels.push(lang.translate("stats.thursday"));
        labels.push(lang.translate("stats.friday"));
        labels.push(lang.translate("stats.saturday"));
        labels.push(lang.translate("stats.sunday"));
        return Promise.resolve(labels);
    }
    
    public async getChartData(entity: Entity): Promise<ChartDataGroupedByProfile> {
        let chartData: ChartDataGroupedByProfile = {};
        let data: StatsAccountsResponse[] = await chartService.getDataFromApiOrCache(this, entity) as StatsAccountsResponse[];
        
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