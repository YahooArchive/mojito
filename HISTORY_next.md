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

* `routes.json` configuration only support `call` and `path` properties.

  The recommended way to register route with Mojito is via the `app.VERB()`
  methods from Express.

  For more detail information, please check any of the applications under
  `examples/` folder.

* `ac.url.make()` and `Y.mojito.RouteMaker.make()` no longer throws exception.
  Instead, the api returns `null` in order to provide the application more
  control on how best to handle this error.


Features
--------

* For the application to register a route, a new API has been introduced:
  `mojito.dispatch`.

  `app.get('/foo', mojito.dispatch('admin.help'));` is equivalent to the
  following configuration:

```
[{
    "settings": [ "master" ],
    "/foo": {
        verbs: [ "get" ],
        path: "/foo",
        call: "admin.help"
    }
}]
```

Bug Fixes
---------

* `ac.config.getRoutes()` and `ac.url.find()` both returns the route object in
  the same format.

Acknowledgements
----------------

