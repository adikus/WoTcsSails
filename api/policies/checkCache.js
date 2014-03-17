/**
 * checkCache
 *
 * @module      :: Policy
 * @description :: Checks and removes expired cache
 *
 */
module.exports = function(req, res, next) {

    var expired = new Date();
    expired.setTime(expired.getTime() - ClanCache.maxAge);

    ClanCache.destroy({last_accessed_at: {'<': expired}}, function(err) {
        if(err)res.send(err, 500);
        else next();
    });

};
