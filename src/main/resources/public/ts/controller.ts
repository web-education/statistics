import { ng, template, ui, _, $, idiom as lang } from 'entcore';

import { ConnectionIndicator } from './indicators/line/connections.indicator';
import { Indicator, IndicatorApi } from './indicators/indicator';
import { UniqueVisitorsIndicator } from './indicators/line/unique-visitors.indicator';
import { ConnectionsDividedUniqueVisitorsIndicator } from './indicators/line/connections-unique-visitors.indicator';
import { MostUsedToolIndicator } from './indicators/bar/most-used-tool.indicator';
import { ConnectionsDailyPeakIndicator } from './indicators/stackedbar/connections-daily-peak.indicator';
import { ConnectionsWeeklyPeakIndicator } from './indicators/stackedbar/connections-weekly-peak.indicator';
import { ActivationIndicator } from './indicators/line/activation.indicator';
import { chartService, Frequency, ChartDataGroupedByProfile } from './services/chart.service';
import { StatsResponse } from './services/stats-api.service';
import { dateService } from './services/date.service';
import { Entity } from './services/entities.service';
import { statsApiService } from './services/stats-api.service';
import { entitiesService } from './services/entities.service';
import { cacheService } from './services/cache.service';

declare const Chart: any;

interface StatsControllerScope {
	$root: any;
	entities: Array<Entity>;
	scopeEntity: {current: Entity};
	currentIndicator: Indicator;
	indicators: Array<Indicator>;
	chart: typeof Chart;
	ctx: any;
	template: typeof template;
	lang: typeof lang;
	allowed: Array<any>;
	definitions: Array<string>;
	getExportUrl(indicator: IndicatorApi): string;
	
	openIndicator(indicator: Indicator): void;
	indicatorDetail(indicator: Indicator): void;
	allowedProjectFunctions(): boolean; 
	openView(container: any, view: any);
	$apply: any;
	getAggregatedValue(indicator: Indicator, entity: Entity): number | string;
	updateEntityCacheData(): Promise<void>;
	updateEntityCacheDataAndOpenIndicator(indicator: Indicator): void;
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
	
	$scope.definitions = [
		'uniqueVisitor',
		'connectionsByUniqueVisitor',
		'contents'
	]
	
	template.open('main', 'global');
	template.open('list', 'icons-list');
	
	// get user structures and classes
	let structures: Array<Entity> = await entitiesService.getStructures(false);
	structures.map(s => s.level = 'structure');
	let classes: Array<Entity> = await entitiesService.getClasses();
	classes.map(c => c.level = 'class');
	
	// entities array of structures and classes
	$scope.entities = [...structures, ...classes];
	
	// current inside a scopeEntity for select ng-change to work properly
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
	
	/**** LIST OF INDICATORS ****/
	$scope.indicators = [
		/* CONNECTIONS */
		new ConnectionIndicator(),
		/* UNIQUE VISITORS */
		new UniqueVisitorsIndicator(),
		/* CONNECTIONS DIVIDED BY UNIQUE VISITORS*/
		new ConnectionsDividedUniqueVisitorsIndicator(),
		/* MOST USED TOOLS */
		new MostUsedToolIndicator(),
		/* CONNECTIONS - DAILY PEAK */
		new ConnectionsDailyPeakIndicator(),
		/* CONNECTIONS - WEEKLY PEAK */
		new ConnectionsWeeklyPeakIndicator(),
		/* NUMBER OF ACTIVATED ACCOUNTS */
		new ActivationIndicator()
	];
	
	/**** INIT Data ****/
	let initEntityMonthCacheData = async (entity: Entity): Promise<void> => {
		// get accounts data from API
		let accountsData: Array<StatsResponse> = await statsApiService.getStats(
			'accounts',
			dateService.getSinceDateISOStringWithoutMs(),
			'month',
			entity.level,
			[entity.id]
		);
		// get accessData from API
		let accessData: Array<StatsResponse> = await statsApiService.getStats(
			'access',
			dateService.getSinceDateISOStringWithoutMs(),
			'month',
			entity.level,
			[entity.id]
		);
		// initialize entity cache data
		entity.cacheData = {
			indicators: [],
			lastUpdate: null
		};
		// for each indicator, calculate total value and fill entity cache with data
		$scope.indicators.forEach(indicator => {
			let data: Array<StatsResponse> = [];
			if (indicator.api === 'accounts') {
				data = accountsData;
			} else if (indicator.api === 'access') {
				data = accessData;
			}
			
			let total: number = 0;
			if (indicator.apiType !== 'mixed' && indicator.name !== 'stats.mostUsedTool') {
				data.forEach(d => total += d[indicator.apiType]);
			}
			
			let cacheIndicator = {
				name: indicator.name,
				apiType: indicator.apiType,
				data: data,
				frequency: 'month' as Frequency,
				totalValue: total
			};
			entity.cacheData.lastUpdate = new Date();
			entity.cacheData.indicators.push(cacheIndicator);
			$scope.$apply();
		});
	}
	
