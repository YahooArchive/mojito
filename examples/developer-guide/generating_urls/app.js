/*
* Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/


/*jslint node:true*/

'use strict';

var debug = require('debug')('app'),
    express = require('express'),
    libmojito = require('../../../'),
    app;

app = express();
app.set('port', process.env.PORT || 8666);
libmojito.extend(app);

app.use(libmojito.middleware());

// This line allows you to use the routing
// configuration in `routes.json`, which is deprecated.
// In this example, you are using the Url addon to create an URL,
// which depends on the routing configuration, so this line must
// be uncommented.
app.mojito.attachRoutes();

app.get('/status', function (req, res) {
    res.send('200 OK');
});

app.get('/', libmojito.dispatch('mymojit.index'));
app.get('/some-really-long-url-that-we-dont-need-to-remember-contactus', libmojito.dispatch('mymojit.contactus'));

app.listen(app.get('port'), function () {
    debug('Server listening on port ' + app.get('port') + ' ' +
               'in ' + app.get('env') + ' mode');
});
module.exports = app;

