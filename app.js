// Start sails and pass it command line arguments
var cluster = require('cluster');

cluster.isMaster ? require('sails').lift(require('optimist').argv) : require('./api/wotcs/Worker.js');