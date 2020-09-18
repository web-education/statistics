import { Indicator } from "./indicator";

export let mostUsedToolIndicator: Indicator = {
    name: 'stats.mostUsedTool',
    chartType: 'bar',
    since: "",
    icon: 'stats-service-icon',
    api: 'access',
    apiType: 'access',
    chartTitle: 'stats.labels.mostUsedTool',
    chartProfile: 'total',
    chartProfiles: ['total', 'Teacher', 'Personnel', 'Relative', 'Student'],
    frequency: 'month'
};