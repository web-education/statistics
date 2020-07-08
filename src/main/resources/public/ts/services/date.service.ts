import { idiom as lang, currentLanguage } from "entcore";
import { StatsResponse } from "./stats-api.service";

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
		const today = new Date();
        return new Date(today.getFullYear() - 1, today.getMonth(), 1, 0, 0, 0, 0);
    }
	
	public getSinceDateISOStringWithoutMs(): string {
		return this.getSinceDate().toISOString().split('.')[0];
	}
	
    public getSinceDateLabel(): string {
	    return lang.translate("stats.since") + this.getSinceDate().toLocaleString([currentLanguage], {month: "long", year: "numeric"});
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