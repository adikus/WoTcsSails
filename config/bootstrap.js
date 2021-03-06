/**
 * Bootstrap
 *
 * An asynchronous boostrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#documentation
 */

var _ = require('underscore');

module.exports.bootstrap = function (cb) {
    require('express-helpers')(sails.express.app);

    sails.express.app.locals({
        Pagination: require('../api/wotcs/Pagination'),
        _u: _
    });

    sails.clanQueue = new (require('../api/wotcs/ClanQueue.js'))();

    sails.config.environment == 'production' ? setTimeout(cb, 5000) : cb();
};