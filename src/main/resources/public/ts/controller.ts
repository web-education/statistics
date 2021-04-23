import { ng, template, ui, _, $, idiom as lang } from 'entcore';

import { Indicator, IndicatorApi } from './indicators/abstractIndicator';
import { dateService } from './services/date.service';
import { Entity, StructuresResponse } from './services/entities.service';
import { entitiesService } from './services/entities.service';
import { cacheService } from './services/cache.service';
import { ConnectionsIndicator } from './indicators/line/connectionsIndicator';
import { UniqueVisitorsIndicator } from './indicators/line/uniqueVisitorsIndicator';
import { ConnectionsPerUniqueVisitorIndicator } from './indicators/line/connectionsPerUniqueVisitorIndicator';
import { MostUsedAppsIndicator } from './indicators/bar/mostUsedAppsIndicator';
import { MostUsedConnectorsIndicator } from './indicators/bar/mostUsedConnectorsIndicator';
import { DevicesIndicator } from './indicators/line/devicesIndicator';
import { ConnectionsDailyPeakIndicator } from './indicators/stackedBar/connectionsDailyPeakIndicator';
import { ConnectionsWeeklyPeakIndicator } from './indicators/stackedBar/connectionsWeeklyPeakIndicator';
import { ActivationAndLoadedIndicator } from './indicators/line/activationAndLoadedIndicator';
import { AppDetailsIndicator } from './indicators/line/appDetailsIndicator';
import { ConnectorDetailsIndicator } from "./indicators/line/connectorDetailsIndicator";
import { AppService } from './services/app.service';

declare const Chart: any;

type StatsControllerState = {
	structuresTree: Array<StructuresResponse>;
	entities: Array<Entity>;
	currentEntity: Entity;
	currentIndicator: Indicator;
	indicators: Array<Indicator>;
	selectedAppName: string;
	allAppsOrConnectorsI18nKey: string;
	chart: typeof Chart;
	ctx: any;
}

interface StatsControllerScope {
	$root: any;
	display: {loading: boolean}
	state: StatsControllerState,
	template: typeof template;
	lang: typeof lang;
	definitions: Array<string>;
	
	getExportUrl(indicator: IndicatorApi): string;
	openIndicator(indicator: Indicator): Promise<void>;
	indicatorDetail(indicator: Indicator): void;
	openView(container: any, view: any);
	selectEntity(id: string): Promise<void>;
	selectEntityAndOpenIndicator(id: string, indicator: Indicator): Promise<void>;
	openAppDetails(): void;
	displayAppsSelect(): boolean;
	$apply: any;
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
	
	$scope.state = {
		structuresTree: [],
		entities: [],
		currentEntity: null,
		currentIndicator: null,
		indicators: [],
		selectedAppName: 'stats.mostUsedApps.allApps',
		allAppsOrConnectorsI18nKey: 'stats.mostUsedApps.allApps',
		chart: null,
		ctx: null,
	};

	$scope.display = {
		loading: true
	};
	
	// get user structures and classes
	let structures: Array<StructuresResponse> = await entitiesService.getStructures();
	$scope.state.structuresTree = entitiesService.asTree(structures);
	$scope.state.entities = [];
	structures.forEach(s => {
		$scope.state.entities.push({
			id: s.id,
			name: s.name,
			level: 'structure'
		});
		if (s.classes && s.classes.length > 0) {
			s.classes.forEach(c => {
				$scope.state.entities.push({
					id: c.id,
					name: c.name,
					level: 'class'
				});
			});
		}
	});
	
	$scope.state.currentEntity = $scope.state.entities[0];
	
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

	// Indicators list
	$scope.state.indicators = [
		ConnectionsIndicator.getInstance(),
		UniqueVisitorsIndicator.getInstance(),
		ConnectionsPerUniqueVisitorIndicator.getInstance(),
		MostUsedAppsIndicator.getInstance(),
		MostUsedConnectorsIndicator.getInstance(),
		DevicesIndicator.getInstance(),
		ConnectionsDailyPeakIndicator.getInstance(),
		ConnectionsWeeklyPeakIndicator.getInstance(),
		ActivationAndLoadedIndicator.getInstance()
	];
	
	/**
	 * Hide/Show MostUsedConnectors Indicator card.
	 * If no data returned for connectors then hide card.
	 */
	const toggleMostUsedConnectorsIndicator = async (entity: Entity): Promise<void> => {
		await MostUsedConnectorsIndicator.getInstance().init(entity);
		const connectorsApiData = await cacheService.getIndicatorData(MostUsedConnectorsIndicator.getInstance(), entity);
		const connectorsIndex = $scope.state.indicators.findIndex(i => i.name === MostUsedConnectorsIndicator.getInstance().name);

		if (connectorsApiData && connectorsApiData.length > 0) {
			// if data and not present, insert it after MostUsedAppsIndicator
			if (connectorsIndex === -1) {
				const mostUsedAppsIndex = $scope.state.indicators.findIndex(i => i.name === MostUsedAppsIndicator.getInstance().name);
				$scope.state.indicators.splice(mostUsedAppsIndex + 1, 0, MostUsedConnectorsIndicator.getInstance());
			}
		} else {
			// if no data and present, remove it
			if (connectorsIndex > -1) {
				$scope.state.indicators.splice(connectorsIndex, 1);
			}
		}
	};
	
