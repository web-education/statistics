import { Indicator } from "../indicator";
import { ChartType, ChartDataGroupedByProfile, chartService } from "../../services/chart.service";
import { Entity } from "../../services/entities.service";
import { dateService } from "../../services/date.service";
import { StatsResponse } from "../../services/stats-api.service";

export abstract class LineIndicator extends Indicator {
    chartType: ChartType = 'line';
    
    public async getChartLabels(entity: Entity): Promise<Array<string>> {
        var labels: Array<string> = [];
        let data: Array<StatsResponse> = await chartService.getDataFromApiOrCache(this, entity);
        
		switch(this.frequency){
			case "month":
				labels = dateService.getMonthLabels(data);
				break;
			case "week":
				labels = dateService.getWeekLabels(data);
				break;
			case "day":
				labels = dateService.getDayLabels(data);
				break;
        }
        
        return labels;
    }
    
    public async getChartData(entity: Entity): Promise<ChartDataGroupedByProfile> {
        let chartDataByProfileAndDate = await chartService.getDataGroupedByProfile(this, entity);
        
        Object.keys(chartDataByProfileAndDate).forEach(profileData => {
            chartDataByProfileAndDate[profileData] = chartDataByProfileAndDate[profileData].map(data => {
                if (data === null) {
                    return 0;
                }
                return data;
            });
        });
        
        return chartDataByProfileAndDate;
    }
}