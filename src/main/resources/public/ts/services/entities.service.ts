import http from 'axios';
import { IndicatorApiType } from '../indicators/indicator';
import { StatsResponse } from './stats-api.service';
import { Frequency } from './chart.service';

export type EntityLevel = "platform" | "structure" | "class" | "tenant";

export type Entity = {
    id: string;
    name: string;
    level?: EntityLevel;
    cacheData?: {
        indicators: Array<{
            name: string,
            apiType: IndicatorApiType,
            frequency: Frequency,
            data: Array<StatsResponse>,
            totalValue?: number | string
        }>,
        lastUpdate: Date
    }
}

export class EntitiesService {
    
    structureTree: Array<Entity> = null;
    classes: Array<Entity> = null;
    
    async getStructures(hierarchical: boolean = false): Promise<Array<Entity>> {
        if (this.structureTree) return this.structureTree;
        const data = await http.get(`/stats/substructures?hierarchical=${hierarchical}`);
        this.structureTree = data.data as Array<Entity>;
        return this.structureTree;
    }
    
    async getClasses(): Promise<Array<Entity>> {
        if (this.classes) return this.classes;
        const data = await http.get(`/stats/classes`);
        this.classes = data.data as Array<Entity>;
        return this.classes; 
    }
}

export const entitiesService = new EntitiesService();