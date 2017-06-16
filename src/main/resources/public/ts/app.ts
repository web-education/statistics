import { ng, model } from 'entcore';
import { statsController } from './controller';
import { build } from './model';

ng.controllers.push(statsController);

model.build = build;