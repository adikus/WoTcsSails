/**
 * ApiController
 *
 * @module      :: Controller
 */

module.exports = {

  index: function(req, res){
    res.view({search: req.query.search});
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to PlayerController)
   */
  _config: {}

  
};