	/**** Init Total Value for specific indicators ****/
	
	let initConnectionsDividedUniqueVisitorsTotalValue = (entity: Entity) => {
		let authenticationsTotalValue = 0;
		const authenticationsCacheIndicator = entity.cacheData.indicators.find(indicator => indicator.name === 'stats.connections');
		if (authenticationsCacheIndicator) {
			authenticationsTotalValue = authenticationsCacheIndicator.totalValue as number;
		}
		let uniqueVisitorsTotalValue = 0;
		const uniqueVisitorsCacheIndicator = entity.cacheData.indicators.find(indicator => indicator.name === 'stats.uniqueVisitors');
		if (uniqueVisitorsCacheIndicator) {
			uniqueVisitorsTotalValue = uniqueVisitorsCacheIndicator.totalValue as number;
		}
		
		if (uniqueVisitorsTotalValue > 0) {
			const connectionsDividedUniqueVisitorsTotalValue = Math.round((authenticationsTotalValue / uniqueVisitorsTotalValue) * 100) / 100;
			const connectionsDividedUniqueVisitorsCacheIndicator = entity.cacheData.indicators.find(indicator => indicator.name === 'stats.connectionsByUniqueVisitors');
			connectionsDividedUniqueVisitorsCacheIndicator.totalValue = connectionsDividedUniqueVisitorsTotalValue;
			$scope.$apply();
		}
	}
	
	let initConnectionsWeeklyPeakTotalValue = async (entity: Entity) => {
		let chartData: ChartDataGroupedByProfile = {};
		const connectionsWeeklyPeakIndicator = entity.cacheData.indicators.find(indicator => indicator.name === 'stats.weeklyPeak');
		let accountsData: Array<StatsResponse> = await statsApiService.getStats(
			'accounts',
			dateService.getSinceDateISOStringWithoutMs(),
			'day',
			entity.level,
			[entity.id]
		);
		
		if (accountsData && accountsData.length === 0) {
			connectionsWeeklyPeakIndicator.totalValue = '-';
			return;
		}
		
		const dataGroupedByProfileAndDay = accountsData.reduce((acc, x) => {
            if (!acc[x['profile']]) {
                acc[x['profile']] = {};
            }
            (acc[x['profile']][new Date(x.date).getDay()] = acc[x['profile']][new Date(x.date).getDay()] || []).push(x['authentications']);
            return acc;
		}, {});
		
		Object.keys(dataGroupedByProfileAndDay).forEach(profile => {
            chartData[profile] = [];
            Object.keys(dataGroupedByProfileAndDay[profile]).forEach((day, i) => {
                let sum = dataGroupedByProfileAndDay[profile][day].reduce((acc, x) => acc + x);
                chartData[profile].push(sum);
            });
            // move Sunday value to the last array element
            let sundayValue = chartData[profile].shift();
            chartData[profile].push(sundayValue);
		});
		
		const sumAll = [];
		Object.keys(chartData).forEach(profile => {
			if (sumAll.length === 0) {
				sumAll.push(...chartData[profile]);
			} else {
				chartData[profile].forEach((sumDay, i) => sumAll[i] += sumDay);
			}
		});
		const indexOfMaxValue = sumAll.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
		var daysMatch = [
			'stats.monday',
			'stats.tuesday',
			'stats.wednesday',
			'stats.thursday',
			'stats.friday',
			'stats.saturday',
			'stats.sunday',
		];
		
		// save value to Entity cache data
		connectionsWeeklyPeakIndicator.totalValue = lang.translate(daysMatch[indexOfMaxValue]);
	}
	
	let initConnectionsDailyPeakTotalValue = async (entity: Entity) => {
		let chartData: ChartDataGroupedByProfile = {};
		const connectionsDailyPeakIndicator = entity.cacheData.indicators.find(indicator => indicator.name === 'stats.dailyPeak');
		
		let accountsData: Array<StatsResponse> = await statsApiService.getStats(
			'accounts',
			dateService.getSinceDateISOStringWithoutMs(),
			'hour',
			entity.level,
			[entity.id]
		);
		
		if (accountsData && accountsData.length === 0) {
			connectionsDailyPeakIndicator.totalValue = '-';
			return;
		}
		
		const dataGroupedByProfileAndDay = accountsData.reduce((acc, x) => {
            if (!acc[x['profile']]) {
                acc[x['profile']] = {};
            }
            (acc[x['profile']][new Date(x.date).getHours()] = acc[x['profile']][new Date(x.date).getHours()] || []).push(x['authentications']);
            return acc;
		}, {});
		
		Object.keys(dataGroupedByProfileAndDay).forEach(profile => {
            chartData[profile] = [];
            Object.keys(dataGroupedByProfileAndDay[profile]).forEach((day, i) => {
                let sum = dataGroupedByProfileAndDay[profile][day].reduce((acc, x) => acc + x);
                chartData[profile].push(sum);
            });
		});
		
		const sumAll = [];
		Object.keys(chartData).forEach(profile => {
			if (sumAll.length === 0) {
				sumAll.push(...chartData[profile]);
			} else {
				chartData[profile].forEach((sumHours, i) => sumAll[i] += sumHours);
			}
		});
		const indexOfMaxValue = sumAll.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
		
		// save value to Entity cache data
		connectionsDailyPeakIndicator.totalValue = indexOfMaxValue + 'h';
	}
	
