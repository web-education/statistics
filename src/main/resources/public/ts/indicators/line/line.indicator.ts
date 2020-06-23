import { Indicator } from "../indicator";
import { ChartType } from "../../services/chart.service";

export class LineIndicator implements Indicator {
    chartType: ChartType = 'line';
}