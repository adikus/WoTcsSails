var _ = require('underscore');

module.exports.express = {
    customMiddleware: function (app) {

        app.use(function(req, res, next) {
            if(req.url.indexOf('styles') > -1 || req.url.indexOf('js') > -1
                || req.url.indexOf('images') > -1 || req.url.indexOf('fonts') > -1)return next();

            res.vars = {};
            var region = (req.query.region || req.cookies.region) || 1;
            region = parseInt(region, 10);
            if(RegionService.supportedRegions.indexOf(region) < 0)region = 1;
            if(req.cookies.region != region)res.cookie('region', region);
            res.vars.region = region;

            res.exRender = res.render;
            res.render = (function(view, options, next) {
                options = _(options).extend(res.vars);
                res.exRender(view, {locals: options}, next);
            });

            next();

        });
    }
};