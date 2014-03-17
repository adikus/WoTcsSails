/**
 * ClanController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
    
    find: function(req, res) {
        var id = parseInt(req.params.id);
        if(isNaN(id)){
            return ClanCache.getByTag(req.params.id, function(err, clan, fromCache) {
                if (err) return res.send(err, 500);
                if(!clan) return res.send("Clan not found.", 404);
                return res.json({status: 'ok', clan: clan.getData(), fromCache: fromCache});
            });
        }
        if(id <= 0){
            return res.send("Bad clan id.", 500);
        }
        return ClanCache.get(id, function(err, clan, fromCache) {
            if (err) return res.send(err, 500);
            if(!clan) return res.send("Clan not found.", 404);
            return res.json({status: 'ok', clan: clan.getData(), fromCache: fromCache});
        });
    },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to ClanController)
   */
  _config: {}

  
};
