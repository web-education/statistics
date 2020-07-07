import { ChartType, Frequency, ChartDataGroupedByProfileAndModule, ChartDataGroupedByProfile } from "../services/chart.service";
import { Entity } from "../services/entities.service";

export type IndicatorApi = 'accounts' | 'access';
export type IndicatorApiType = 
    'authentications' | 
    'activations' | 
    'access' | 
    'unique_visitors' | 
    // mixed type stands for indicator type which data can't be retrieved directly from API 
    // but is a calculation of 2 indicators data (for example: ConnectionsDividedByUniqueVisitors)
    'mixed';

export abstract class Indicator {
    name: string;
    api: IndicatorApi;
    apiType: IndicatorApiType;
    frequency: Frequency;
	since: string;
    icon: string;
    chartType: ChartType;
    chartTitle: string;
    chartFrequencies: Array<Frequency>;
    chartProfile: string;
    
    abstract getChartLabels(chartData?: ChartDataGroupedByProfileAndModule): Array<string>;
    abstract getChartData(entity: Entity): Promise<ChartDataGroupedByProfile | ChartDataGroupedByProfileAndModule>;
}