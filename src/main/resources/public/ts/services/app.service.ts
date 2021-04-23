import { idiom as lang } from "entcore";
import { StatsResponse } from "./stats-api.service";

export class AppService {
    private static readonly INSTANCE = new AppService();

    private selectedAppName: string;

    private constructor() {}

    public static getInstance() {
        return AppService.INSTANCE;
    }

    getSelectedAppName() {
        return this.selectedAppName;
    }

    setSelectedAppName(appName) {
        this.selectedAppName = appName;
    }

    getAppNames(apiData: Array<StatsResponse>) {
        const results: Array<{key: string, value: string}> = [];
        apiData.forEach(data => {
            if (results.findIndex(app => app.key === data.module) === -1) {
                results.push({key: data.module, value: lang.translate(data.module.toLowerCase())});
            }
        });
        return results;
    }
}