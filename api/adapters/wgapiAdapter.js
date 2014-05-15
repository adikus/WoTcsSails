var _ = require("underscore");
var cluster = require("cluster");
var Regions = require("./../services/RegionService");
var PriorityQueue = require('priorityqueuejs');

module.exports = (function () {

    var queue = new PriorityQueue(function(a, b) {
        var now = new Date();
        var priorityA = a.priority*1000 + (now.getTime() - a.createdAt.getTime());
        var priorityB = b.priority*1000 + (now.getTime() - b.createdAt.getTime());
        return priorityA - priorityB;
    });

    var config = {
        maxConcurrentReqs: 4,
        waitTime: 750,
        workers: 3,
        proxyWorkers: 2
    };
    var workers = [];
    var ready = [];
    var registerCallback = null;
    var IDcounter = 0;
    var lastError = '';

    var adapter = {

        identity: 'sails-wgapi',

        syncable: false,

        defaults: {
            schema: false,
            migrate: 'safe'
        },

        registerCollection: function(collection, cb) {
            queue[collection.identity] = [];
            if(workers.length == 0 && !registerCallback){
                registerCallback = cb;
                for(var i = 0; i < config.workers; i++){
                    addWorker(i);
                }
                for(i = config.workers; i < config.workers+config.proxyWorkers; i++){
                    addWorker(i, true);
                }
            }else cb();
        },

        teardown: function(cb) {
            cb();
        },

        ready: function(collectionName, options, cb) {
            if(!cb) cb = options;
            cb(null, queue.size() < config.workers*config.maxConcurrentReqs);
        },

        find: function(collectionName, options, cb) {
            if(collectionName == 'clan'){
                if(options.where && options.where.id){
                    if(!options.where.id.length)options.where.id = [options.where.id];
                    this.finders.clan.info(options.where.id, options.priority || 0, cb);
                }else if(options.where && options.where.search){
                    this.finders.clan.list(options.where.search, options.region, options.priority || 1, cb);
                }else if(options.where.search != undefined) cb('Please specify search.', null);
                else cb('Incorrect find attributes.' ,null);
            }
        },

        finders: {
            clan: {
                list: function(search, region, priority, cb) {
                    queue.enq({
                        params: {
                            search: search,
                            order_by: 'abbreviation',
                            limit: 30
                        },
                        options: {
                            region: region,
                            method: 'list',
                            subject: 'clan'
                        },
                        priority: priority,
                        createdAt: new Date(),
                        cb: cb
                    });
                },
                info: function(IDs, priority, cb) {
                    queue.enq({
                        params: {
                            fields: 'description_html,abbreviation,motto,name,members.account_name,members.created_at,members.role',
                            clan_id: IDs.join(',')
                        },
                        options: {
                            region: Regions.getRegion(IDs[0]),
                            method: 'info',
                            subject: 'clan'
                        },
                        priority: priority,
                        createdAt: new Date(),
                        cb: cb
                    });
                }
            }
        }

    };

    var processResults = {
        clan: {
            list: function(results) {
                try{
                    results = JSON.parse(results);
                }catch(e){
                    lastError = e;
                    return [];
                }
                return results.data;
            },
            info: function(results) {
                try{
                    results = JSON.parse(results);
                }catch(e){
                    lastError = e;
                    return [];
                }
                if(results.status != 'ok'){
                    lastError = 'returned status: '+results.status;
                    if(results.error)lastError += ' error: '+JSON.stringify(results.error);
                    return [];
                }
                var ret = {};
                _(results.data).each(function(clan, id) {
                    if(!clan){
                        ret[id] = {
                            attributes: { status: -1 }, members: {}
                        };
                        return;
                    }
                    var members = {};
                    _(clan.members).map(function(member, id) {
                        members[id] = {
                            name: member.account_name,
                            joinedAt: member.created_at,
                            role: member.role
                        };
                    });
                    ret[id] = {
                        attributes: {
                            name: clan.name,
                            tag: clan.abbreviation,
                            description: clan.description_html,
                            motto: clan.motto,
                            status: 1
                        },
                        members: members
                    };
                });
                return _(ret).map(function(clan, id) {
                    clan.attributes.id = id;
                    clan.id = id;
                    return clan;
                });
            }
        }
    };

    var callbacks = {};
    function registerWorkerCallback(ID, cb){
        callbacks[ID] = cb;
    }

    function addWorker(i, proxy){
        var worker = cluster.fork();
        ready[i] = 0;
        worker.on('online', function() {
            worker.send(['config',_(config).extend({proxy: proxy})]);
            ready[i] = config.maxConcurrentReqs;
            if(_(ready).without(0).length == config.workers){
                console.log('Workers ready');
                registerCallback();
            }
        });
        worker.on('message', function(msg){
            var action = msg[0];
            switch(action) {
                case 'cb':
                    callbacks[msg[1]](msg[2], msg[3]);
                    delete callbacks[msg[1]];
                    break;
                case 'ready':
                    ready[i] = msg[1];
                    break;
            }

        });
        workers.push(worker);
    }

    setInterval(function(){
        var max = _(ready).max();
        if(!queue.isEmpty() && max > 0){
            var i = ready.indexOf(max);
            var worker = workers[i];
            ready[i]--;
            var task = queue.deq();
            worker.send(['request', task.params, task.options, IDcounter]);
            registerWorkerCallback(IDcounter++, function(err, result) {
                if(err){
                    task.cb(err, null);
                }else{
                    lastError = null;
                    var processed = processResults[task.options.subject][task.options.method](result);
                    task.cb(lastError || err, processed);
                }
            });
        }
    }, 50);

    return adapter;

})();