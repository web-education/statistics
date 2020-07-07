import { idiom as lang } from 'entcore';
import { IndicatorApiType, IndicatorApi } from '../indicator';
import { dateService } from '../../services/date.service';
import { Frequency } from '../../services/chart.service';
import { LineIndicator } from './line.indicator';

export class ConnectionIndicator extends LineIndicator {
    name = 'stats.connections';
    since = dateService.getSinceDateLabel();
    icon = 'connection-icon';
    api: IndicatorApi = 'accounts';
    apiType: IndicatorApiType = 'authentications';
    chartTitle = lang.translate('stats.labels.connections');
    chartFrequencies: Frequency[] = ['day', 'week', 'month'];
    frequency: Frequency = 'month';
}