import http from 'axios';
type Structure = {
    id: string;
    name: string;
    classes: Array<Classes>
}
type Classes = {
    id: string;
    name: string;
    level: string;
}
export class StatService {
    _structureTree: Array<Structure> = null;
    async getStructureTree(hierarchical: boolean = true): Promise<Array<Structure>> {
        if (this._structureTree) return this._structureTree;
        const data = await http.get(`/stats/substructures?hierarchical=${hierarchical}`);
        this._structureTree = data.data as Array<Structure>;
        return this._structureTree;
    }
}

export const statService = new StatService();