	/**** INIT Data ****/
	let initData = async () => {
		// Spinner on
		$scope.display.loading = true;

		await toggleMostUsedConnectorsIndicator($scope.state.currentEntity);

		for (let index = 0; index < $scope.state.indicators.length; index++) {
			const indicator = $scope.state.indicators[index];
			// init indicators data per month for current entity
			// (connectors already initialised before)
			if (indicator.name !== 'stats.mostUsedConnector') {
				await indicator.init($scope.state.currentEntity);
			}
		}
		
		// Spinner off
		setTimeout(() => {
			$scope.display.loading = false;
			safeScopeApply();
		}, 500);
		
		safeScopeApply(); 
	}
	
	initData();

	$scope.openIndicator = async (indicator): Promise<void> => {
		if(!indicator) {
			return;
		}
		
		$scope.state.currentIndicator = indicator;

		if (indicator.name === 'stats.mostUsedApp') {
			$scope.state.allAppsOrConnectorsI18nKey = 'stats.mostUsedApps.allApps';
		} else if (indicator.name === 'stats.mostUsedConnector') {
			$scope.state.allAppsOrConnectorsI18nKey = 'stats.mostUsedConnector.allConnectors';
		}
		if (indicator.name === 'stats.mostUsedApp' || indicator.name === 'stats.mostUsedConnector') {
			$scope.state.selectedAppName = $scope.state.allAppsOrConnectorsI18nKey;
		}

		let chartContext = $('#chart').get(0).getContext('2d');
		
		if ($scope.state.ctx && $scope.state.ctx !== chartContext){
			$scope.state.ctx = chartContext;
		} else {
			$scope.state.ctx = $scope.state.ctx && $scope.state.ctx === chartContext ? $scope.state.ctx : chartContext;
		}
		
		if ($scope.state.chart) {
			$scope.state.chart.destroy();
		}
		
		let indicatorChart = await indicator.getChart($scope.state.ctx, $scope.state.currentEntity);
		$scope.state.chart = indicatorChart;
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

	$scope.openAppDetails = async function() {
		if ($scope.state.selectedAppName) {
			AppService.getInstance().setSelectedAppName($scope.state.selectedAppName);

			if ($scope.state.selectedAppName === 'stats.mostUsedApps.allApps') {
				await $scope.openIndicator(MostUsedAppsIndicator.getInstance());
			} else {
				let detailsIndicator;
				if ($scope.state.currentIndicator.name === 'stats.mostUsedApp' ||
					$scope.state.currentIndicator.name === 'stats.appDetails') {
					detailsIndicator = AppDetailsIndicator.getInstance();
				} else {
					detailsIndicator = ConnectorDetailsIndicator.getInstance();
				}
				await detailsIndicator.init($scope.state.currentEntity);
				await $scope.openIndicator(detailsIndicator);
			}
			safeScopeApply();
		}
	}

	$scope.displayAppsSelect = function(): boolean {
		return $scope.state.currentIndicator &&
			($scope.state.currentIndicator.name === 'stats.mostUsedApp' || 
			$scope.state.currentIndicator.name === 'stats.mostUsedConnector' ||
			$scope.state.currentIndicator.name === 'stats.appDetails' ||
			$scope.state.currentIndicator.name === 'stats.connectorDetails');
	}

	$scope.openView = function(container, view){
		if(container === 'lightbox') {
			ui.showLightbox();
		} else {
			ui.hideLightbox();
		}
		$scope.state.currentIndicator = null;
		template.open(container, view);
	}
	
	const initEntityOnChange = async (entityId: string): Promise<void> => {
		$scope.state.currentEntity = $scope.state.entities.find(e => e.id === entityId);
		if (!$scope.state.currentEntity.cacheData 
			|| cacheService.needsRefresh($scope.state.currentEntity.cacheData.lastUpdate)) {
			await initData();
		}
		await toggleMostUsedConnectorsIndicator($scope.state.currentEntity);
	}

	$scope.selectEntity = async (entityId: string): Promise<void> => {
		await initEntityOnChange(entityId);
		safeScopeApply();
	}
	
	$scope.selectEntityAndOpenIndicator = async (entityId: string, indicator: Indicator): Promise<void> => {
		await initEntityOnChange(entityId);
		if (indicator.name === 'stats.mostUsedConnector' && 
			!$scope.state.indicators.find(i => i.name === 'stats.mostUsedConnector')) {
			await $scope.openIndicator(ConnectionsIndicator.getInstance());
		} else {
			await $scope.openIndicator(indicator);
		}
		safeScopeApply();
	}
	
	// get export API call
	$scope.getExportUrl = () => encodeURI(`/stats/export?indicator=${$scope.state.currentIndicator.api}&from=${dateService.getSinceDateISOStringWithoutMs()}&frequency=day&entityLevel=${$scope.state.currentEntity.level}&entity=${$scope.state.currentEntity.id}&accumulate=true`);
}]);
