import { idiom as lang } from 'entcore';
import { IndicatorApi, IndicatorApiType } from "../indicator"
import { Frequency, ChartDataGroupedByProfile, chartService } from '../../services/chart.service';
import { Entity } from '../../services/entities.service';
import { ConnectionIndicator } from './connections.indicator';
import { UniqueVisitorsIndicator } from './unique-visitors.indicator';
import { LineIndicator } from './line.indicator';

export class ConnectionsDividedUniqueVisitorsIndicator extends LineIndicator {
    name = "stats.connectionsByUniqueVisitors";
    since = "stats.firstDayOfMonth";
    icon = "connection-by-visitors-icon";
    api: IndicatorApi = 'accounts';
    apiType: IndicatorApiType = 'mixed';
    chartTitle = lang.translate("stats.labels.connectionsByUniqueVisitors");
    chartFrequencies: Array<Frequency> = ["day", "week", "month"];
    frequency: Frequency = "month";
    
    public async getChartData(entity: Entity): Promise<ChartDataGroupedByProfile> {
        let chartData: ChartDataGroupedByProfile = {};
        const authenticationIndicator = new ConnectionIndicator();
        authenticationIndicator.frequency = this.frequency;
        let authenticationsData: ChartDataGroupedByProfile = await chartService.getDataGroupedByProfile(authenticationIndicator, entity);
        
        const uniqueVisitorsIndicator = new UniqueVisitorsIndicator();
        uniqueVisitorsIndicator.frequency = this.frequency;
        let uniqueVisitorsData: ChartDataGroupedByProfile = await chartService.getDataGroupedByProfile(uniqueVisitorsIndicator, entity);
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