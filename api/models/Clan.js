/**
 * Clan
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

var _ = require('underscore');

module.exports = {

    migrate: 'safe',
    tableName: 'clans',

    attributes: {
        name: 'STRING',
        tag:  'STRING',
        description: 'TEXT',
        motto: 'STRING',
        status: 'STRING',

        getData: function() {
            return {
                id: this.id,
                name: this.name,
                tag: this.tag,
                description: this.description,
                motto: this.motto,
                status: this.status,
                updated_at: this.updatedAt,
                updating: this.updating,
                members: this.members
            };
        },

        populateMembers: function(callback) {
            var self = this;
            Player.find({clan_id: this.id}, function(err, players) {
                self.members = players;
                callback(players);
            });
        },

        updateMembers: function(members) {
            if(_(members).size() == 0){
                //sails.log.debug('Received empty members list for', this.tag, this.id);
                return;
            }

            var playersComparison = {};
            _.each(members, function(member, id){
                id = parseInt(id);
                playersComparison[id] = {};
                playersComparison[id].parsed = member;
            });

            var self = this;
            this.populateMembers(function(){
                _.each(self.members, function(member){
                    var id = parseInt(member.id);
                    if(!playersComparison[id]){
                        playersComparison[id] = {};
                    }
                    playersComparison[id].loaded = member;
                });

                var add = {};
                var remove = [];
                _.each(playersComparison, function(comparison, id) {
                    if(comparison.parsed && comparison.loaded){
                        comparison.loaded.joined_at = comparison.parsed.joinedAt;
                    }
                    if(comparison.parsed && !comparison.loaded){
                        add[id] = {name: comparison.parsed.name, joined_at: comparison.parsed.joinedAt, role: comparison.parsed.role }
                    }else if(!comparison.parsed && comparison.loaded){
                        remove.push(comparison.loaded);
                    }
                });

                Player.addToClan(add, self.id, self.members);
                Player.removeFromClan(remove, self.members);

                ClanCache.findOne(self.id, function(err, cache) {
                    if(cache){
                        cache.members = self.members;
                        cache.save(function(){});
                    }
                });

                PlayerChange.saveChanges(self.id, self.members, self.updatedAt);
            });
        },

        populateLastChanges: function(callback) {
            var self = this;
            QueryService.render('select_changes', {clan_id: this.id, month_where: 'true'}, function(sql) {
                sql += ' LIMIT 5';
                PlayerChange.query(sql, function(err, res) {
                    var changes = _(res.rows).map(function(row) {
                        return new PlayerChange._model(row);
                    });
                    ClanCache.findOne(self.id, function(err, cache) {
                        if(cache){
                            cache.lastChanges = changes;
                            cache.save(function(){});
                        }
                    });
                    self.lastChanges = changes;
                    callback(changes);
                });
            });
        }
    },

    get: function(where, callback) {
        this.findOne(where, function(err, clan) {
            if (err) return callback(err, null);
            if(!clan && !isNaN(parseInt(where))){
                ClanAPI.findOne({where: {id: where}, priority: 1}, function(err, result) {
                    if(result){
                        Clan.create(result.attributes, function(err, clan) {
                            callback(null, clan);
                            sails.log.info('New clan created', clan.id, clan.tag);
                        });
                    }else{
                        callback(null, null);
                    }
                });
            }else{
                return callback(null, clan);
            }
        });
    },

    updateClans: function(olds, news) {
        _(olds).each(function(clan){
            var newClan = _(news).findWhere({id: clan.id});
            if(newClan){
                _(newClan.attributes).each(function(value, key) {
                    clan[key] = value;
                });
                clan.updateMembers(newClan.members);

                clan.save(function(err) {
                    if(err)sails.log.error(err);
                });
            }
        });
    },

    inRegionWhere: function(region) {
        var bounds = RegionService.bounds[region];
        return {and: [{id: {'>': bounds.min}}, {id: {'<': bounds.max}}]};
    },

    inRegionFind: function(region) {
        return this.find().where(this.inRegionWhere(region));
    },

    countInRegion: function(region, where, callback) {
        var query = this.count().where(this.inRegionWhere(region));
        if(where)query.where(where);
        if(!callback)callback = where;
        query.exec(callback);
    },

    new: function(attributes) {
        return new this._model(attributes);
    },

    afterCreate: function(values, next) {
        values.updating = false;
        ClanCache.update(values.id, values, function(err, cache) {
            //if(cache.length > 0)sails.log.info('Cache updated', cache[0].id, cache[0].tag);
        });
        next();
    },

    afterUpdate: function(values, next) {
        values.updating = false;
        ClanCache.update(values.id, values, function(err, cache) {
            //if(cache.length > 0)sails.log.info('Cache updated', cache[0].id, cache[0].tag);
        });

        next();
    }

};
