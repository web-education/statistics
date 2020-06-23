import { idiom as lang } from "entcore";

export type DatasetKey = 'Total' | 'Student' | 'Relative' | 'Teacher' | 'Personnel' | 'Guest';

export type ProfileDataset = {
    key: DatasetKey;
    label: string;
    borderColor: string;
    borderWidth: number;
    fill: boolean;
    data: Array<number>;
}

export type SingleBarDataset = {
    label: string;
    fillColor: string;
    strokeColor: string;
    highlightFill: string;
    highlightStroke: string;
    data: Array<number>;
}

export class DatasetService {
    
    public getProfileDataset(): Array<ProfileDataset> {
		return [{
				key: 'Total',
				label: lang.translate("stats.total"),
				borderColor: '#333',
				borderWidth: 2,
				fill: false,
				data: []
			}, {
				key: 'Teacher',
				label: lang.translate("stats.teacher"),
				borderColor: '#6fbe2e',
				borderWidth: 2,
				fill: false,
				data: []
			}, {
				key: 'Personnel',
				label: lang.translate("stats.personnel"),
				borderColor: '#a348c0',
				borderWidth: 2,
				fill: false,
				data: []
			}, {
				key: 'Relative',
				label: lang.translate("stats.relative"),
				borderColor: '#46afe6',
				borderWidth: 2,
				fill: false,
				data: []
			}, {
				key: 'Student',
				label: lang.translate("stats.student"),
				borderColor: '#ff8d2e',
				borderWidth: 2,
				fill: false,
				data: []
			}, {
				key: 'Guest',
				label: lang.translate("stats.others"),
				borderColor: '#ff3a55',
				borderWidth: 2,
				fill: false,
				data: []
			}
		]
    }
    
    public getSingleBarDataset(profile): Array<SingleBarDataset> {
		return [{
            label: lang.translate('stats.' + profile.toLowerCase()),
            fillColor: "rgba(47,140,201,0.5)",
            strokeColor: "rgba(47,140,201,0.8)",
            highlightFill: "rgba(47,140,201,0.75)",
            highlightStroke: "rgba(47,140,201,1)",
            data: []
        }];
	}
}

export const datasetService = new DatasetService();