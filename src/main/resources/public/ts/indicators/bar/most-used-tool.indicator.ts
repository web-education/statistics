import { idiom as lang } from 'entcore';
import { IndicatorApi, IndicatorApiType } from "../indicator";
import { dateService } from '../../services/date.service';
import { Frequency, ChartDataGroupedByProfileAndModule, chartService } from '../../services/chart.service';
import { Entity } from '../../services/entities.service';
import { BarIndicator } from './bar.indicator';

export class MostUsedToolIndicator extends BarIndicator {
    name = "stats.mostUsedTool";
    since = dateService.getSinceDateLabel();
    icon = "stats-service-icon";
    api: IndicatorApi = 'access';
    apiType: IndicatorApiType = 'access';
    chartTitle = lang.translate("stats.labels.mostUsedTool");
    chartProfile = "total";
    chartProfiles = ["total", "Teacher", "Personnel", "Relative", "Student"];
    frequency: Frequency = 'month';
    
    public getChartLabels(chartData: ChartDataGroupedByProfileAndModule): Array<string> {
        let labels = [];
		Object.keys(chartData).forEach(profileKey => {
			Object.keys(chartData[profileKey]).forEach(moduleKey => {
				if (!labels.includes(moduleKey)) {
					labels.push(moduleKey);
				}
			})
        });
        return labels;
    }
    
    public async getChartData(entity: Entity): Promise<ChartDataGroupedByProfileAndModule> {
        let chartData: ChartDataGroupedByProfileAndModule = await chartService.getDataGroupedByProfileAndModule(this, entity);
        return chartData;
    }
}