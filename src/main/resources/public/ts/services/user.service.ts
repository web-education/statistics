import { Entity } from "./entities.service";

export class UserService {
    private static readonly INSTANCE = new UserService();
    private constructor() {}

    public static getInstance() {
        return UserService.INSTANCE;
    }
    
    isAdml(functions: any, entity: Entity) {
		const scope = functions && functions.ADMIN_LOCAL && functions.ADMIN_LOCAL.scope;
		if (!scope) {
			return false;
		}

		if (entity.level === 'structure') {
			return scope.find(s => s === entity.id);
		} else if (entity.level === 'class') {
			return scope.find(s => s === entity.parentStructureId);
		}

		return false;
	}

    isAdmc(functions: any) {
		return functions && functions.SUPER_ADMIN && functions.SUPER_ADMIN.scope;
	}
}