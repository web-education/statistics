import { ng } from 'entcore';
import { statsController } from './controller';
import { structureTree } from './directives/structureTree';

ng.controllers.push(statsController);
ng.directives.push(structureTree);