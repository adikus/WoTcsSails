/**
 * Player
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    migrate: 'safe',
    tableName: 'players',
    autoCreatedAt: false,
    autoUpdatedAt: false,
    attributes: {
        name: 'STRING',
        clan_id: 'INTEGER',
        status: 'STRING',
        created_at: 'DATETIME',
        updated_at: 'DATETIME'
    }

};
