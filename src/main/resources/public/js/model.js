var executeHook = function(hook){
    if(typeof hook === 'function')
        hook.apply(this, Array.prototype.slice.call(arguments).slice(1))
}

///////////////
/// Classes ///

function Classe(id){
    this.id = id;
}
Classe.prototype = {
    API_PATH 	: "/directory/class/",
    get: function(hook){
        var classe = this
        return http().get(this.API_PATH + this.id).done(function(data){
            classe.updateData(data)
            executeHook(hook, classe)
        })
    }
}

//////////////////
/// Structures ///

function Structure(id){
    this.id = id;
}
Structure.prototype = {
    API_PATH 	: "/directory/school/",
    get: function(hook, name, id){
        var school = this
        return http().get(this.API_PATH + this.id).done(function(data){
            school.updateData(data)
            executeHook(hook, data.name, data.id)
        })
    }
}

///////////////////
/// Indicators ///

function IndicatorContainer(data){
    this.name = data.name
    this.groups = data.groups ? data.groups : {}
    this.data = []
    this.get()
    this.getProfiles()
    this.getModules()
    this.getModulesByProfile()
}

IndicatorContainer.prototype = {
	API_PATH 	: "/stats/",
    //AJAX get - retrieves cumulated values
    get: function(){
        var stats = this
        var getquery = ""
        for(var prop in this.groups){
            getquery += (getquery.length === 0 ? "?" : "&")
            getquery += prop + "=" + this.groups[prop]
        }
        return http().get(this.API_PATH + 'list' + getquery).done(function(data){
            for(prop in data){
                stats.data[prop] = data[prop]
            }
            if(model.scope) model.scope.$apply()
        })
    },
    //AJAX get - retrieves values by profile
    getProfiles: function(){
        var stats = this
        var getquery = ""
        for(var prop in this.groups){
            getquery += (getquery.length === 0 ? "?" : "&")
            getquery += prop + "=" + this.groups[prop]
        }
        getquery += (getquery.length === 0 ? "?" : "&") + "groupedBy=profil"
        return http().get(this.API_PATH + 'list' + getquery).done(function(data){
            stats.data.profil = data
            if(model.scope) model.scope.$apply()
        })
    },
    //AJAX get - retrieves values by module
    getModules: function(){
        var stats = this
        var getquery = ""
        for(var prop in this.groups){
            getquery += (getquery.length === 0 ? "?" : "&")
            getquery += prop + "=" + this.groups[prop]
        }
        getquery += (getquery.length === 0 ? "?" : "&") + "groupedBy=module"
        return http().get(this.API_PATH + 'list' + getquery).done(function(data){
            stats.data.module = data
            if(model.scope) model.scope.$apply()
        })
    },
    //AJAX GET - retrieves values by profile by module
    getModulesByProfile: function(){
        var stats = this
        var getquery = ""
        for(var prop in this.groups){
            getquery += (getquery.length === 0 ? "?" : "&")
            getquery += prop + "=" + this.groups[prop]
        }
        getquery += (getquery.length === 0 ? "?" : "&") + "groupedBy=profil/module"
        return http().get(this.API_PATH + 'list' + getquery).done(function(data){
            stats.data.moduleByProfile = data
            if(model.scope) model.scope.$apply()
        })
    },
    //Returns the last value (date wise)
    getLastAggregation: function(){
        var lastAggregation = this.data[0]
        for(var i = 0; i < this.data.length; i++){
            var referenceDate = new Date(lastAggregation.date.substring(0,10))
            var compareDate = new Date(this.data[i].date.substring(0,10))
            if(compareDate.getTime() > referenceDate.getTime())
                lastAggregation = this.data[i]
        }
        return lastAggregation
    },
    //Returns the sum of all values - optional parameter fromDate : only aggregate past that date
    getAggregatedSum: function(indicatorType, fromDate){
        var sum = 0
        for(var i = 0; i < this.data.length; i++){
            var dayValue = this.data[i][indicatorType]
            var dayDate = new Date(this.data[i].date.substring(0,10))
            var aggregate = true

            if(typeof fromDate !=='undefined' && fromDate.getTime() > dayDate.getTime()){
                aggregate = false
            }

            if(aggregate && !isNaN(dayValue))
                sum += dayValue
        }
        return sum
    },
    //Returns the sum of all values grouped by module / profile - optional parameter fromDate : only aggregate past that date
    getAggregatedGroupMap : function(indicatorType, prefix, fromDate){
        var map = {}
        var statslist = this.data[prefix]

        if(typeof statslist === 'undefined')
            return map

        for(var i = 0; i < statslist.length; i++){
            var value = statslist[i][indicatorType]
            var dayDate = new Date(statslist[i].date.substring(0,10))
            var aggregate = true

            if(typeof fromDate !=='undefined' && fromDate.getTime() > dayDate.getTime()){
                aggregate = false
            }

            if(aggregate && !isNaN(value)){
                var previousValue = map[statslist[i][prefix+'_id']]
                map[statslist[i][prefix+'_id']] = isNaN(previousValue) ? value : previousValue + value
            }
        }
        return map
    },
    //Returns the sum of all values grouped by module by profile - optional parameter fromDate : only aggregate past that date
    getAggregatedGroupMapByProfile: function(indicatorType, fromDate){
        var map = {}
        var statslist = this.data.moduleByProfile

        if(typeof statslist === 'undefined')
            return map

        for(var i = 0; i < statslist.length; i++){
            var value = statslist[i][indicatorType]
            var dayDate = new Date(statslist[i].date.substring(0,10))
            var aggregate = true

            if(typeof fromDate !=='undefined' && fromDate.getTime() > dayDate.getTime()){
                aggregate = false
            }

            if(aggregate && !isNaN(value)){
                var profil_id = statslist[i]['profil_id']
                var module_id = statslist[i]['module_id']
                if(!map[profil_id])
                    map[profil_id] = {}
                var previousValue = map[profil_id][module_id]
                map[profil_id][module_id] = isNaN(previousValue) ? value : previousValue + value
            }
        }
        return map
    },
    //Adapts the data to Chart.js and returns it
    getChartData: function(indicatorType, sumFunction, date){
        var totalData = this.data
        var profileData = this.data.profil

        //0 : total, 1 : teacher, 2: personnel, 3: relative, 4: student: 5: other
        var chartData = []

        var refDate = date.create("2014-09-01")
        var todayDate = date.create(new Date())

        var dayData = []

        var iTotal = totalData.length - 1;
        var iProfile = profileData.length - 1;

        var dayValue
        var totalDataDate
        var profileDataDate
        var profile

        while(refDate.isBefore(todayDate)){
            dayData = []

            if(iTotal >= 0){
                totalDataDate = date.create(totalData[iTotal].date.substring(0, 10))
                if(totalDataDate.isSame(refDate)){
                    dayValue = totalData[iTotal][indicatorType]
                    dayData[0] = !isNaN(dayValue) ? dayValue : 0
                    iTotal--;
                }
            }
            if(iProfile >= 0){
                while(true){
                    if(iProfile < 0)
                        break
                    profileDataDate = date.create(profileData[iProfile].date.substring(0, 10))
                    if(!profileDataDate.isSame(refDate))
                        break

                    dayValue = profileData[iProfile][indicatorType]
                    profile = profileData[iProfile].profil_id
                    switch(profile){
                        case "Teacher":
                            dayData[1] = !isNaN(dayValue) ? dayValue : 0
                            break;
                        case "Personnel":
                            dayData[2] = !isNaN(dayValue) ? dayValue : 0
                            break;
                        case "Relative":
                            dayData[3] = !isNaN(dayValue) ? dayValue : 0
                            break;
                        case "Student":
                            dayData[4] = !isNaN(dayValue) ? dayValue : 0
                            break;
                        default:
                            dayData[5] = !isNaN(dayValue) ? dayValue : 0
                            break;
                    }
                    iProfile--;
                }
            }

            for(var i = 0; i < 6; i++)
                if(isNaN(dayData[i]))
                    dayData[i] = 0

            sumFunction(refDate, dayData, chartData)

            refDate = refDate.add(1, 'd')
        }

        return chartData
    }
}


