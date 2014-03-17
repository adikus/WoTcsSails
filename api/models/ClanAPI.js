/**
 * Clan
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    adapter: 'wgapi',
    tableName: 'clan',

    autoCreatedAt: false,
    autoUpdatedAt: false,
    attributes: {
        name: 'STRING',
        tag:  'STRING',
        description: 'TEXT',
        motto: 'STRING',
        status: 'STRING',

        getData: function() {
            return Clan._instanceMethods.getData.apply(this);
        }
    }

};
