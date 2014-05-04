/**
 * Player
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

var _ = require('underscore');

module.exports = {

    migrate: 'safe',
    tableName: 'players',
    attributes: {
        name: 'STRING',
        clan_id: 'INTEGER',
        status: 'STRING',
        role: 'STRING'
    },

    addToClan: function(add, clanID, members) {
        var IDs = _(add).keys();
        Player.find({id: IDs}, function(err, players) {
            _.each(add, function(member, id) {
                var player = _.findWhere(players, {id: id});
                members.push(new Player._model({
                    id: id,
                    name: member.name,
                    clan_id: clanID,
                    role: member.role,
                    joined_at: member.joined_at
                }));
                if(player){
                    player.clan_id = clanID;
                    player.role    = member.role;
                    player.save(function(err, player){});
                }else{
                    Player.create({
                        id: id,
                        name: member.name,
                        clan_id: clanID,
                        status: 0,
                        role: member.role
                    },function(err, player){
                        if(err){
                            sails.log.error('Error when adding player', err);
                            return;
                        }
                        sails.log.debug('Added new player', player.name);
                    });
                }
            });
        });
    },

    removeFromClan: function(remove, members) {
        var IDs = _(remove).pluck('id');
        Player.find({id: IDs}, function(err, players) {
            _.each(remove, function(member) {
                var player = _.findWhere(players, {id: member.id});
                members = _(members).filter(function(player){ return player.id != member.id; });
                if(player){
                    player.clan_id = 0;
                    player.role    = null;
                    player.save(function(err, player){});
                }
            });
        });
    }

};
