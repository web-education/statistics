import { moment, idiom as lang, currentLanguage } from "entcore";
import { StatsResponse } from "./stats-api.service";

const date = {
    create: (date?) => (moment ? moment(date) : date),
    format: (date?, format?) => moment(date).format(format),
    calendar: (date?) => moment(date).calendar()
};

export class DateService {

    public getMonthLabels(data: Array<StatsResponse>) {
		const labels: Array<string> = [];
		
		data.forEach(d => {
			const date = new Date(d.date);
			const dateToLocalString: string = date.toLocaleString('default', { month: '2-digit', year: '2-digit' });
			if (!labels.includes(dateToLocalString)) {
				labels.push(dateToLocalString);
			}
		});
		
		return labels;
	}

	public getWeekLabels(data: Array<StatsResponse>) {	
		const labels: Array<string> = [];
		
		data.forEach(d => {
			const date = new Date(d.date);
			const firstDayOfTheWeek = date.getDate() - date.getDay();
			const weekLabel = lang.translate("stats.weekOf") 
				+ firstDayOfTheWeek 
				+ '/' 
				+ date.toLocaleString('default', { month: '2-digit' })
			if (!labels.includes(weekLabel)) {
				labels.push(weekLabel);
			}
		});

		return labels;
	}

	public getDayLabels(data: Array<StatsResponse>) {
		const labels: Array<string> = [];
		
		data.forEach(d => {
			const date = new Date(d.date);
			const dateToLocalString: string = date.toLocaleString('default', { day: '2-digit', month: '2-digit', year: 'numeric' });
			if (!labels.includes(dateToLocalString)) {
				labels.push(dateToLocalString);
			}
		});
		
		return labels;
	}
	
    public getSinceDate(): Date {
        return new Date(date.create().year() - 1, date.create().month(), 1, 0, 0, 0, 0);
    }
	
	public getSinceDateISOStringWithoutMs(): string {
		return this.getSinceDate().toISOString().split('.')[0];
	}
	
    public getSinceDateLabel(): string {
	    return lang.translate("stats.since") + this.getSinceDate().toLocaleString([currentLanguage], {month: "long", year: "numeric"});
    }
    
    public getSchoolYearRef() {
        return date.create(this.getSinceDate());
    }
    
    public toMidnight(inDate: Date){
		inDate.setHours(0);
	    inDate.setMinutes(0);
		inDate.setSeconds(0);
		inDate.setMilliseconds(0);
		return inDate;
	}
	
	public moreThanOneHourAgo(date: Date): boolean {
		if (!date) {
			return true;
		}
		const HOUR = 1000 * 60 * 60;
		const anHourAgo = Date.now() - HOUR;
	
		return date.getTime() < anHourAgo;
	}
}

export const dateService = new DateService();