	let initMostUsedToolTotalValue = async (entity: Entity) => {
		const mostUsedToolIndicator = entity.cacheData.indicators.find(indicator => indicator.name === 'stats.mostUsedTool');
		
		const dataGroupedByModuleAndProfile = statsApiService.groupByKeys(mostUsedToolIndicator.data, 'module', 'profile', 'access');
		
		let sumArray: Array<{module: string, total: number}> = [];
		Object.keys(dataGroupedByModuleAndProfile).forEach(module => {
			let sum = 0;
			Object.keys(dataGroupedByModuleAndProfile[module]).forEach(profile => {
				sum += dataGroupedByModuleAndProfile[module][profile].reduce((acc, x) => acc + x);
			});
			sumArray.push({module: module, total: sum});
		});
		
		let max = 0;
		sumArray.forEach(x => {
			if (x.total > max) {
				max = x.total;
			}
		});
		
		let moduleTotal = sumArray.find(x => x.total === max);
		let app = '';
		if (moduleTotal) {
			app = lang.translate(moduleTotal.module.toLowerCase());
		}
		// save value to Entity cache data
		mostUsedToolIndicator.totalValue = app;
		
	}
	
	let initData = async () => {
		await initEntityMonthCacheData($scope.scopeEntity.current);
		await initMostUsedToolTotalValue($scope.scopeEntity.current);
		await initConnectionsDividedUniqueVisitorsTotalValue($scope.scopeEntity.current);
		await initConnectionsWeeklyPeakTotalValue($scope.scopeEntity.current);
		await initConnectionsDailyPeakTotalValue($scope.scopeEntity.current);
		safeScopeApply();
	}
	
	initData();

	/**** Export API route and query params ****/
	$scope.getExportUrl = (indicator: IndicatorApi) => {
		return encodeURI(`/stats/export?indicator=${indicator}&from=${dateService.getSinceDateISOStringWithoutMs()}&frequency=month&entityLevel=${$scope.scopeEntity.current.level}&entity=${$scope.scopeEntity.current.id}`);
	};
	
	/**** Update Data when switching Entity ****/
	$scope.updateEntityCacheData = async (): Promise<void> => {
		if (!$scope.scopeEntity.current.cacheData 
			|| cacheService.needsRefresh($scope.scopeEntity.current.cacheData.lastUpdate)) {
			await initData();
		}
	}
	
	$scope.updateEntityCacheDataAndOpenIndicator = async (indicator: Indicator) => {
		await $scope.updateEntityCacheData(); 
		$scope.openIndicator(indicator);
	}
	
	$scope.getAggregatedValue = function(indicator: Indicator, entity: Entity) {
		if (entity.cacheData) {
			let entityCacheDataIndicator = entity.cacheData.indicators.find(i => i.name === indicator.name);
			if (entityCacheDataIndicator) {
				return entityCacheDataIndicator.totalValue as number | string;
			}
		}
		return 0;
	}

	$scope.openIndicator = async function(indicator){
		if(!indicator)
			return
		$scope.currentIndicator = indicator;
		let chartContext = $('#chart').get(0).getContext('2d');
		if($scope.ctx && $scope.ctx !== chartContext){
			$scope.ctx = chartContext;
		} else {
			$scope.ctx = $scope.ctx && $scope.ctx === chartContext ? $scope.ctx : chartContext;
		}
		
		if ($scope.chart) {
			$scope.chart.destroy();
		}
		
		switch(indicator.chartType){
			case 'line':
				$scope.chart = await chartService.getLineChart($scope.ctx, indicator, $scope.scopeEntity.current);
				break;
			case 'stackedbar':
				$scope.chart = await chartService.getStackedBarChart($scope.ctx, indicator, $scope.scopeEntity.current);
				break;
			case 'bar':
				$scope.chart = await chartService.getBarChart($scope.ctx, indicator, $scope.scopeEntity.current);
				break;
		}
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
	
	// for export feature
	$scope.allowedProjectFunctions = function(){
		return !$scope.allowed ||
			!($scope.allowed instanceof Array) ? true :
			$scope.allowed.length === 0 ? true :
			_.find(model.me.functions, function(f){ return _.contains($scope.allowed, f.code) })
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
}]);
