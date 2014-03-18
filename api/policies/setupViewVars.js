var _ = require('underscore');

module.exports = function(req, res, next) {

    res.vars = _(res.vars).extend(req.target);
    next();

};
