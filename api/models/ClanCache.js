/**
 * Clan
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    adapter: 'memory',
    maxAge: 5000,

    autoCreatedAt: false,
    autoUpdatedAt: false,
    scheme: false,
    attributes: {

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
                    self.create(data, function(err) {
                        if(err)sails.log.err(err);
                    });
                    return callback(null, clan, false);
                });
            }else {
                sails.log.info('Return clan from cache', cache.id, cache.tag);
                cache.last_accessed_at = new Date();
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
