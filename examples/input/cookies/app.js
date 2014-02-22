/*
* Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

'use strict';

var debug = require('debug')('app'),
    express = require('express'),
    libmojito = require('../../../'),
    app;

app = express();
app.set('port', process.env.PORT || 8666);
libmojito.extend(app);

app.use(libmojito.middleware());
app.libmojito.attachRoutes();
app.post('/tunnel', libmojito.tunnelMiddleware());

app.get('/status', function (req, res) {
    res.send('200 OK');
});
app.get('/', mojito.dispatch('server.pitch'));

// Example usage on how to execute anonymous mojit.
app.get('/:mojitType/:mojitAction', function (req, res, next) {
    var type = req.params.mojitType,
        action = req.params.mojitAction;

    mojito.dispatch(type + '.' + action)(req,res,next);
});


app.listen(app.get('port'), function () {
    debug('Server listening on port ' + app.get('port') + ' ' +
               'in ' + app.get('env') + ' mode');
});
module.exports = app;

