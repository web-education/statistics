import { idiom as lang } from 'entcore';
import { Indicator, IndicatorApi, IndicatorApiType } from "../indicator"
import { ChartType, Frequency, ChartDataGroupedByProfile, chartService } from '../../services/chart.service';
import { dateService } from '../../services/date.service';
import { Entity } from '../../services/entities.service';

export class ConnectionsDividedUniqueVisitorsIndicator implements Indicator {
    name = "stats.connectionsByUniqueVisitors";
    since = "stats.firstDayOfMonth";
    icon = "connection-by-visitors-icon";
    api: IndicatorApi = 'accounts';
    apiType: IndicatorApiType = 'mixed';
    chartType: ChartType = "line";
    chartTitle = lang.translate("stats.labels.connectionsByUniqueVisitors");
    chartFrequencies: Array<Frequency> = ["day", "week", "month"];
    frequency: Frequency = "month";
    
    public getChartLabels(): Array<string> {
        var labels: Array<string> = [];
		switch(this.frequency){
			case "month":
				labels = dateService.getMonthLabels();
				break;
			case "week":
				labels = dateService.getWeekLabels();
				break;
			case "day":
				labels = dateService.getDayLabels();
				break;
        }
        return labels;
    }
    
    public async getChartData(entity: Entity): Promise<ChartDataGroupedByProfile> {
        let chartData: ChartDataGroupedByProfile = {};
        let authenticationsData: ChartDataGroupedByProfile = await chartService.getDataGroupedByProfile({
            name: 'stats.connections',
            api: 'accounts',
            apiType: 'authentications',
            frequency: this.frequency
        }, entity);
        let uniqueVisitorsData: ChartDataGroupedByProfile = await chartService.getDataGroupedByProfile({
            name: 'stats.uniqueVisitors',
            api: 'accounts',
            apiType: 'unique_visitors',
            frequency: this.frequency
        }, entity);
        Object.keys(authenticationsData).forEach(key => {
            let divisionArray = authenticationsData[key].map((authenticationsValue, i) => {
                let uniqueVisitorsValue = uniqueVisitorsData[key][i];
                if (uniqueVisitorsValue === 0) return 0;
                return Math.round((authenticationsValue / uniqueVisitorsValue) * 100) / 100;
            });
            chartData[key] = divisionArray;
        });
        return chartData;
    }
}