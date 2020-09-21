import { idiom as lang } from "entcore";

export type DatasetKey = 'Total' | 'Average' | 'Student' | 'Relative' | 'Teacher' | 'Personnel' | 'Guest';

export type Dataset = {
    key?: DatasetKey;
    label: string;
	borderColor?: string;
	backgroundColor: string;
    borderWidth?: number;
	fill?: boolean | string | number;
	lineTension?: number,
    data: Array<number>;
}

const LINE_TENSION_CONFIG: number = 0.3;
const FILL_CONFIG:boolean = false;
const BORDER_WIDTH_CONFIG:number = 2;

export class DatasetService {

	public getAllProfilesDataset(): Array<Dataset> {
		return [{
				key: 'Teacher',
				label: lang.translate("stats.teacher"),
				borderColor: '#6fbe2e',
				backgroundColor: '#6fbe2e',
				borderWidth: BORDER_WIDTH_CONFIG,
				fill: FILL_CONFIG,
				lineTension: LINE_TENSION_CONFIG,
				data: []
			}, {
				key: 'Personnel',
				label: lang.translate("stats.personnel"),
				borderColor: '#a348c0',
				backgroundColor: '#a348c0',
				borderWidth: BORDER_WIDTH_CONFIG,
				fill: FILL_CONFIG,
				lineTension: LINE_TENSION_CONFIG,
				data: []
			}, {
				key: 'Relative',
				label: lang.translate("stats.relative"),
				borderColor: '#46afe6',
				backgroundColor: '#46afe6',
				borderWidth: BORDER_WIDTH_CONFIG,
				fill: FILL_CONFIG,
				lineTension: LINE_TENSION_CONFIG,
				data: []
			}, {
				key: 'Student',
				label: lang.translate("stats.student"),
				borderColor: '#ff8d2e',
				backgroundColor: '#ff8d2e',
				borderWidth: BORDER_WIDTH_CONFIG,
				fill: FILL_CONFIG,
				lineTension: LINE_TENSION_CONFIG,
				data: []
			}, {
				key: 'Guest',
				label: lang.translate("stats.others"),
				borderColor: '#ff3a55',
				backgroundColor: '#ff3a55',
				borderWidth: BORDER_WIDTH_CONFIG,
				fill: FILL_CONFIG,
				lineTension: LINE_TENSION_CONFIG,
				data: []
			}
		]
    }
	
	public getAllProfilesWithTotalDataset(): Array<Dataset> {
		const res = this.getAllProfilesDataset();
		res.unshift({
			key: 'Total',
			label: lang.translate("stats.total"),
			borderColor: '#aaa',
			backgroundColor: '#aaa',
			borderWidth: BORDER_WIDTH_CONFIG,
			fill: FILL_CONFIG,
			lineTension: LINE_TENSION_CONFIG,
			data: []
		});
		return res;
	}
	
	public getAllProfilesWithAverageDataset(): Array<Dataset> {
		const res = this.getAllProfilesDataset();
		res.unshift({
			key: 'Average',
			label: lang.translate("stats.average"),
			borderColor: '#aaa',
			backgroundColor: '#aaa',
			borderWidth: BORDER_WIDTH_CONFIG,
			fill: FILL_CONFIG,
			lineTension: LINE_TENSION_CONFIG,
			data: []
		});
		return res;
    }
    
    public getDatasetByProfile(profile): Array<Dataset> {
		return [{
            label: lang.translate('stats.' + profile.toLowerCase()),
            backgroundColor: "rgb(56, 137, 193)",
			data: []
        }];
	}
}

export const datasetService = new DatasetService();