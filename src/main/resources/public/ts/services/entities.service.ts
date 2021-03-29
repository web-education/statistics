import http, { AxiosResponse } from 'axios';
import { IndicatorApiType, IndicatorFrequency } from '../indicators/abstractIndicator';
import { StatsResponse } from './stats-api.service';

export type StructuresResponse = {
    id: string;
    name: string;
    parents: Array<{id: string, name: string}>;
    classes: Array<{id: string, name: string}>;
    children: Array<{id: string, name: string}>;
}

export type EntityLevel = "platform" | "structure" | "class" | "tenant";

export type EntityCachedIndicator = {
    name: string,
    apiType: IndicatorApiType,
    frequency: IndicatorFrequency,
    data: Array<StatsResponse>,
    totalValue?: number | string
}

export type Entity = {
    id: string;
    name: string;
    level?: EntityLevel;
    cacheData?: {
        indicators: Array<EntityCachedIndicator>,
        lastUpdate: Date
    };
}

export class EntitiesService {
    structures: Array<StructuresResponse> = null;
    
    async getStructures(): Promise<Array<StructuresResponse>> {        
        if (this.structures) {
            return this.structures;
        }
        const data: AxiosResponse = await http.get(`/stats/structures`);
        this.structures = data.data;
        return this.structures;
    }
    
    public asTree(data: Array<StructuresResponse>): Array<StructuresResponse> {
        const childrenMap = new Map<string, Array<StructuresResponse>>();
        data.forEach(structureResponse => {
            structureResponse.parents && structureResponse.parents.forEach(parent => {
                if (childrenMap.has(parent.id)) {
                    childrenMap.get(parent.id).push(structureResponse);
                } else {
                    childrenMap.set(parent.id, [structureResponse]);
                }
            });
        });
        
        data.forEach(structureResponse => {
            if (childrenMap.has(structureResponse.id)) {
                structureResponse.children = childrenMap.get(structureResponse.id);
            }
        });
        return data.filter(structure => !structure.parents || structure.parents.length === 0);
    }
}

export const entitiesService = new EntitiesService();