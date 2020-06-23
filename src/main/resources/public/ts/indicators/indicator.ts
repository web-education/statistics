import { ChartType, Frequency, ChartDataGroupedByProfileAndModule, ChartDataGroupedByProfile } from "../services/chart.service";
import { Entity } from "../services/entities.service";

export type IndicatorType = 'LOGIN' | 'UNIQUE_VISITORS' | 'ACCESS' | 'ACTIVATION';
export type IndicatorApi = 'accounts' | 'access';
export type IndicatorApiType = 
    'authentications' | 
    'activations' | 
    'access' | 
    'unique_visitors' | 
    // mixed type stands for indicator type which data can't be retrieved directly from API 
    // but is a calculation of 2 indicators data (for example: ConnectionsDividedByUniqueVisitors)
    'mixed';

export interface Indicator {
    name?: string;
	since?: string;
    icon?: string;
    type?: IndicatorType;
    api?: IndicatorApi;
    apiType?: IndicatorApiType;
    chartType?: ChartType;
    chartTitle?: string;
    chartFrequencies?: Array<Frequency>;
    frequency?: Frequency;
    chartProfile?: string;
    
    getChartLabels?(chartData?: ChartDataGroupedByProfileAndModule): Array<string>;
    getChartData?(entity: Entity): Promise<ChartDataGroupedByProfile | ChartDataGroupedByProfileAndModule>;
}