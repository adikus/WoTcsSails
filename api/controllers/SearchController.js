/**
 * ApiController
 *
 * @module      :: Controller
 */

module.exports = {

    index: function(req, res){
        ClanAPI.find({where: {search: req.query.search}, region: res.vars.region, priority: 2}, function(err, results) {
            res.view({search: req.query.search, clans: results});
        });
    },

    /**
    * Overrides for the settings in `config/controllers.js`
    * (specific to PlayerController)
    */
    _config: {}

  
};
