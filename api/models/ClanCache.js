/**
 * Clan
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    adapter: 'memory',
    maxAge: 60000,

    autoCreatedAt: false,
    autoUpdatedAt: false,
    scheme: false,
    attributes: {

        populateMembers: function(callback){callback(this.members);},

        populateLastChanges: function(callback) {
            if(!this.lastChanges){
                var clan = new Clan._model({id: this.id});
                clan.populateLastChanges(function(lastChanges){
                    callback(lastChanges);
                });
            }
            else callback(this.lastChanges)
        },

        getData: function() {
            return Clan._instanceMethods.getData.apply(this);
        }
    },

    get: function(where, callback) {
        var self = this;

        this.findOne(where, function(err, cache){
            if (err) return callback(err, null);
            if(!cache){
                return Clan.get(where, function(err, clan){
                    if (err) return callback(err, null);
                    if(!clan) return callback(null, null);
                    sails.log.info('Save clan to cache', clan.id, clan.tag);
                    var data = clan.getData();
                    data.last_accessed_at = new Date();
                    clan.populateMembers(function(members){
                        data.members = members;
                        self.create(data, function(err) {
                            if(err)sails.log.err(err);
                        });
                        return callback(null, clan, false);
                    });
                });
            }else {
                sails.log.verbose('Return clan from cache', cache.id, cache.tag);
                cache.last_accessed_at = new Date();
                cache.save(function(){});
                return callback(null, cache, true);
            }
        })
    },

    getByTag: function(region, tag, callback) {
        if(!isFinite(RegionService[region.toUpperCase()]))return callback('Bad region.', null);
        var where = Clan.inRegionWhere(RegionService[region.toUpperCase()]);
        where.tag = tag;
        return this.get(where, callback);
    }

};
