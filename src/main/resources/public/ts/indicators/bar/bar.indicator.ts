import { Indicator } from "../indicator";
import { ChartType, ChartDataGroupedByProfileAndModule, ChartDataGroupedByProfile } from "../../services/chart.service";
import { Entity } from "../../services/entities.service";

export abstract class BarIndicator extends Indicator {
    chartType: ChartType = "bar";
    public abstract getChartLabels(chartData?: ChartDataGroupedByProfileAndModule): Array<string>;
    public abstract getChartData(entity: Entity): Promise<ChartDataGroupedByProfile | ChartDataGroupedByProfileAndModule>;
}