load("underscore-min.js")

var randomNb = function(min, max){
	return Math.floor(Math.random() * (max - min)) + min
}

var repeatStr = function(str, times, separator){
	var acc = ''
	separator = separator ? separator : ''
	for(var i = 0; i < times; i++){
		acc += str
	}
	return acc
}

var formatDate = function(date){
	return date.getFullYear() + "-" +
	 	(date.getMonth() + 1) + "-" +
		("0" + date.getDate()).slice(-2) + " 00:00.00.000"
}

var config = {
	dateStart: new Date("2015-11-01 00:00:00"),
	dateEnd: new Date("2015-11-18 00:00:00"),
	structures: ["c7301b91-307a-462f-9363-52cddc2e4814"],
	classes: [],
	profil: [
		"Teacher",
		"Student",
		"Personnel",
		"Relative",
		"Guest"
	],
	module: [
		"Support",
		"Homeworks",
		"Workspace",
		"Conversation",
		"Blog",
		"Archive",
		"Annuaire",
		"Rack",
		"AdminConsole",
		"Scrapbook"
	],
	types: [
		{
			"name": "LOGIN",
			"random": { "min" : 5000, "max": 13303 }
		},
		{
			"name": "LOGIN_H0",
			"random": { "min" : 50, "max": 120 }
		},
		{
			"name": "LOGIN_H1",
			"random": { "min" : 31, "max": 72 }
		},
		{
			"name": "LOGIN_H2",
			"random": { "min" : 22, "max": 53 }
		},
		{
			"name": "LOGIN_H3",
			"random": { "min" : 10, "max": 20 }
		},
		{
			"name": "LOGIN_H4",
			"random": { "min" : 5, "max": 15 }
		},
		{
			"name": "LOGIN_H5",
			"random": { "min" : 10, "max": 20 }
		},
		{
			"name": "LOGIN_H6",
			"random": { "min" : 22, "max": 53 }
		},
		{
			"name": "LOGIN_H7",
			"random": { "min" : 150, "max": 300 }
		},
		{
			"name": "LOGIN_H8",
			"random": { "min" : 300, "max": 700 }
		},
		{
			"name": "LOGIN_H9",
			"random": { "min" : 400, "max": 1000 }
		},
		{
			"name": "LOGIN_H10",
			"random": { "min" : 500, "max": 1200 }
		},
		{
			"name": "LOGIN_H11",
			"random": { "min" : 500, "max": 1200 }
		},
		{
			"name": "LOGIN_H12",
			"random": { "min" : 400, "max": 1000 }
		},
		{
			"name": "LOGIN_H13",
			"random": { "min" : 400, "max": 1000 }
		},
		{
			"name": "LOGIN_H14",
			"random": { "min" : 600, "max": 1300 }
		},
		{
			"name": "LOGIN_H15",
			"random": { "min" : 500, "max": 1300 }
		},
		{
			"name": "LOGIN_H16",
			"random": { "min" : 400, "max": 1000 }
		},
		{
			"name": "LOGIN_H17",
			"random": { "min" : 200, "max": 700 }
		},
		{
			"name": "LOGIN_H18",
			"random": { "min" : 200, "max": 700 }
		},
		{
			"name": "LOGIN_H19",
			"random": { "min" : 100, "max": 500 }
		},
		{
			"name": "LOGIN_H20",
			"random": { "min" : 100, "max": 500 }
		},
		{
			"name": "LOGIN_H21",
			"random": { "min" : 50, "max": 200 }
		},
		{
			"name": "LOGIN_H22",
			"random": { "min" : 50, "max": 200 }
		},
		{
			"name": "LOGIN_H23",
			"random": { "min" : 50, "max": 150 }
		},
		{
			"name": "ACTIVATION",
			"random": { "min" : 0, "max": 50 }
		},
		{
			"name": "ACCESS",
			"random": { "min" : 500, "max": 5000 }
		},
		{
			"name": "UNIQUE_VISITORS_MONTH",
			"random": { "min" : 3402, "max": 10293 }
		},
		{
			"name": "UNIQUE_VISITORS_WEEK",
			"random": { "min" : 486, "max": 1471 }
		},
		{
			"name": "UNIQUE_VISITORS_DAY",
			"random": { "min" : 70, "max": 211 }
		}
	],
	groups: [
		"profil/module",
		"module",
		"structures/profil",
		"structures/module",
		"structures/profil/module",
		"structures/classes/profil",
		"structures/classes/module",
		"structures/classes/profil/module"
	],
	groupTree: [],
	initGroupTree: function(){
		for(var i = 0; i < this.groups.length; i++){
			var group = this.groups[i]
			var subGroups = group.split('/')
			var memo = this.groupTree
			for(var j = 0; j < subGroups.length; j++){
				var subGroup = subGroups[j]
				var memoizedGroup = _.findWhere(memo, {label: subGroup})
				if(!memoizedGroup){
					memoizedGroup = {
						label: subGroup,
						subGroups: []
					}
					memo.push(memoizedGroup)
				}
				memo = memoizedGroup.subGroups
			}
		}
	},
	execGroup: function(type, date, group, remaining, groupedBy, parentIds){
		if(!parentIds)
			parentIds = {}
		if(!groupedBy)
			groupedBy = group.label
		else
			groupedBy += '/' + group.label

		var groupData = config[group.label]

		var tempTotal = remaining
		//print(JSON.stringify(group))
		//print(JSON.stringify(parentIds))
		for(var i = 0; i < groupData.length; i++){
			var groupTotal

			var groupMin = Math.floor(remaining / (2 * groupData.length))
			var groupMax = Math.floor(remaining / groupData.length)

			var group_id = groupData[i]
			var clonedParentIds = JSON.parse(JSON.stringify(parentIds))
			clonedParentIds[group.label+'_id'] = group_id

			if(i === (groupData.length - 1)){
				groupTotal = tempTotal
			} else {
				groupTotal = randomNb(groupMin, groupMax)
				tempTotal -= groupTotal
			}

			//INSERT GROUP
			var findObj = {
				date: formatDate(date),
				groupedBy: groupedBy
			}
			for(var parentId in clonedParentIds){
				findObj[parentId] = clonedParentIds[parentId]
			}
			var updateObj = {
				$setOnInsert: { date: formatDate(loopDate) },
				$set: {}
			}
			updateObj.$set[type.name] = groupTotal
			updateObj.$set[group.label+'_id'] = group_id

			mongoBulk.execute([
				{
					label: 'find',
					argument: findObj
				},
				{
					label: 'upsert',
					argument: {}
				},
				{
					label: 'updateOne',
					argument: updateObj
				}
			])

			for(var j = 0; j < group.subGroups.length; j++)
				this.execGroup(type, date, group.subGroups[j], groupTotal, groupedBy, clonedParentIds)
		}

	}
}

