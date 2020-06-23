import { Indicator } from "../indicator";
import { ChartType } from "../../services/chart.service";

export class StackedBarIndicator implements Indicator {
    chartType: ChartType = "stackedbar";
}