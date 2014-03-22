var _ = require('underscore');

module.exports = function(req, res, next) {

    if(!res.vars){
        res.vars = {};
    }
    res.vars = _(res.vars).extend(req.target);
    next();

};
