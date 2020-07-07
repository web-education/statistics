import { idiom as lang } from "entcore";
import { IndicatorApi, IndicatorApiType } from "../indicator";
import { Frequency } from "../../services/chart.service";
import { dateService } from "../../services/date.service";
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
}