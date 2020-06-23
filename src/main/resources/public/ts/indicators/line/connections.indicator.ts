import { idiom as lang } from 'entcore';
import { IndicatorType, IndicatorApiType, IndicatorApi } from '../indicator';
import { dateService } from '../../services/date.service';
import { Frequency, chartService, ChartDataGroupedByProfile } from '../../services/chart.service';
import { LineIndicator } from './line.indicator';
import { Entity } from '../../services/entities.service';

export class ConnectionIndicator extends LineIndicator {
    name = 'stats.connections';
    since = dateService.getSinceDateLabel();
    icon = 'connection-icon';
    type: IndicatorType = 'LOGIN';
    api: IndicatorApi = 'accounts';
    apiType: IndicatorApiType = 'authentications';
    chartTitle = lang.translate('stats.labels.connections');
    chartFrequencies: Frequency[] = ['day', 'week', 'month'];
    frequency: Frequency = 'month';
    
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
        let chartData = await chartService.getDataGroupedByProfile(this, entity);
        return chartData;
    }
}