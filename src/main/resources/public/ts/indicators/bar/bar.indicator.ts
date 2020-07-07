import { Indicator } from "../indicator";
import { ChartType, ChartData } from "../../services/chart.service";
import { Entity } from "../../services/entities.service";

export abstract class BarIndicator extends Indicator {
    chartType: ChartType = "bar";
    public abstract getChartLabels(entity: Entity): Promise<Array<string>>;
    public abstract getChartData(entity: Entity): Promise<ChartData>;
}