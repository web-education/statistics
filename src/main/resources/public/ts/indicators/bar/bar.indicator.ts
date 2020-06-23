import { Indicator } from "../indicator";
import { ChartType } from "../../services/chart.service";

export class BarIndicator implements Indicator {
    chartType: ChartType = "bar";
}