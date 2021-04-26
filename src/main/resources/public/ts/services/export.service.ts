import { Indicator } from "../indicators/abstractIndicator";
import { dateService } from "./date.service";
import { Entity } from "./entities.service";

export type ExportType = 'topLevel.aggregated' | 'topLevel.substructures' | 'bottomLevel.structure' | 'bottomLevel.structure.classes' | 'user.classes';

export class ExportService {
    private static readonly INSTANCE = new ExportService();
    private constructor() {}

    public static getInstance() {
        return ExportService.INSTANCE;
    }

    getExportUrl(entity: Entity, indicator: Indicator, exportType: ExportType, classIds?: Array<string>): string {
		let exportBaseUrl = '/stats/export';
		let exportParams = `?indicator=${indicator.api}&from=${dateService.getSinceDateISOStringWithoutMs()}`;
		const frequency = indicator.exportFrequency ? indicator.exportFrequency : indicator.frequency;
		exportParams += `&frequency=${frequency}`;
	
		switch (exportType) {
			case 'topLevel.aggregated':
				exportParams += '&entityLevel=structure';
				exportParams += `&entity=${entity.id}`;
				exportParams += '&accumulate=true';
				break;
			case 'topLevel.substructures':
				exportParams += '&entityLevel=structure';
				exportParams += `&entity=${entity.id}`;
				exportParams += '&substructures=true';
				exportParams += '&accumulate=false';
				break;
			case 'bottomLevel.structure':
				exportParams += '&entityLevel=structure';
				exportParams += `&entity=${entity.id}`;
				exportParams += '&accumulate=false';
				break;
			case 'bottomLevel.structure.classes':
				exportParams += '&entityLevel=class';
				if (entity.classes) {
					exportParams += `&entity=[${entity.classes.map(c => c.id).join(',')}]`;
				}
				exportParams += '&accumulate=false';
				break;
			case 'user.classes':
				exportParams += '&entityLevel=class';
				exportParams += `&entity=[${classIds.join(',')}]`;
				exportParams += '&accumulate=false';
				break;
			default:
				break;
		}

		return encodeURI(`${exportBaseUrl}${exportParams}`);
    }
}