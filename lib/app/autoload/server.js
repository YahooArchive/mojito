/*
This code does not work and is only a proof of concept.
I do not know the internals of Mojito, this is just
my "pie-in-the-sky" thoughts of what I would like to see.
*/

//Simple Use Case
var mojito = require('mojito');

var app = mojito.createServer();

/*
This middleware can be custom or default
Mojito behavior to augment the `req` object
with context sensative information, example:

var req = {
    auth: 'cookie',
    intl: 'de',
    user: {
        //user object with prefs
    },
    bucket: 'a1'
};

*/
app.use(mojito.core);

/*
Thoughts on differences between local and prod.
Locally, you want assets loaded locally with a smart local combo server.
In Production, you want to use the CDN deployment that `shaker` handles.
*/

app.configure('development', function() {
    app.use(mojito.yui('3.9.0').local); 
    app.use('/combo', mojito.middleware.combo);
});
app.configure('production', function() {
    app.use(mojito.yui('3.9.0').cdn);
    app.use(mojito.middleware.combo.cdn);
});

/*
Simple:
Renders this template from a named datastore
*/
app.get('/', mojito.dispatch('index'));

/*
Advanced:
- `mojito.bucket` - bucket middleware to augment how dispatch works
- `mojito.auth` & `mojito.cookie` random middleware, name not important
- `mojito.rest` Read below
- Render a named template from a datastore and bind it to the server
*/
app.get('/foo', mojito.bucket('a4'), mojito.auth, mojito.cookie, mojito.rest('baz'), mojito.dispatch('foo'));

/*
This is a little magic, the named datastore here is turned into
a rest API, example:
*/

app.get('_mojito/baz', mojito.rest('baz').get);
app.head('_mojito/baz', mojito.rest('baz').head);
app.post('_mojito/baz', mojito.rest('baz').post);
app.put('_mojito/baz', mojito.rest('baz').put);
app.delete('_mojito/baz', mojito.rest('baz').delete);

/*
These could also resolve to something like:
Where :guid is a unique client id (normally a cookie, but middleware
should dictate that).
*/
app.put('_mojito/:guid/baz', mojito.rest('baz').put);

/*
This becomes a binder for the model on the client and on the server.
When the binder on the client issues a Model.save() it automagically
syncs with this datastore. When this datastore on te server is changed
(via timed YQL call?) the results are pushed to the client Model to sync.

The Model on the server can be a Y.Model or another Object with a defined
API so that YUI is technically not required. Same for the client. The Binder
is defined as an API that is mimicable by any Object with getters & setters.
Ideally, this plumbing is free if you use Y.App on the client. But could
potentially be usable by any (Backbone) MVC framework or just Vanilla JS.
*/

/*
Super Advanced:
*/

var mojito = require('mojito'),
    exress = require('express');

var app = express.createServer();

app.use('_my_mojito', mojito.middleware.bigPipe);
app.use(express.*);


app.get('/', express.foo, mojito.middleware.bar, mojito.middleware.baz, function(req, res) {
    var myData = new MyDataStore({ /*...*/ });
    var template = mojito.prepare('my-template', { /*...*/});
    var mojit = new mojito.Mojit(req, res, template, { /*...*/ });
    /* do something special */
    mojit.rest.binder(myData, res, template);
    mojit.render({ /*...*/ }, function(err, html) {
        if (err) {
            throw err;
        }
        html = doSomethingElseWithTheOutput(html);
        mojit.send(html, 200);
    });
});