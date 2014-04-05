/**
 * ApiController
 *
 * @module      :: Controller
 */

module.exports = {

    index: function(req, res){
        res.view({queue: sails.clanQueue.stats});
    },

    subscribe: function(req, res){
        ApiRoom.find({name: req.params.id}, function(err, room) {
            if(room){
                ApiRoom.subscribe(req.socket, room);
                res.json({status: 'ok'});
            }else{
                res.json({status: 'not found'});
            }
        });
    },

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to PlayerController)
     */
    _config: {}

};
