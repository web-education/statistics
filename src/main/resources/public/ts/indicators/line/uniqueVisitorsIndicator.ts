import { cacheService } from "../../services/cache.service";
import { dateService } from "../../services/date.service";
import { Entity } from "../../services/entities.service";
import { StatsAccountsResponse } from "../../services/stats-api.service";
import { IndicatorApi, IndicatorName, IndicatorApiType, IndicatorChartType, IndicatorFrequency } from "../abstractIndicator";
import { AbstractLineIndicator } from "./abstractLineIndicator";

export class UniqueVisitorsIndicator extends AbstractLineIndicator {
    name: IndicatorName = 'stats.uniqueVisitors';
    chartType: IndicatorChartType = 'line';
    since = 'stats.firstDayOfMonth';
    icon = 'unique-visitors-icon';
    api: IndicatorApi = 'accounts';
    apiType: IndicatorApiType = 'unique_visitors';
    chartTitle = 'stats.labels.uniqueVisitors';
    chartFrequencies: Array<IndicatorFrequency> = ['day', 'week', 'month'];
    frequency: IndicatorFrequency = 'month';

    private static readonly INSTANCE = new UniqueVisitorsIndicator();

    private constructor() {
        super();
    }

    public static getInstance() {
        return UniqueVisitorsIndicator.INSTANCE;
    }

    /**
     * Specific total value for current month
     * @param entity 
     */
    initTotalValueForEntity(entity: Entity) {
        let totalValue = 0;
		const uniqueVisitorsCacheIndicator = cacheService.getIndicatorFromEntityCache(this.name, this.frequency, entity);;
		uniqueVisitorsCacheIndicator.data.forEach((d: StatsAccountsResponse) => {
			if (dateService.isSameMonth(new Date(), new Date(d.date))) {
				totalValue += d.unique_visitors;
			}
		});
		uniqueVisitorsCacheIndicator.totalValue = totalValue;
    }

    isDataExportable(): boolean {
        return true;
    }

    showProfileFilter(): boolean {
        return false;
    }
}
