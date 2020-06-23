import { idiom as lang } from "entcore";
import { IndicatorType, IndicatorApiType, IndicatorApi } from "../indicator";
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
    type: IndicatorType = "LOGIN";
    chartTitle = lang.translate("stats.labels.dailyPeak");
    frequency: Frequency = 'hour';
    
    public getChartLabels(): Array<string> {
        var labels = []
        for(var i = 0; i < 24; i++){
            var hour1 = ("0"+i).slice(-2)
            var hour2 = ("0"+(i+1)).slice(-2)
            labels.push(hour1+'h-'+hour2+'h')
        }
        return labels
    }
    
    public getValue(entity: Entity) {
        // TODO
        
        // var hour = 0
        // var connections = 0

        // for(var i = 0; i < 24; i++){
        // 	var hourConnections = container.getAggregatedSum(this.type+"_H"+i)
        // 	if(hourConnections > connections){
        // 		hour = i
        // 		connections = hourConnections
        // 	}
        // }

        // return hour+"h - "+(hour+1)+"h"
        return;
    }
    
    public async getChartData(entity: Entity): Promise<ChartDataGroupedByProfile> {
        // TODO
        
        // var data = []

        // for(var i = 0; i < 24; i++){
        // 	var hourData = [0, 0, 0, 0, 0]

        // 	//hourData[0] = container.getAggregatedSum(this.type+"_H"+i)

        // 	var profileData = container.getAggregatedGroupMap(this.type+"_H"+i, 'profil')
        // 	for(var prop in profileData){
        // 		var index = 4
        // 		switch(prop){
        // 			case 'Teacher':
        // 				index = 0
        // 				break
        // 			case 'Personnel':
        // 				index = 1
        // 				break
        // 			case 'Relative':
        // 				index = 2
        // 				break
        // 			case 'Student':
        // 				index = 3
        // 				break
        // 		}
        // 		hourData[index] = !isNaN(profileData[prop]) ? profileData[prop] : 0
        // 	}

        // 	data.push(hourData.slice(0))
        // }
        // return data
        
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