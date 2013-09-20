version @VERSION@
=================

Notes
-----

```
NOTE:
For now, keeping the HISTORY for #next in this file. Once #next is merged back
into #develop, its content can be moved to HISTORY.md in order to avoid
unnecessary conflict on every merge.

This is a document in progress as more work is being done on #next.
```

This release introduces a set of new APIs and concepts. 

Please refer to some of the examples apps under the `examples/` folder to get
an overview of what have changed.

Deprecations, Removals
----------------------

* Mojito no longer supports `index.js` and `server.js` to start up the server.
  Applications will instead instantiate Mojito as follows:

      var mojito = require('mojito'),
          express = require('express'),
          app;

      app = express();
      // "app.mojito" refers to the Mojito instance as part of the Express app
      // "mojito" refers to the Mojito module that exposes helpers - see below

* Middleware configuration is no longer supported via `application.json`.
  Applications can register their middleware using the Express API. To enable
  Mojito middleware, use the following:

      app.use(mojito.middleware());

* `routes.json` configuration is no longer loaded by default. To tell Mojito to
  do so, use the following:

      app.mojito.attachRoutes();

  Applications can also pass in an array of route configuration names if
  needed.

* `routes.json` configuration only support `call` and `path` properties.

* `ac.url.make()` and `Y.mojito.RouteMaker.make()` no longer throws exception.
  Instead, the api returns `null` in order to provide the application more
  control on how best to handle this error.

* The `ac.url.find()` and `Y.mojito.RouteMaker.find()` methods are now
  deprecated and have been removed. If applications needs to query the route
  object, either use the `name` or `path` by leveraging `express-map`.

Features
--------

* To register Mojito routes programmatically instead of using `routes.json`:

```
app.get('/foo', mojito.dispatch('foo.index'));
app.map('/foo', 'foo');
app.map('/foo', 'get#foo.index');
```

  In addition to setting up the path `/foo` to be routed to the Mojito
  dispatcher, setup 2 additional "aliases". The second alias is the HTTP method
  concatenated with the `call` value using the `#` delimeter.

  This is equivalent to doing this in `routes.json`:

```
[{
    "settings": [ "master" ],
    "foo": {
        verbs: [ "get" ],
        path: "/foo",
        call: "foo.index",
        params: { /* optional prams */ }
    }
}]
```

  For more detail information, please check any of the applications under
  `examples/` folder.

New Dependencies
----------------

* Mojito now leverages the following packages for its routing implementation: 
  `express-map` and `express-annotations`

Bug Fixes
---------

* `ac.config.getRoutes()` now returns the route configuration object using the
  format from `express-map#getRouteMap()`.

Acknowledgements
----------------

