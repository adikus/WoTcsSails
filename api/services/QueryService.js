var fs = require('fs');

module.exports = {

    render: function(file, vars, callback) {
        fs.readFile('api/queries/'+file+'.sql', function(err, data) {
            var sql = _(data.toString()).template(vars);
            callback(sql);
        });
    }

};