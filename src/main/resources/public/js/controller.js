/**
	Wrapper controller
	------------------
	Main controller.
**/
function StatsController($scope, $rootScope, $timeout, model, template, route, date){

	/////////////////////////////////////////////
	/*               INIT & VIEWS              */

	$scope.lang = lang
	$scope.template = template
	$scope.structures = model.structures
	$scope.classes = model.classes
	$scope.indicatorContainers = model.indicatorContainers

	var DEFAULT_VIEW = function(){
		$scope.openView('main', 'global')
		$scope.openView('list', 'icons-list')
	}

	$scope.openView = function(container, view){
		if(container === "lightbox")
			ui.showLightbox()
		else
			ui.hideLightbox()

		//RESET VARS ON VIEW CHANGE
		$scope.currentIndicator = null
		$scope.currentContainer = null

		template.open(container, view)
	}

	/////////////////////////////////////////////
	/*                INDICATORS               */

	//Chart data adapters

	$scope.dailySumFunction = function(refDate, dayValue, chartData){
		chartData.push(dayValue.slice(0))
	}
	$scope.weeklySumFunction = function(refDate, dayValue, chartData){
		if(refDate.weekday() === 0){
			chartData.push([0, 0, 0, 0, 0, 0])
		}

		var weekValue = chartData[chartData.length - 1]
		for(var i = 0; i < weekValue.length; i++){
			weekValue[i] = weekValue[i] + dayValue[i]
		}

	}
	$scope.monthlySumFunction = function(refDate, dayValue, chartData){
		if(refDate.date() === 1){
			chartData.push([0, 0, 0, 0, 0, 0])
		}

		var monthValue = chartData[chartData.length - 1]
		for(var i = 0; i < monthValue.length; i++){
			monthValue[i] = monthValue[i] + dayValue[i]
		}
	}

	//Project container - added manually
	$scope.indicatorContainers.push(new IndicatorContainer({name: lang.translate("stats.project"), groups: {}}))

	/**** LIST OF INDICATORS ****/

	$scope.indicators = [
		/* CONNECTIONS */
		{
			name: "stats.connections",
			since: "stats.lastSeptember",
			icon: "connection-icon",
			type: "LOGIN",
			chartType: "Line",
			chartLabel: lang.translate("stats.labels.connections"),
			chartGranularities: ["day", "week", "month"],
			chartGranularity: "month",
			chartDatasets: function(){ return $scope.profileDataSets() },
			getValue: function(container){
				return container.getAggregatedSum(this.type)
			},
			getChartData: function(container){
				var aggregationFunction

				switch(this.chartGranularity){
					case "month":
						aggregationFunction = $scope.monthlySumFunction
						break;
					case "week":
						aggregationFunction = $scope.weeklySumFunction
						break;
					case "day":
						aggregationFunction = $scope.dailySumFunction
						break;
				}

				return container.getChartData(this.type, aggregationFunction, date);
			}
		},
		/* UNIQUE VISITORS */
		{
			name: "stats.uniqueVisitors",
			since: "stats.last30days",
			icon: "unique-visitors-icon",
			type: "UNIQUE_VISITORS",
			chartType: "Line",
			chartLabel: lang.translate("stats.labels.uniqueVisitors"),
			chartGranularities: ["day", "week", "month"],
			chartGranularity: "month",
			chartDatasets: function(){ return $scope.profileDataSets() },
			getValue: function(container){
				var lastAggreg = container.getLastAggregation()
				return (typeof lastAggreg === "object" && !isNaN(lastAggreg[this.type])) ? lastAggreg[this.type] : 0
			},
			getChartData: function(container){
				var aggregationFunction

				switch(this.chartGranularity){
					case "month":
						aggregationFunction = function(refDate, dayValue, chartData){
							var endOfMonth = date.create(refDate).endOf('month')
							var today = date.create()

							if(refDate.date() === 1){
								chartData.push([0, 0, 0, 0, 0, 0])
							}
							if(refDate.date() === endOfMonth.date() || refDate.dayOfYear() === today.dayOfYear() - 1){
								var monthValue = chartData[chartData.length - 1]
								for(var i = 0; i < monthValue.length; i++){
									monthValue[i] = dayValue[i]
								}
							}
						}
						break
					case "week":
						aggregationFunction = function(refDate, dayValue, chartData){
							var today = date.create()

							if(refDate.weekday() === 0){
								chartData.push([0, 0, 0, 0, 0, 0])
							}
							if(refDate.weekday() === 6 || refDate.dayOfYear() === today.dayOfYear() - 1){
								var weekValue = chartData[chartData.length - 1]
								for(var i = 0; i < weekValue.length; i++){
									weekValue[i] = dayValue[i]
								}
							}
						}
						break
					case "day":
						aggregationFunction = $scope.dailySumFunction
						break
				}

				return container.getChartData(this.type, aggregationFunction, date);
			}
		},
		/* CONNECTIONS DIVIDED BY UNIQUE VISITORS*/
		{
			name: "stats.connectionsByUniqueVisitors",
			since: "stats.last30days",
			icon: "connection-by-visitors-icon",
			chartType: "Line",
			chartLabel: lang.translate("stats.labels.connectionsByUniqueVisitors"),
			chartGranularities: ["month"],
			chartGranularity: "month",
			chartDatasets: function(){ return $scope.profileDataSets() },
			getValue: function(container){
				var refDate = new Date()
				refDate.setDate(refDate.getDate() - 30)
				var lastAggreg = container.getLastAggregation()

				var connections = container.getAggregatedSum("LOGIN", refDate)
				var uniqueVisitors = (typeof lastAggreg === "object" && !isNaN(lastAggreg["UNIQUE_VISITORS"])) ? lastAggreg["UNIQUE_VISITORS"] : 0
				return uniqueVisitors > 0 ? Math.round((connections / uniqueVisitors) * 100)/100 : 0
			},
			getChartData: function(container){
				var aggregationFunction = function(refDate, dayValue, chartData){
					var endOfMonth = date.create(refDate).endOf('month')
					var today = date.create()

					if(refDate.date() === 1){
						chartData.push([0, 0, 0, 0, 0, 0])
					}
					if(refDate.date() === endOfMonth.date() || refDate.dayOfYear() === today.dayOfYear() - 1){
						var monthValue = chartData[chartData.length - 1]
						for(var i = 0; i < monthValue.length; i++){
							monthValue[i] = dayValue[i]
						}
					}
				}


				var connectionData = container.getChartData("LOGIN", $scope.monthlySumFunction, date)
				var uniqueVisitorsData = container.getChartData("UNIQUE_VISITORS", aggregationFunction, date)

				var finalResult = []
				for(var i = 0; i < connectionData.length; i++){
					var row = []
					finalResult.push(row)
					for(var j = 0; j < connectionData[i].length; j++){
						row[j] = uniqueVisitorsData[i][j] > 0 ?  Math.round((connectionData[i][j] / uniqueVisitorsData[i][j])*100)/100 : 0
					}
				}

				return finalResult;
			}
		},
		/* MOST USED TOOLS */
		{
			name: "stats.mostUsedTool",
			since: "stats.lastSeptember",
			icon: "stats-service-icon",
			type: "ACCESS",
			chartType: "Bar",
			chartLabel: lang.translate("stats.labels.mostUsedTool"),
			chartProfile: "total",
			chartProfiles: ["total", "Teacher", "Personnel", "Relative", "Student"],
			// Memoize
			cache: {},
			getSumByModule: function(container){
				if(this.cache.container !== container || !this.cache.sumByModule){
					this.cache.container = container
					this.cache.sumByModule = container.getAggregatedGroupMap(this.type, 'module')
				}
				return this.cache.sumByModule
			},
			getSumByModuleByProfile : function(container){
				if(this.cache.container !== container || !this.cache.sumByModuleByProfile){
					this.cache.container = container
					this.cache.sumByModuleByProfile =  container.getAggregatedGroupMapByProfile(this.type)
				}
				return this.cache.sumByModuleByProfile
			},
			chartDatasets: function(){ return $scope.singleBarDataSets(this.chartProfile) },
			chartLabels: function(container){
				var sortingFunction = function(obj, maxNb){
					var result = []

					var sortDescending = function(a, b){
						return b - a
					}

					for(var module in obj){
						result.push(obj[module])
					}

					result = result.sort(sortDescending)

					for(module in obj){
						var index = result.indexOf(obj[module])
						result[index] = module
					}

					return result.slice(0, maxNb)
				}

				var sumByModule = this.getSumByModule(container)
				var sumByModuleByProfile = this.getSumByModuleByProfile(container)

				var datasets = []

				if(this.chartProfile === "total"){
					datasets = sortingFunction(sumByModule, 5)
				} else {
					datasets = sortingFunction(sumByModuleByProfile[this.chartProfile], 5)
				}

				datasets = _.map(datasets, function(item){
					return lang.translate(item.toLocaleLowerCase())
				})

				return datasets
			},
			getValue: function(container){
				var sumByModule = this.getSumByModule(container)
				var mostUsedModule = {
					module: "stats.none",
					views: 0
				}
				for(var prop in sumByModule){
					if(mostUsedModule.views < sumByModule[prop]){
						mostUsedModule.module = prop
						mostUsedModule.views = sumByModule[prop]
					}
				}
				return lang.translate(mostUsedModule.module.toLowerCase())
			},
			getChartData: function(container){
				var data = []

				var sortingFunction = function(obj, maxNb){
					var result = []

					var sortDescending = function(a, b){
						return b - a
					}

					for(var module in obj){
						result.push(obj[module])
					}

					result = result.sort(sortDescending)

					return result.slice(0, maxNb)
				}

				var sumByModule = this.getSumByModule(container)
				var sumByModuleByProfile = this.getSumByModuleByProfile(container)

				var sortedResults = []

				if(this.chartProfile === "total"){
					sortedResults = sortingFunction(sumByModule, 5)
				} else {
					sortedResults = sortingFunction(sumByModuleByProfile[this.chartProfile], 5)
				}

				for(var i = 0; i < sortedResults.length; i++)
					data.push([sortedResults[i]])

				return data
			}
		},
		/* CONNECTIONS - DAILY PEAK */
		{
			name: "stats.dailyPeak",
			since: "stats.lastSeptember",
			icon: "clock-icon",
			type: "LOGIN",
			chartType: "StackedBar",
			chartLabel: lang.translate("stats.labels.dailyPeak"),
			chartDatasets: function(){ return $scope.profileDataSets().slice(1) },
			chartLabels: function(){
				var labels = []
				for(var i = 0; i < 24; i++){
					var hour1 = ("0"+i).slice(-2)
					var hour2 = ("0"+(i+1)).slice(-2)
					labels.push(hour1+'h-'+hour2+'h')
				}
				return labels
			},
			getValue: function(container){
				var hour = 0
				var connections = 0

				for(var i = 0; i < 24; i++){
					var hourConnections = container.getAggregatedSum(this.type+"_H"+i)
					if(hourConnections > connections){
						hour = i
						connections = hourConnections
					}
				}

				return hour+"h - "+(hour+1)+"h"
			},
			getChartData: function(container){
				var data = []

				for(var i = 0; i < 24; i++){
					var hourData = [0, 0, 0, 0, 0]

					//hourData[0] = container.getAggregatedSum(this.type+"_H"+i)

					var profileData = container.getAggregatedGroupMap(this.type+"_H"+i, 'profil')
					for(var prop in profileData){
						var index = 4
						switch(prop){
							case 'Teacher':
								index = 0
								break
							case 'Personnel':
								index = 1
								break
							case 'Relative':
								index = 2
								break
							case 'Student':
								index = 3
								break
						}
						hourData[index] = !isNaN(profileData[prop]) ? profileData[prop] : 0
					}

					data.push(hourData.slice(0))
				}
				return data
			}
		},
		/* CONNECTIONS - WEEKLY PEAK */
		{
			name: "stats.weeklyPeak",
			since: "stats.lastSeptember",
			icon: "calendar-button",
			type: "LOGIN",
			chartType: "StackedBar",
			chartLabel: lang.translate("stats.labels.weeklyPeak"),
			chartDatasets: function(){ return $scope.profileDataSets().slice(1) },
			chartLabels: function(){
				var labels = []
				labels.push(lang.translate("stats.monday"))
				labels.push(lang.translate("stats.tuesday"))
				labels.push(lang.translate("stats.wednesday"))
				labels.push(lang.translate("stats.thursday"))
				labels.push(lang.translate("stats.friday"))
				labels.push(lang.translate("stats.saturday"))
				labels.push(lang.translate("stats.sunday"))
				return labels
			},
			getValue: function(container){
				var type = this.type

				var results = {
					"stats.monday" 		: 0,
					"stats.tuesday" 	: 0,
					"stats.wednesday" 	: 0,
					"stats.thursday" 	: 0,
					"stats.friday" 		: 0,
					"stats.saturday" 	: 0,
					"stats.sunday" 		: 0
				}
				var dayMatching = [
					"stats.sunday",
					"stats.monday",
					"stats.tuesday",
					"stats.wednesday",
					"stats.thursday",
					"stats.friday",
					"stats.saturday"
				]

				for(var i = 0; i < container.data.length; i++){
					var dayValue = container.data[i][type]
					if(!isNaN(dayValue)){
						var dayDate = new Date(container.data[i].date.substring(0, 10)).getDay()
						results[dayMatching[dayDate]] += dayValue
					}
				}

				var mostConnections = -1
				var resultDay = ""
				for(var day in results){
					if(results[day] > mostConnections){
						resultDay = day
						mostConnections = results[day]
					}
				}

				return lang.translate(resultDay)
			},
			getChartData: function(container){
				var data = []
				var i = 0

				for(i = 0; i < 7; i++)
					data.push([0, 0, 0, 0, 0])

				for(i = 0; i < container.data.profil.length; i++){
					var dayValue = container.data.profil[i][this.type]
					if(!isNaN(dayValue)){
						var dayDate = new Date(container.data.profil[i].date.substring(0, 10)).getDay()

						var index = 4
						switch(container.data.profil[i]["profil_id"]){
							case 'Teacher':
								index = 0
								break
							case 'Personnel':
								index = 1
								break
							case 'Relative':
								index = 2
								break
							case 'Student':
								index = 3
								break
						}

						data[(dayDate+7-1)%7][index] += dayValue
					}
				}

				return data
			}
		},
		/* NUMBER OF ACTIVATED ACCOUNTS */
		{
			name: "stats.activatedAccounts",
			since: "stats.lastSeptember",
			icon: "people-icon",
			type: "ACTIVATION",
			chartType: "Line",
			chartLabel: lang.translate("stats.labels.activatedAccounts"),
			chartGranularities: ["day", "week", "month"],
			chartGranularity: "month",
			chartDatasets: function(){ return $scope.profileDataSets() },
			getValue: function(container){
				return container.getAggregatedSum(this.type)
			},
			getChartData: function(container){
				var aggregationFunction

				switch(this.chartGranularity){
					case "month":
						aggregationFunction = $scope.monthlySumFunction
						break;
					case "week":
						aggregationFunction = $scope.weeklySumFunction
						break;
					case "day":
						aggregationFunction = $scope.dailySumFunction
						break;
				}

				return container.getChartData(this.type, aggregationFunction, date);
			}
		},

	]

	/////////////////////////////////////////////
	/*               DEFINITIONS               */

	$scope.definitions = [
		"uniqueVisitor",
		"connectionsByUniqueVisitor",
		"contents"
	]

	/////////////////////////////////////////////
	/*                  CHARTS                 */

	///// LABELS

	$scope.fillMonthLabels = function(){
		labels = []
		var refDate = date.create("2014-09-01")
		var todayDate = date.create(new Date())

		while(refDate.isBefore(todayDate)){
			labels.push(refDate.format("MMMM"))
			refDate = refDate.add(1, 'M')
		}

		return labels;
	}

	$scope.fillWeekLabels = function(){
		labels = []
		var refDate = date.create("2014-09-01")
		var todayDate = date.create(new Date())

		while(refDate.isBefore(todayDate)){
			labels.push(lang.translate("stats.week")+" "+refDate.format("wo"))
			refDate = refDate.add(1, 'w')
		}

		return labels;
	}

	$scope.fillDayLabels = function(){
		labels = []
		var refDate = date.create("2014-09-01")
		var todayDate = date.create(new Date())

		while(refDate.isBefore(todayDate)){
			labels.push(refDate.format("L"))
			refDate = refDate.add(1, 'd')
		}

		return labels;
	}

	///// DATASETS

	$scope.profileDataSets = function(){
		return [{
				label: lang.translate("stats.total"),
				fillColor: "#333",
				strokeColor: "#333",
				pointColor: "#333",
				pointStrokeColor: "#333",
				pointHighlightFill: "#333",
				pointHighlightStroke: "#fff",
				data: []
			},
			{
				label: lang.translate("stats.teacher"),
				fillColor: "#6fbe2e",
				strokeColor: "#6fbe2e",
				pointColor: "#6fbe2e",
				pointStrokeColor: "#6fbe2e",
				pointHighlightFill: "#6fbe2e",
				pointHighlightStroke: "#fff",
				highlightFill: "rgba(111, 190, 46, 0.75)",
        		highlightStroke: "rgba(111, 190, 46, 1)",
				data: []
			},
			{
				label: lang.translate("stats.personnel"),
				fillColor: "#a348c0",
				strokeColor: "#a348c0",
				pointColor: "#a348c0",
				pointStrokeColor: "#a348c0",
				pointHighlightFill: "#a348c0",
				pointHighlightStroke: "#fff",
				highlightFill: "rgba(163, 72, 192, 0.75)",
				highlightStroke: "rgba(163, 72, 192, 1)",
				data: []
			},
			{
				label: lang.translate("stats.relative"),
				fillColor: "#46afe6",
				strokeColor: "#46afe6",
				pointColor: "#46afe6",
				pointStrokeColor: "#46afe6",
				pointHighlightFill: "#46afe6",
				pointHighlightStroke: "#fff",
				highlightFill: "rgba(70, 175, 230, 0.75)",
				highlightStroke: "rgba(70, 175, 230, 1)",
				data: []
			},
			{
				label: lang.translate("stats.student"),
				fillColor: "#ff8d2e",
				strokeColor: "#ff8d2e",
				pointColor: "#ff8d2e",
				pointStrokeColor: "#ff8d2e",
				pointHighlightFill: "#ff8d2e",
				pointHighlightStroke: "#fff",
				highlightFill: "rgba(255, 141, 46, 0.75)",
				highlightStroke: "rgba(255, 141, 46, 1)",
				data: []
			},
			{
				label: lang.translate("stats.others"),
				fillColor: "#ff3a55",
				strokeColor: "#ff3a55",
				pointColor: "#ff3a55",
				pointStrokeColor: "#ff3a55",
				pointHighlightFill: "#ff3a55",
				pointHighlightStroke: "#fff",
				highlightFill: "rgba(255, 58, 85, 0.75)",
				highlightStroke: "rgba(255, 58, 85, 1)",
				data: []
			}
		]
	}

	$scope.singleBarDataSets = function(label){
		return [{
				label: lang.translate('stats.'+label.toLowerCase()),
				fillColor: "rgba(47,140,201,0.5)",
            	strokeColor: "rgba(47,140,201,0.8)",
            	highlightFill: "rgba(47,140,201,0.75)",
            	highlightStroke: "rgba(47,140,201,1)",
				data: []
			}]
	}

	//// LINE CHART

	$scope.setupLineChart = function(indicator, container){
		var chartOptions = {
			datasetFill: false,
			bezierCurveTension : 0.1,
			legendTemplate: '<ul class=\"<%=name.toLowerCase()%>-legend\">'+
                  			'<% for (var i=0; i<datasets.length; i++) { %>'+
                    		'<li>'+
                    		'<div style=\"background-color:<%=datasets[i].pointColor%>\"></div>'+
                    		'<span><% if (datasets[i].label) { %><%= datasets[i].label %><% } %></span>'+
                  			'</li>'+
                			'<% } %>'+
              				'</ul>'
		}
		var labels = []
		var datasets = indicator.chartDatasets()

		switch(indicator.chartGranularity){
			case "month":
				labels = $scope.fillMonthLabels()
				chartOptions.pointHitDetectionRadius = 10
				break;
			case "week":
				labels = $scope.fillWeekLabels()
				chartOptions.pointHitDetectionRadius = 5
				break;
			case "day":
				labels = $scope.fillDayLabels()
				chartOptions.pointDot = false
				chartOptions.showXLabels = 7
				chartOptions.pointHitDetectionRadius = 1
				break;
		}

		var coreData = indicator.getChartData(container)

		for(var i = 0; i < coreData.length; i++){
			for(var j = 0; j < coreData[i].length; j++){
				datasets[j].data.push(coreData[i][j])
			}
		}

		var chartData = {
			'labels': labels,
			'datasets': datasets
		}

		if($scope.chart.destroy)
			$scope.chart.destroy()
		$scope.chart = $scope.chart.Line ?  $scope.chart.Line(chartData, chartOptions) : $scope.chart.chart.Line(chartData, chartOptions)
	}

	$scope.setupStackedBarChart = function(indicator, container){
		var chartOptions = {
			legendTemplate: '<ul class=\"<%=name.toLowerCase()%>-legend\">'+
                  			'<% for (var i=0; i<datasets.length; i++) { %>'+
                    		'<li>'+
                    		'<div style=\"background-color:<%=datasets[i].fillColor%>\"></div>'+
                    		'<span><% if (datasets[i].label) { %><%= datasets[i].label %><% } %></span>'+
                  			'</li>'+
                			'<% } %>'+
              				'</ul>'
		}
		var labels = indicator.chartLabels()
		var datasets = indicator.chartDatasets()

		var coreData = indicator.getChartData(container)

		for(var i = 0; i < coreData.length; i++){
			for(var j = 0; j < coreData[i].length; j++){
				datasets[j].data.push(coreData[i][j])
			}
		}

		var chartData = {
			'labels': labels,
			'datasets': datasets
		}

		if($scope.chart.destroy)
			$scope.chart.destroy()
		$scope.chart = $scope.chart.StackedBar ?  $scope.chart.StackedBar(chartData, chartOptions) : $scope.chart.chart.StackedBar(chartData, chartOptions)
	}

	$scope.setupBarChart = function(indicator, container){
		var chartOptions = {
			legendTemplate: '<ul class=\"<%=name.toLowerCase()%>-legend\">'+
							'<% for (var i=0; i<datasets.length; i++) { %>'+
							'<li>'+
							'<div style=\"background-color:<%=datasets[i].fillColor%>\"></div>'+
							'<span><% if (datasets[i].label) { %><%= datasets[i].label %><% } %></span>'+
							'</li>'+
							'<% } %>'+
							'</ul>'
		}
		var labels = indicator.chartLabels(container)
		var datasets = indicator.chartDatasets()

		var coreData = indicator.getChartData(container)

		for(var i = 0; i < coreData.length; i++){
			for(var j = 0; j < coreData[i].length; j++){
				datasets[j].data.push(coreData[i][j])
			}
		}

		var chartData = {
			'labels': labels,
			'datasets': datasets
		}

		if($scope.chart.destroy)
			$scope.chart.destroy()
		$scope.chart = $scope.chart.Bar ?  $scope.chart.Bar(chartData, chartOptions) : $scope.chart.chart.Bar(chartData, chartOptions)
	}

	$scope.openIndicator = function(indicator, container){
		if(!indicator)
			return

		$scope.currentIndicator = indicator
		if($scope.ctx && $scope.ctx !== $("#chart").get(0).getContext("2d")){
			$scope.ctx = $("#chart").get(0).getContext("2d")
			$scope.chart.destroy()
			$scope.chart = new Chart($scope.ctx)
		} else {
			$scope.ctx = $scope.ctx && $scope.ctx === $("#chart").get(0).getContext("2d") ? $scope.ctx : $("#chart").get(0).getContext("2d");
			$scope.chart = $scope.chart ? $scope.chart : new Chart($scope.ctx)
		}

		switch(indicator.chartType){
			case "Line":
				$scope.setupLineChart(indicator, container)
				break;
			case "StackedBar":
				$scope.setupStackedBarChart(indicator, container)
				break;
			case "Bar":
				$scope.setupBarChart(indicator, container)
				break;
		}


		$("#chart-legend-container").html($scope.chart.generateLegend())
	}

	$scope.setCurrentContainer = function(container){
		$scope.currentContainer = container
	}

	$scope.indicatorDetail = function(indicator, container){
		$scope.openView('list', 'table-list')

		var timeoutFunction = function(count){
			if(count < 10 && $('#chart').length <= 0){
				$timeout(function(){ timeoutFunction(count+1) }, 50*count)
			} else {
				$scope.setCurrentContainer(container)
				$scope.openIndicator(indicator, container)
			}
		}

		$timeout(function(){
			timeoutFunction(1)
		}, 50)

	}

	//// ACTIONS ON CONTROLLER INIT

	DEFAULT_VIEW()

	//dirty
	model.scope = $scope

}
