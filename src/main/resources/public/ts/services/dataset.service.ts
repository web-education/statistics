import { idiom as lang } from "entcore";

export type DatasetKey = 'Total' | 'Student' | 'Relative' | 'Teacher' | 'Personnel' | 'Guest';

export type ProfileDataset = {
    key: DatasetKey;
    label: string;
	borderColor: string;
	backgroundColor: string;
    borderWidth: number;
    fill: boolean;
    data: Array<number>;
}

export type SingleBarDataset = {
    label: string;
    backgroundColor: string;
	borderColor?: string;
	borderWidth?: number;
    data: Array<number>;
}

export class DatasetService {
    
    public getProfileDataset(): Array<ProfileDataset> {
		return [{
				key: 'Total',
				label: lang.translate("stats.total"),
				borderColor: '#333',
				backgroundColor: '#333',
				borderWidth: 2,
				fill: false,
				data: []
			}, {
				key: 'Teacher',
				label: lang.translate("stats.teacher"),
				borderColor: '#6fbe2e',
				backgroundColor: '#6fbe2e',
				borderWidth: 2,
				fill: false,
				data: []
			}, {
				key: 'Personnel',
				label: lang.translate("stats.personnel"),
				borderColor: '#a348c0',
				backgroundColor: '#a348c0',
				borderWidth: 2,
				fill: false,
				data: []
			}, {
				key: 'Relative',
				label: lang.translate("stats.relative"),
				borderColor: '#46afe6',
				backgroundColor: '#46afe6',
				borderWidth: 2,
				fill: false,
				data: []
			}, {
				key: 'Student',
				label: lang.translate("stats.student"),
				borderColor: '#ff8d2e',
				backgroundColor: '#ff8d2e',
				borderWidth: 2,
				fill: false,
				data: []
			}, {
				key: 'Guest',
				label: lang.translate("stats.others"),
				borderColor: '#ff3a55',
				backgroundColor: '#ff3a55',
				borderWidth: 2,
				fill: false,
				data: []
			}
		]
    }
    
    public getSingleBarDataset(profile): Array<SingleBarDataset> {
		return [{
            label: lang.translate('stats.' + profile.toLowerCase()),
            backgroundColor: "rgb(56, 137, 193)",
			data: []
        }];
	}
}

export const datasetService = new DatasetService();