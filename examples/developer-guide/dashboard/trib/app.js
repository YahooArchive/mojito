/*
* Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/


/*jslint node:true*/

'use strict';

var debug = require('debug')('app'),
    express = require('express'),
    mojito = require('../../../../'),
    app;

app = express();

app.use(mojito.middleware());

app.get('/', function (req, res, next) {
    req.params.view_type = "yui";
    next();
}, mojito.dispatch('tribframe.index'));

app.get('/mojito', function (req, res, next) {
    req.params.view_type = "mojito";
    next();
}, mojito.dispatch('tribframe.index'));

app.get('/header', mojito.dispatch('header.index'));
app.get('/body', mojito.dispatch('body.index'));
app.get('/footer', mojito.dispatch('footer.index'));

app.listen(app.get('port'), function () {
    debug('Server listening on port ' + app.get('port') + ' ' +
               'in ' + app.get('env') + ' mode');
});
