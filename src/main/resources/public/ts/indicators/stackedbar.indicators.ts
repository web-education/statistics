import { idiom as lang } from "entcore";
import { Indicator } from "./indicator";

export let connectionsDailyPeakIndicator: Indicator = {
    name: 'stats.dailyPeak',
    chartType: 'stackedbar',
    since: "",
    api: 'accounts',
    apiType: 'authentications',
    icon: 'clock-icon',
    chartTitle: lang.translate('stats.labels.dailyPeak'),
    frequency: 'hour'
};

export let connectionsWeeklyPeakIndicator: Indicator = {
    name: 'stats.weeklyPeak',
    chartType: 'stackedbar',
    since: "",
    icon: 'calendar-button',
    api: 'accounts',
    apiType: 'authentications',
    chartTitle: lang.translate('stats.labels.weeklyPeak'),
    frequency: 'day'
}