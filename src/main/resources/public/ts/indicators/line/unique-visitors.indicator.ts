import { idiom as lang } from 'entcore';
import { IndicatorApi, IndicatorApiType } from '../indicator';
import { Frequency } from '../../services/chart.service';
import { LineIndicator } from './line.indicator';

export class UniqueVisitorsIndicator extends LineIndicator {
    name = 'stats.uniqueVisitors';
    since = 'stats.firstDayOfMonth';
    icon = 'unique-visitors-icon';
    api: IndicatorApi = 'accounts';
    apiType: IndicatorApiType = 'unique_visitors';
    chartTitle = lang.translate('stats.labels.uniqueVisitors');
    chartFrequencies: Array<Frequency> = ['day', 'week', 'month'];
    frequency: Frequency = 'month';
}
