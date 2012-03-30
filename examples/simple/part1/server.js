/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var mojito = require('mojito'),
    path = require('path'),
    fs = require('fs'),
    logPath = path.join(__dirname, "mojitolog.csv");

function writeLog(msg) {
    fs.writeFile(logPath, msg, 'utf-8');
}

// you can access log formatter, writer, or publisher for the server here
mojito.setLogFormatter(function(msg, lvl, src, ts, opts, reqId) {
	var id = reqId || '-',
        logline = [id,ts,src,lvl,msg].join(',');
    //writeLog(logline + '\n');
	return logline;
});

module.exports = mojito.createServer();
