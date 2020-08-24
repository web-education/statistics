import { ng } from 'entcore';
import { statsController } from './controller';
import { odeStructureTree } from './directives/ode-structure-tree';
import { odeFlattenArrayOfObjects } from "./filters/ode-flatten-array-of-objects";

ng.controllers.push(statsController);
ng.directives.push(odeStructureTree);
ng.filters.push(odeFlattenArrayOfObjects);