var mongoBulk = {
	bulkExecutionThreshold: 1000,
	bulk: db.getCollection('stats').initializeUnorderedBulkOp(),
	execute: function(funs){
		var bulk = this.bulk
		if(funs){
			var continuation = bulk
			for(var funIdx = 0; funIdx < funs.length; funIdx++){
				var fun = funs[funIdx]
				//print('['+fun.label+'] '+JSON.stringify(fun.argument))
				continuation = continuation[fun.label](fun.argument)
			}
			//print('----------------------------------------------------------------------------------------------------')
		}
		if(bulk.nInsertOps >= this.bulkExecutionThreshold){
	  		bulk.execute()
	    	this.bulk = db.getCollection('stats').initializeUnorderedBulkOp()
	  	}
	}
}

config.initGroupTree()

var loopDate = new Date(config.dateStart)
while(loopDate < config.dateEnd){

	//print(formatDate(loopDate))

	for(var typeIndex = 0; typeIndex < config.types.length; typeIndex++){
		var type = config.types[typeIndex]

		var totalNb = randomNb(type.random.min, type.random.max)

		//INSERT TOTAL

		var updateObj = {
			$setOnInsert: { date: formatDate(loopDate) },
			$set: {}
		}
		updateObj.$set[type.name] = totalNb

		mongoBulk.execute([
			{
				label: 'find',
				argument: {
					date: formatDate(loopDate)
				}
			},
			{
				label: 'upsert',
				argument: {}
			},
			{
				label: 'updateOne',
				argument: updateObj
			}
		])

		for(var i = 0; i < config.groupTree.length; i++){
			config.execGroup(type, loopDate, config.groupTree[i], totalNb)
		}
	}
	loopDate.setDate(loopDate.getDate() + 1)
}
mongoBulk.bulk.execute()
