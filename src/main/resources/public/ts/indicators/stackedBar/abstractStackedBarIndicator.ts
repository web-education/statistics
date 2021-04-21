import { Dataset, datasetService } from "../../services/dataset.service";
import { Entity } from "../../services/entities.service";
import { StatsResponse } from "../../services/stats-api.service";
import { Indicator, IndicatorApi, IndicatorApiType, IndicatorChartType, IndicatorFrequency, IndicatorName, TOOLTIPS_CONFIG } from "../abstractIndicator";

declare const Chart: any;

export abstract class AbstractStackedBarIndicator extends Indicator {
    chartType: IndicatorChartType = 'stackedbar';
    name: IndicatorName;
    api: IndicatorApi;
    apiType: IndicatorApiType;
    frequency: IndicatorFrequency;
    since: string;
    icon: string;
    chartTitle: string;
    chartFrequencies: IndicatorFrequency[];
    chartProfile: string;
    chartProfiles: string[];

    async getChart(ctx: any, entity: Entity): Promise<typeof Chart> {
        let labels: Array<string> = await this.getChartLabels();
		let datasets: Array<Dataset> = datasetService.getAllProfilesDataset();
		let chartData = await this.getChartData(entity);
		
		// fill the chart datasets data array with the data just collected from API
		datasets.forEach(dataset => {
			if (chartData[dataset.key] && chartData[dataset.key].length > 0) {
				dataset.data = chartData[dataset.key];
			}
			delete dataset.key;
		});
		
		return Promise.resolve(new Chart(ctx, {
			type: 'bar', // see options below for StackedBar configuration
			data: {
				'labels': labels,
				'datasets': datasets
			},
			options: {
				// StackedBar configuration
				scales: {
					xAxes: [{
						stacked: true
					}],
					yAxes: [{
						stacked: true,
						ticks: {
							beginAtZero: true,
							precision: 0
						}
					}]
				},
				tooltips: TOOLTIPS_CONFIG,
				legend: {
					display: true,
					position: 'bottom'
				}
			}
		}));
    }
    abstract getChartLabels(): Array<string>;
    abstract getChartData(entity: Entity): Promise<any>;
	abstract initTotal(entity: Entity): void;
	abstract postInit(apiData: Array<StatsResponse>): void;
}