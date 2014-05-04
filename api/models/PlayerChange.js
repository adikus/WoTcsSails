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
    tableName: 'changes',

    autoUpdatedAt: false,
    autoCreatedAt: false,
    attributes: {
        clan_id: 'INTEGER',
        player_id:  'INTEGER',
        joined: 'BOOLEAN',
        changed_at: 'DATETIME',
        changed_at_max: 'DATETIME',

        compare: function(id, clan_id, comparison, change) {
            var self = this;
            var joined_at = new Date(comparison.inClan.joined_at*1000);
            var changed_at = new Date(comparison.change.changed_at);
            var diff = joined_at.getTime() - changed_at.getTime();
            if(comparison.change.joined){
                if(comparison.change.clan_id != clan_id){
                    if(diff > 0){
                        change.joinAt(joined_at);
                    }else{
                        self.destroy(function(){});
                    }
                }
            }else{
                if(comparison.change.clan_id == clan_id){
                    if(diff > 0){
                        change.joinAt(joined_at);
                    }else{
                        self.destroy(function(){});
                    }
                }else{
                    if(diff < 0){
                        self.destroy(function(){});
                    }else{
                        change.joinAt(joined_at);
                    }
                }
            }
        },

        addToLastChangesCache: function() {
            var self = this;

            ClanCache.findOne(this.clan_id, function(err, cache) {
                if(cache){
                    if(!self.player_name){
                        Player.findOne(self.player_id, function(err, player) {
                            self.player_name = player ? player.name : self.player_id;
                            cache.lastChanges.unshift(self);
                            if(cache.lastChanges.length > 5)cache.lastChanges.pop();
                            cache.save(function(){});
                        });
                    }else{
                        cache.lastChanges.unshift(self);
                        if(cache.lastChanges.length > 5)cache.lastChanges.pop();
                        cache.save(function(){});
                    }
                }
            });
        },

        joinAt: function(time) {
            this.joined = true;
            this.changed_at = time;
            this.changed_at_max = time;
            PlayerChange.create(this, function(err){
                if(err){
                    sails.log.error(err);
                }
            });
            this.addToLastChangesCache();
        },

        leaveAt: function(time, max) {
            this.joined = false;
            this.changed_at = time;
            this.changed_at_max = max ? max : null;
            PlayerChange.create(this, function(err){
                if(err){
                    sails.log.error(err);
                }
            });
            this.addToLastChangesCache();
        }
    },

    saveChanges: function(clanID, members, updated_at_before) {
        QueryService.render('last_player_changes', {clan_id: clanID}, function(sql) {
            PlayerChange.query(sql, function(err, res) {
                var changes = _(res.rows).map(function(row) {
                    return new PlayerChange._model(row);
                });
                var comparisons = {};
                _(members).each(function(member) {
                    comparisons[parseInt(member.id, 10)] = {inClan: member};
                });
                _(changes).each(function(change) {
                    var id = parseInt(change.player_id,10);
                    if(!comparisons[id]){ comparisons[id] = {}; }
                    comparisons[id].change = change;
                });

                _(comparisons).each(function(comparison, id) {
                    var change = new PlayerChange._model({
                        player_id: id,
                        clan_id: clanID
                    });
                    if(comparison.inClan){
                        change.player_name = comparison.inClan.name;
                        if(comparison.change){
                            comparison.change.compare(id, clanID, comparison, change);
                        }else{
                            change.joinAt(new Date(comparison.inClan.joined_at*1000));
                        }
                    }else{
                        if(comparison.change.joined){
                            if(comparison.change.clan_id == clanID){
                                change.leaveAt(new Date(), new Date(updated_at_before));
                            }
                        }
                    }
                });
            });
        });
    }

};
