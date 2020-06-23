import { moment, idiom as lang, currentLanguage } from "entcore";

const date = {
    create: (date?) => (moment ? moment(date) : date),
    format: (date?, format?) => moment(date).format(format),
    calendar: (date?) => moment(date).calendar()
};

export class DateService {

    public getMonthLabels() {
		let labels = [];
		var refDate = date.create(this.getSchoolYearRef());
		var todayDate = date.create(new Date());

		while(refDate.isBefore(todayDate)){
			labels.push(refDate.format("MMMM"));
			refDate = refDate.add(1, 'M');
		}

		return labels;
	}

	public getWeekLabels() {
		let labels = [];
		var refDate = date.create(this.getSchoolYearRef());
		var todayDate = date.create(new Date());

		while(refDate.isBefore(todayDate)){
			labels.push(lang.translate("stats.weekOf")+" "+refDate.isoWeekday(1).format("DD/MM"));
			refDate = refDate.add(1, 'w');
		}

		return labels;
	}

	public getDayLabels() {
		let labels = [];
		var refDate = date.create(this.getSchoolYearRef());
		var todayDate = date.create(new Date());

		while(refDate.isBefore(todayDate)){
			labels.push(refDate.format("L"));
			refDate = refDate.add(1, 'd');
		}

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