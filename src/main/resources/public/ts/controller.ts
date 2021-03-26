import { ng, template, ui, _, $, idiom as lang } from 'entcore';

import { Indicator, IndicatorApi } from './indicators/abstractIndicator';
import { dateService } from './services/date.service';
import { Entity, StructuresResponse } from './services/entities.service';
import { entitiesService } from './services/entities.service';
import { cacheService } from './services/cache.service';
import { userService } from './services/user.service';
import { ConnectionsIndicator } from './indicators/line/connectionsIndicator';
import { UniqueVisitorsIndicator } from './indicators/line/uniqueVisitorsIndicator';
import { ConnectionsPerUniqueVisitorIndicator } from './indicators/line/connectionsPerUniqueVisitorIndicator';
import { MostUsedAppsIndicator } from './indicators/bar/mostUsedAppsIndicator';
import { MostUsedConnectorsIndicator } from './indicators/bar/mostUsedConnectorsIndicator';
import { DevicesIndicator } from './indicators/line/devicesIndicator';
import { ConnectionsDailyPeakIndicator } from './indicators/stackedBar/connectionsDailyPeakIndicator';
import { ConnectionsWeeklyPeakIndicator } from './indicators/stackedBar/connectionsWeeklyPeakIndicator';
import { ActivationAndLoadedIndicator } from './indicators/line/activationAndLoadedIndicator';
import { statsApiService } from './services/stats-api.service';

declare const Chart: any;

interface StatsControllerScope {
	$root: any;
	display: {loading: boolean}
	structuresTree: Array<StructuresResponse>;
	entities: Array<Entity>;
	scopeEntity: {current: Entity};
	currentIndicator: Indicator;
	indicators: Array<Indicator>;
	chart: typeof Chart;
	ctx: any;
	template: typeof template;
	lang: typeof lang;
	definitions: Array<string>;
	
	getExportUrl(indicator: IndicatorApi): string;
	openIndicator(indicator: Indicator): void;
	indicatorDetail(indicator: Indicator): void;
	openView(container: any, view: any);
	$apply: any;
	selectEntity(id: string): Promise<void>;
	selectEntityAndOpenIndicator(id: string, indicator: Indicator): Promise<void>;
	closeStructureTree(): void;
}

/**
	Wrapper controller
	------------------
	Main controller.
**/
export const statsController = ng.controller('StatsController', ['$scope', '$timeout', 'model',
	async ($scope: StatsControllerScope, $timeout, model) => {

	/////////////////////////////////////////////
	/*               INIT & VIEWS              */
	$scope.template = template;
	$scope.lang = lang;
	
	// home definitions
	$scope.definitions = [
		'uniqueVisitor',
		'connectionsByUniqueVisitor',
		'contents'
	]
	
	template.open('main', 'global');
	template.open('list', 'icons-list');
	
	$scope.display = {
		loading: true
	}
	
	// get user structures and classes
	let structures: Array<StructuresResponse> = await entitiesService.getStructures();
	$scope.structuresTree = entitiesService.asTree(structures);
	$scope.entities = [];
	structures.forEach(s => {
		$scope.entities.push({
			id: s.id,
			name: s.name,
			level: 'structure'
		});
		if (s.classes && s.classes.length > 0) {
			s.classes.forEach(c => {
				$scope.entities.push({
					id: c.id,
					name: c.name,
					level: 'class'
				});
			});
		}
	});
	
	// current entity inside a scopeEntity for select ng-change to work properly
	$scope.scopeEntity = {
		current: $scope.entities[0]
	};
	
	const safeScopeApply = (fn?: any) => {
		try {
			const phase = $scope.$root && $scope.$root.$$phase;
			if (phase == '$apply' || phase == '$digest') {
				if (fn && (typeof (fn) === 'function')) {
					fn();
				}
			} else {
				$scope.$apply(fn);
			}
		} catch (e) { }
	};
	
	// get user connectors
	const connectors = await userService.getConnectors();
	
	/**** LIST OF INDICATORS ****/	
	$scope.indicators = [
		ConnectionsIndicator.getInstance(),
		UniqueVisitorsIndicator.getInstance(),
		ConnectionsPerUniqueVisitorIndicator.getInstance(),
		MostUsedAppsIndicator.getInstance()
	];
	if (connectors && connectors.length > 0) {
		$scope.indicators.push(MostUsedConnectorsIndicator.getInstance());
	}
	$scope.indicators = [
		...$scope.indicators,
		DevicesIndicator.getInstance(),
		ConnectionsDailyPeakIndicator.getInstance(),
		ConnectionsWeeklyPeakIndicator.getInstance(),
		ActivationAndLoadedIndicator.getInstance()
	];
	
	/**** INIT Data ****/
	let initData = async () => {
		$scope.display.loading = true;

		$scope.indicators.forEach(async indicator => {
			// init indicators data per month for current entity
			await indicator.initCachedData($scope.scopeEntity.current);
			// init indicators total values for current entity
			await indicator.initTotalValueForEntity($scope.scopeEntity.current);
		});
		
		// spinner
		setTimeout(() => {
			$scope.display.loading = false;
			safeScopeApply();
		}, 500);
		
		safeScopeApply(); 
	}
	
	initData();

	$scope.openIndicator = async function(indicator){
		if(!indicator) {
			return;
		}
		
		$scope.currentIndicator = indicator;
		let chartContext = $('#chart').get(0).getContext('2d');
		
		if ($scope.ctx && $scope.ctx !== chartContext){
			$scope.ctx = chartContext;
		} else {
			$scope.ctx = $scope.ctx && $scope.ctx === chartContext ? $scope.ctx : chartContext;
		}
		
		if ($scope.chart) {
			$scope.chart.destroy();
		}
		
		let indicatorChart = await indicator.getChart($scope.ctx, $scope.scopeEntity.current);
		$scope.chart = indicatorChart;
	}

	$scope.indicatorDetail = function(indicator){
		$scope.openView('list', 'table-list')

		var timeoutFunction = function(count){
			if(count < 10 && $('#chart').length <= 0){
				$timeout(function(){ timeoutFunction(count+1) }, 50*count)
			} else {
				$scope.openIndicator(indicator)
			}
		}

		$timeout(function(){
			timeoutFunction(1)
		}, 50)

	}

	$scope.openView = function(container, view){
		if(container === 'lightbox') {
			ui.showLightbox();
		} else {
			ui.hideLightbox();
		}
		$scope.currentIndicator = null;
		template.open(container, view);
	}
	
	/**** Update Data when switching Entity ****/
	$scope.selectEntity = async function(id: string): Promise<void> {
		$scope.scopeEntity.current = $scope.entities.find(e => e.id === id);
		if (!$scope.scopeEntity.current.cacheData 
			|| cacheService.needsRefresh($scope.scopeEntity.current.cacheData.lastUpdate)) {
			await initData();
		}
	}
	
	$scope.selectEntityAndOpenIndicator = async function(id: string, indicator: Indicator): Promise<void> {
		await $scope.selectEntity(id); 
		$scope.openIndicator(indicator);
	}
	
	// get export API call
	$scope.getExportUrl = () => encodeURI(`/stats/export?indicator=${$scope.currentIndicator.api}&from=${dateService.getSinceDateISOStringWithoutMs()}&frequency=day&entityLevel=${$scope.scopeEntity.current.level}&entity=${$scope.scopeEntity.current.id}&accumulate=true`);
}]);
