var _ = require('underscore');

module.exports = (function(){

    var queue = {

        roomID: 1,

        config: {
            clansPerRequest: 30,
            queueThreshold : 50
        },

        stats: {
            requestsDone  : 0,
            requestsFailed: 0,
            clansDone     : 0,
            clansFailed   : 0,
            speed         : 0,
            startedAt     : new Date(),
            cycleStartedAt: null
        },

        toDo: [],
        pending: {},
        IDcounter: 0,
        isFilling: false,
        regionStats: {},
        recent: [],

        mixArrays: function (a1, a2){
            var result = [];
            var length = a2.length;
            for(var i = 0; i < length; i++){
                var ratio = a1.length/a2.length;
                result.push(a2.shift());
                for(var j = 0; j < Math.round(ratio); j++){
                    result.push(a1.shift());
                }
            }
            return result;
        },

        fillQueue: function() {
            if(this.isFilling)return;
            var self = this;
            this.isFilling = true;
            var tempQueues = [];

            var buildQueue = _.after(RegionService.supportedRegions.length, function(){
                var queue = [];
                tempQueues.sort(function(a, b) {
                    return a.length - b.length;
                });
                _(tempQueues).each(function(q) {
                    queue = queue.length > 0 ? self.mixArrays(q, queue) : q;
                });

                self.toDo.push.apply(self.toDo, queue);
                self.isFilling = false;
                self.stats.cycleStartedAt = new Date();
            });

            _(RegionService.supportedRegions).each(function(region) {
                Clan.countInRegion(region, function(err, count) {
                    tempQueues[region] = [];
                    var cpr = self.config.clansPerRequest;
                    for(var i = 0; i < count/cpr; i++){
                        tempQueues[region].push({
                            skip: i*cpr,
                            limit: cpr,
                            region: region,
                            retryCount: 0
                        });
                    }

                    buildQueue();
                });
            }, this);
        },

        tooManyErrors: function(i) {
            var task = this.toDo[i];
            var errors = this.regionStats[task.region].errors;
            if(errors.length == 0){
                return false;
            }
            var duration = (new Date()).getTime() - _(errors).first().getTime();
            return errors.length/duration*1000 > 0.25;
        },

        notInRegion: function(i, region) {
            if(region === undefined){
                return false;
            }
            var task = this.toDo[i];
            return region != task.region;
        },

        step: function() {
            var self = this;

            if(this.toDo.length == 0)return;
            ClanAPI.ready(function(err, ready, region){
                if(ready) self.doTask(region);
            });

            if(this.toDo.length < this.config.queueThreshold && !this.isFilling){
                this.fillQueue();
            }

            _.each(RegionService.supportedRegions, function(region) {
                while(this.regionStats[region].errors.length > 0 && (new Date()).getTime() - this.regionStats[region].errors[0].getTime() > 20*1000 ){
                    this.regionStats[region].errors.shift();
                }
            }, this);
        },

        doTask: function(region) {
            var self = this;
            var ID = this.IDcounter++;

            var i = 0;
            while(i < this.toDo.length-1 && (this.tooManyErrors(i) || this.notInRegion(i, region))){i++;}
            if(i >= this.toDo.length-this.config.queueThreshold){
                if(!this.isFilling)this.fillQueue();
            }

            var task = self.toDo.splice(i,1)[0];
            if(!task)return;
            this.pending[ID] = task;
            //if(self.toDo.length % 10 == 0){console.log(self.toDo.length);}

            setTimeout(function(){
                if(self.pending[ID]){
                    sails.log.info('Task timeout:', ID);
                    self.reportFail(ID, task.count);
                }
            },10000);

            Clan.find().where(Clan.inRegionWhere(task.region)).skip(task.skip).limit(task.limit).sort({id: 1}).exec(function(err, clans) {
                if(clans.length == 0){
                    delete self.pending[ID];
                    return;
                }
                task.clans = clans;
                task.count = clans.length;

                ClanAPI.find({where: {id: _(clans).pluck('id')}}, function(err, results){
                    if(err || !results || results.length == 0) {
                        sails.log.warn('Request error', (err || 'Parse error'));
                        self.reportFail(ID, task.count);
                    }
                    else self.confirmSuccess(ID, task.count);
                    self.updateClans(task, results);
                });
            });
        },

        updateClans: function(task, result) {
            _(task.clans).each(function(clan){
                var newClan = _(result).findWhere({id: clan.id});
                if(newClan){
                    _(newClan.attributes).each(function(value, key) {
                        clan[key] = value;
                    });
                    clan.save(function(err) {
                        if(err)sails.log.error(err);
                    });
                }
            });
        },

        confirmSuccess: function(ID, count) {
            delete this.pending[ID];
            this.stats.requestsDone++;
            if(count){
                this.stats.clansDone += count;
            }
            this.calcSpeed(count);
            ApiRoom.publishUpdate( this.roomID, {
                stats: this.stats,
                action: 'done',
                count: count
            });
        },

        calcSpeed: function(count) {
            if(count){
                this.recent.push({
                    count: count,
                    time: new Date()
                });
            }
            while(this.recent.length > 0 && (new Date()).getTime() - this.recent[0].time.getTime() > 5*1000 ){
                this.recent.shift();
            }
            if(this.recent.length > 1){
                var sum = _.chain(this.recent).pluck('count').reduce(function(memo, num){ return memo + num; }, 0).value();
                var duration = _(this.recent).last().time.getTime() - _(this.recent).first().time.getTime();
                this.stats.speed = Math.round(sum/duration*1000*100)/100;
            }
        },

        reportFail: function(ID, count) {
            if(!this.pending[ID]){
                return;
            }
            this.stats.requestsFailed++;
            this.stats.clansFailed += count || this.config.clansPerRequest;
            if(this.pending[ID].limit == 1){
                this.pending[ID].retryCount++;
                if(this.pending[ID].retryCount < 3){
                    this.toDo.unshift(this.pending[ID]);
                }else{
                    sails.log.info('Too many retries:',this.pending[ID]);
                }
            } else {
                this.splitTask(this.pending[ID]);
            }
            var region = this.pending[ID].region;
            delete this.pending[ID];
            this.regionStats[region].errors.push(new Date());
            this.calcSpeed();
            ApiRoom.publishUpdate( this.roomID, {
                stats: this.stats,
                action: 'failed',
                count: count
            });
        },

        splitTask: function(task) {
            var task1 = {skip: task.skip, limit: Math.round(task.limit/2), region: task.region, retryCount: 0};
            var task2 = {skip: task.skip+task1.limit, limit: task.limit-task1.limit, region: task.region, retryCount: 0};
            //sails.log.info('Split',task,'into',task1,task2);
            this.toDo.unshift(task1);
            this.toDo.unshift(task2);
            this.totalCount++;
        }

    };

    _.each(RegionService.supportedRegions, function(region) {
        this.regionStats[region] = {
            pending: 0,
            errors: []
        };
    }, queue);

    queue.fillQueue();
    setInterval(function(){
        queue.step();
    },50);

    ApiRoom.create({id: this.roomID, name: 'clans'}, function(err, room){
        queue.room = room;
    });

    return queue;
});