///////////////////////
///   MODEL.BUILD   ///

model.build = function(){
    this.makeModels([Classe, Structure, IndicatorContainer])

    this.collection(IndicatorContainer, {})

    this.collection(Structure, {
        sync: function(){
            var structure_ids = model.me.structures
            var pushIndicator = function(name, id){
                model.indicatorContainers.push(new IndicatorContainer({name: name, groups: {"structures" : id}}))
            }

            for(var i = 0; i < structure_ids.length; i++){
                var struct = new Structure(structure_ids[i])
                this.push(struct)
                struct.get(pushIndicator)
            }
        }
    })

    this.collection(Classe, {
        sync: function(){
            var that = this
            var class_ids = model.me.classes
            var structure_ids = model.me.structures

            _.forEach(structure_ids, function(structureId){
                http().get('/userbook/structure/' + structureId).done(function(result){
                    classes = result.classes

                    //Filter to keep only the user classes.
                    classes = _.filter(classes, function(c){
                        return model.me.classes.indexOf(c.id) >= 0;
                    })

                    _.forEach(classes, function(classData){
                        var classe = new Classe(classData.id)
                        classe.updateData(classData)
                        that.push(classe)
                        model.indicatorContainers.push(new IndicatorContainer({name: classData.name, groups: {"structures": structureId, "classes" : classData.id}}))
                    })
                })
            })

        }
    })

};

///////////////////////
