var Request = require("./Request");
var config = {};
var currentReqs = 0;
var readyAnnounced = true;
var waitingSince = new Date();

process.on('message', function(msg) {
    var action = msg[0];

    switch(action) {
        case 'config':
            config = msg[1];
            break;
        case 'request':
            request(msg[1], msg[2], msg[3]);
            break;

    }
});

function request(params, options, cbID) {
    currentReqs++;
    readyAnnounced = false;
    waitingSince = new Date();
    new Request(options.subject, options.method, options.region, params, config.proxy, function(err, result) {
        currentReqs--;
        process.send(['cb', cbID, err, result]);
    });
}

setInterval(function(){
    if(readyAnnounced)return;
    var waitTime = (new Date()).getTime() - waitingSince.getTime();
    if(currentReqs < config.maxConcurrentReqs && waitTime > config.waitTime){
        readyAnnounced = true;
        process.send(['ready', config.maxConcurrentReqs - currentReqs]);
    }
}, 50);