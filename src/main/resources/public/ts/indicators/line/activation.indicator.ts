import { idiom as lang } from "entcore";
import { Indicator, IndicatorApi, IndicatorApiType } from "../indicator";
import { ChartType, Frequency, ChartDataGroupedByProfile, chartService } from "../../services/chart.service";
import { dateService } from "../../services/date.service";
import { Entity } from "../../services/entities.service";
import { LineIndicator } from "./line.indicator";

export class ActivationIndicator extends LineIndicator {
    name = "stats.activatedAccounts";
    since = dateService.getSinceDateLabel();
    icon = "people-icon";
    api: IndicatorApi = 'accounts';
    apiType: IndicatorApiType = 'activations';
    chartTitle = lang.translate("stats.labels.activatedAccounts");
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
        let chartData = await chartService.getDataGroupedByProfile(this, entity);
        return chartData;
    }
}