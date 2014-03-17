var _ = require("underscore");
var cluster = require("cluster");
var Request = require("./../wotcs/Request");
var Regions = require("./../services/RegionService");

module.exports = (function () {

    var queue = {};
    var apis = {
        clan: {
            fields: 'description_html,abbreviation,motto,name,members.account_name,members.created_at,members.role',
                idName: 'clan_id'
        }
    };
    var config = {
        maxConcurrentReqs: 4,
        waitTime: 750,
        workers: 3
    };
    var workers = [];
    var ready = [];
    var registerCallback = null;
    var IDcounter = 0;

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
            }else cb();
        },

        teardown: function(cb) {
            cb();
        },

        ready: function(collectionName, options, cb) {
            if(!cb) cb = options;
            cb(null, queue[collectionName].length < config.workers*config.maxConcurrentReqs);
        },

        find: function(collectionName, options, cb) {
            if(collectionName == 'clan'){
                var params = {fields: apis[collectionName].fields};
                params[apis[collectionName].idName] = options.where.id;
                queue[collectionName].unshift({params: params, options: {
                    subject: collectionName,
                    method: 'info',
                    region: Regions.getRegion(options.where.id)}, cb: function(err, result) {
                    cb(err, result[options.where.id] ? [result[options.where.id]] : []);
                }});
            }
        },

        request: function(collectionName, options, cb) {
            var params = {fields: apis[collectionName].fields};
            params[apis[collectionName].idName] = options.IDs;
            options.subject = collectionName;
            queue[collectionName].push({params: params, options: options, cb: cb});
        }

    };

    var processResults = {
        clan: {
            info: function(results) {
                if(!results)return {};
                try{
                    results = JSON.parse(results);
                }catch(e){
                    console.log(e);
                    return {};
                }
                if(results.status != 'ok')return {};
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
                return ret;
            }
        }
    };

    var callbacks = {};
    function registerWorkerCallback(ID, cb){
        callbacks[ID] = cb;
    }

    function addWorker(i){
        var worker = cluster.fork();
        ready[i] = 0;
        worker.on('online', function() {
            worker.send(['config',config]);
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
        _(queue).each(function(q, collectionName){
            var max = _(ready).max();
            if(q.length > 0 && max > 0){
                var i = ready.indexOf(max);
                var worker = workers[i];
                ready[i]--;
                var task = q.shift();
                worker.send(['request', task.params, task.options, IDcounter]);
                registerWorkerCallback(IDcounter++, function(err, result) {
                    task.cb(err, processResults[collectionName][task.options.method](result));
                });
            }
        });
    }, 50);

    return adapter;

})();