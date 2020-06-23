import { idiom as lang } from 'entcore';
import { IndicatorType, Indicator, IndicatorApi, IndicatorApiType } from '../indicator';
import { ChartType, Frequency, ChartDataGroupedByProfile, chartService } from '../../services/chart.service';
import { dateService } from '../../services/date.service';
import { Entity } from '../../services/entities.service';

export class UniqueVisitorsIndicator implements Indicator {
    name = 'stats.uniqueVisitors';
    since = 'stats.firstDayOfMonth';
    icon = 'unique-visitors-icon';
    type: IndicatorType = 'UNIQUE_VISITORS';
    api: IndicatorApi = 'accounts';
    apiType: IndicatorApiType = 'unique_visitors';
    chartType: ChartType = 'line';
    chartTitle = lang.translate('stats.labels.uniqueVisitors');
    chartFrequencies: Array<Frequency> = ['day', 'week', 'month'];
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
