/**
 * Clan
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

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
                updating: this.updating
            };
        }
    },

    get: function(where, callback) {
        var self = this;

        this.findOne(where, function(err, clan) {
            if (err) return callback(err, null);
            if(!clan && !isNaN(parseInt(where))){
                ClanAPI.findOne(where, function(err, result) {
                    if(result){
                        result.attributes.id = where;
                        Clan.create(result.attributes, function(err, clan) {
                            sails.log.info('New clan created', clan.id, clan.tag);
                        });
                    }
                });
                callback(null, Clan.new({id: where, status: 0, updating: true}));
            }else{
                return callback(null, clan);
            }
        });
    },

    inRegionWhere: function(region) {
        var bounds = RegionService.bounds[region];
        //return {or: [{and: {id: {'>': bounds.min}}}], id: {'<': bounds.max}};
        return {and: [{id: {'>': bounds.min}}, {id: {'<': bounds.max}}]};
    },

    countInRegion: function(region, callback) {
        this.count().where(this.inRegionWhere(region)).exec(callback);
    },

    new: function(attributes) {
        attributes.getData = (function(){
            return Clan._instanceMethods.getData.apply(attributes);
        });
        return attributes;
    },

    afterCreate: function(values, next) {
        values.updating = false;
        ClanCache.update(values.id, values, function(err, cache) {
            if(cache.length > 0)sails.log.info('Cache updated', cache[0].id, cache[0].tag);
        });
        next();
    },

    afterUpdate: function(values, next) {
        values.updating = false;
        ClanCache.update(values.id, values, function(err, cache) {
            if(cache.length > 0)sails.log.info('Cache updated', cache[0].id, cache[0].tag);
        });
        next();
    }

};
