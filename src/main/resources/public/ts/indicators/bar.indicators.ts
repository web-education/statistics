import { Indicator } from "./indicator";

export const ALL_APPS_LABEL = 'Toutes les applications';
export const ALL_CONNECTORS_LABEL = 'Tous les connecteurs'

export let mostUsedAppsIndicator: Indicator = {
    name: 'stats.mostUsedApp',
    chartType: 'bar',
    since: "",
    icon: 'stats-service-icon',
    api: 'access',
    apiType: 'access',
    chartTitle: 'stats.labels.mostUsedApps',
    chartProfile: 'total',
    chartProfiles: ['total', 'Teacher', 'Personnel', 'Relative', 'Student'],
    frequency: 'month',
    appNames: [],
    allAppsLabel: ALL_APPS_LABEL
};

export let mostUsedConnectorIndicator: Indicator = {
    name: 'stats.mostUsedConnector',
    chartType: 'bar',
    since: "",
    icon: 'stats-service-icon',
    api: 'access',
    apiType: 'access',
    chartTitle: 'stats.labels.mostUsedConnectors',
    chartProfile: 'total',
    chartProfiles: ['total', 'Teacher', 'Personnel', 'Relative', 'Student'],
    frequency: 'month',
    appNames: [],
    allAppsLabel: ALL_CONNECTORS_LABEL
}