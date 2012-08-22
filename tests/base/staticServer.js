var staticServer = require('node-static').Server;

//
// Create a node-static server instance to serve the current folder
//
var file = new staticServer('.');

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        file.serve(request, response);
    });
}).listen(process.argv[2]);