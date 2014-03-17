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

        getData: function() {
            return Clan._instanceMethods.getData.apply(this);
        },

        setRemoveTimer: function(isNew) {
            //TODO: do this somewhere else (middleware)
            var self = this;

            if(!isNew){
                this.save(function(err){
                    this.last_accessed_at = new Date();
                    if(err)sails.log.err(err);
                });
            }

            setTimeout(function(){
                ClanCache.findOne(self.id, function(err, cache){
                    if(cache){
                        var age = (new Date()).getTime() - cache.last_accessed_at.getTime();
                        if(age >= ClanCache.maxAge){
                            cache.destroy(function() {
                                sails.log.info('Remove clan from cache', cache.id, cache.tag);
                            });
                        }
                    }
                });
            },ClanCache.maxAge);
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
                    self.create(data, function(err, cache) {
                        if(err)sails.log.err(err);
                        cache.setRemoveTimer(true);
                    });
                    return callback(null, clan, false);
                });
            }else {
                sails.log.info('Return clan from cache', cache.id, cache.tag);
                cache.setRemoveTimer();
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
