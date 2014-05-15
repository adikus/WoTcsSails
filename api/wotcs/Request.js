var _ = require("underscore");
var http = require("http");
var querystring = require("querystring");

module.exports = (function(subject, method, region, params, proxy, callback) {

    var request = {
        data: null,

        start: function(options, callback) {
            var self = this;

            this.callback = callback;
            this.request = http.request(options, function(res) {
                self.error = res.statusCode != 200;

                res.on('data', function (chunk) { self.parseChunk(chunk); });

                res.on('end', function (chunk) {
                    self.parseChunk(chunk);
                    callback(self.error ? res.statusCode : null, self.data);
                });
            });

            this.request.on('error', function(e) {
                callback(e, null);
            });

            this.request.end();
        },

        parseChunk: function(chunk) {
            if(!this.error && chunk)this.data = this.data ? this.data + chunk.toString('utf8') : chunk.toString('utf8');
        }
    };

    var apiID = '?';
    var host = '?';
    switch(region){
        case 0:
            apiID = '171745d21f7f98fd8878771da1000a31';
            host = 'api.worldoftanks.ru';
            break;
        case 1:
            apiID = 'd0a293dc77667c9328783d489c8cef73';
            host = 'api.worldoftanks.eu';
            break;
        case 2:
            apiID = '16924c431c705523aae25b6f638c54dd';
            host = 'api.worldoftanks.com';
            break;
        case 3:
            apiID = '39b4939f5f2460b3285bfa708e4b252c';
            host = 'api.worldoftanks.asia';
            break;
        case 5:
            apiID = 'ffea0f1c3c5f770db09357d94fe6abfb';
            host = 'api.worldoftanks.kr';
            break;
    }

    var queryString = '?application_id='+apiID;
    _(params).each(function(value, key) {
        queryString += '&'+key+"="+value;
    });
    var path = '/2.0/'+subject+'/'+method+'/'+queryString;

    var port = 80;
    if(proxy){
        path = '/?'+querystring.stringify({url: 'http://'+host+path});
        host = 'proxy-1.wotcs.com';
        port = 3000;
    }

    var options = {
        host: host,
        port: port,
        path: path,
        method: 'GET'
    };

    request.start(options, callback);

    return request;

});