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
    app,
    mojito;

app = express();
app.set('port', process.env.PORT || 8666);
libmojito.extend(app);
mojito = app.mojito;

app.use(mojito.middleware());
mojito.attachRoutes();
app.post('/tunnel', mojito.tunnelMiddleware());


// Example usage on how to execute anonymous mojit. 
app.get('/:mojitType/:mojitAction', function (req, res, next) {
    var type = req.params.mojitType,
        action = req.params.mojitAction;

    return mojito.dispatch(type + '.' + action)(req, res, next);
});

app.get('/status', function (req, res) {
    res.send('200 OK');
});

app.listen(app.get('port'), function () {
    debug('Server listening on port ' + app.get('port') + ' ' +
               'in ' + app.get('env') + ' mode');
});
