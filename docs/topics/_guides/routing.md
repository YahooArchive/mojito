# Routing

In Mojito, routing is the mapping of URLs to specific mojit actions. There are currently two ways to accomplish routing.

## Route to Generic Mojit Instance

The simplest way to set up a route is to programmatically provide path strings that map directly to a mojit type and action within the `server.js` file of a Mojito application. For example:

    $ mojito create app simple simpleRoutes
    creating app called 'simpleRoutes'
    (using "simple" archetype)
    validating archetype: app simple
    ✔ app: simpleRoutes created!
    ✔ mojito done.
    
    $ cd simpleRoutes
    $ mojito create mojit simple Foo
    creating mojit called 'Foo'
    (using "simple" archetype)
    validating archetype: mojit simple
    ✔ mojit: Foo created!
    ✔ mojito done.

Edit the `server.js` file and some routes.

    module.exports = function(Y) {

        Y.mojito.server.get('/', {type: "Foo"});
        Y.mojito.server.get('/mojito', {type: "Foo"});
        Y.mojito.server.get('/the/best/mojito/routing/example/evar', {type: "Foo"});

        return Y.mojito.server.create();

    };

Now start the server and hit some URLS

    $ node start.js

*   [http://localhost:8666](http://localhost:8666)
*   [http://localhost:8666/mojito](http://localhost:8666/mojito)
*   [http://localhost:8666/the/best/mojito/routing/example/evar](http://localhost:8666/the/best/mojito/routing/example/evar)

## Default Mojit Routing

Let's disregard the previous example and create a new Mojito application called `tableRoutes`. Now are are going to provide `application.json` and `routes.json` configuration files, which will specify with more detail how our application will be executed.

<div style="margin:1em; padding:0.4em; border:1px solid #F86; color:#844; background-color:#EEF;">
    <h4>NOTE:</h4>
    You cannot use the routing table method of routing without a proper `application.json` file, because routes within the `routes.json` table map directly to pre-specified mojit instances. In the previous example, mojit instances were not predefined, but Mojito created them dynamically with default configurations. Using a routing table is a more realistic way to create real-world Mojito apps.
</div>

This time when we create an application, we will not specify the "simple" archetype, instead we'll let Mojito provide the default application scaffolding for our new application.

    $ mojito create app tableRoutes
    creating app called 'tableRoutes'
    (using "default" archetype)
    validating archetype: app default
    ✔ app: tableRoutes created!
    ✔ mojito done.

You'll notice that the default scaffolding provides you with a valid `application.json` file. Go ahead and create a couple of mojits as well.

    $ cd tableRoutes
    $ mojito create mojit simple Foo
    creating mojit called 'Foo'
    (using "simple" archetype)
    validating archetype: mojit simple
    ✔ mojit: Foo created!
    ✔ mojito done.
    
    $ mojito create mojit simple Bar
    creating mojit called 'Bar'
    (using "simple" archetype)
    validating archetype: mojit simple
    ✔ mojit: Bar created!
    ✔ mojito done.

Now we can edit the `application.json` file and add mojit instances of these types:

    [
        {
            "settings": [ "master" ],
            "specs": {
                "foo-1": {
                    "type": "Foo"
                },
                "bar-1": {
                    "type": "Bar"
                },
                "bar-2": {
                    "type": "Bar"
                }
            }
        }
    ]

Now the file contains mojit instance specifications for three mojits. If you run the server at this point:

    $ node start.js

You should be able to hit these three default routes:

*   [http://localhost:8666/foo-1/index.html](http://localhost:8666/foo-1/index.html)
*   [http://localhost:8666/bar-1/index.html](http://localhost:8666/bar-1/index.html)
*   [http://localhost:8666/bar-2/index.html](http://localhost:8666/bar-2/index.html)

These routes are setup up automatically if there is no `routes.json` file available to the Mojito application. They currently all return the same data to the client, but you can edit the individual controllers like this to print out information about the particular mojit instance being executed by each URL:

    index: function(actionContext) {
        var config = actionContext.get('config'),
            type = config.type,
            id = config.id;
        actionContext.done('Just a simple mojit of type "' + type + '" with id "' + id + '"');
    }

Now when you hit the above URLs, you should get a different output for each.

## Default Mojit Routing

Now we are going to override the default routing provided by Mojito by creating a `routes.json` file, which will contain definitions of different routes mapped to mojit instances and actions. Create a `routes.json` file within your Mojito application folder with a simple route:

    [
        {
            "settings": [ "master" ],
            "root": {
                "verb": ["get"],
                "path": "/",
                "call": "@foo-1.index"
            }
        }
    ]

Now restart the server and try hitting the previous URLs again. You'll notice that none of them work anymore because we've overridden the default routing with our own explicit routing table. But if you hit [http://localhost:8666](http://localhost:8666), you'll be directed to the `foo-1` mojit's `index` action execution.

Now, edit the `Foo` mojit's controller and add another action:

    YUI.add('Foo', function(Y) {

        function Controller() {}

        Controller.prototype = {

            index: function(actionContext) {
                var config = actionContext.get('config'),
                    type = config.type,
                    id = config.id;
                actionContext.done('Just a simple mojit of type "' + type + '" with id "' + id + '"');
            },

            myAction: function(actionContext) {
                actionContext.done('myAction output');
            }

        };

        Y.mojito.registerController('Foo', Controller);

    }, '0.0.1', {requires: ['mojito']});

You can alter the routes defined in the routing table to point to any action defined within your Mojit. For example:

    [
        {
            "settings": [ "master" ],
            "root": {
                "verb": ["get"],
                "path": "/",
                "call": "@foo-1.myAction"
            }
        }
    ]
    
Restart the server, and you'll see that [http://localhost:8666](http://localhost:8666) now executes the `myAction` function on the `foo-1` mojit. The "verb" within the routing entry corresponds to the HTTP method used for the request. If we change "get" to "post", the URL above will stop working except for POST requests. This value is an array, so you may specify as many methods as you with (re: ["get", "post", "put"]).

You may specify multiple routes:

    [
        {
            "settings": [ "master" ],

            "root": {
                "verb": ["get"],
                "path": "/",
                "call": "@foo-1.index"
            },
            "foo_default": {
                "verb": ["get"],
                "path": "/foo",
                "call": "@foo-1.index"
            },
            "bar_default": {
                "verb": ["get"],
                "path": "/bar",
                "call": "@bar-1.index"
            }
        }
    ]

*   [http://localhost:8666](http://localhost:8666)
*   [http://localhost:8666/foo](http://localhost:8666/foo)
*   [http://localhost:8666/bar](http://localhost:8666/bar)

You may specify wildcards:

    [
        {
            "settings": [ "master" ],

            "root": {
                "verb": ["get"],
                "path": "/",
                "call": "@foo-1.index"
            },
            "foo_default": {
                "verb": ["get"],
                "path": "/foo",
                "call": "@foo-1.index"
            },
            "bar_default": {
                "verb": ["get"],
                "path": "/bar",
                "call": "@bar-1.index"
            },
            "bar_wild": {
                "verb": ["get"],
                "path": "/*",
                "call": "@bar-1.index"
            }
        }
    ]

*   [http://localhost:8666](http://localhost:8666)
*   [http://localhost:8666/foo](http://localhost:8666/foo)
*   [http://localhost:8666/bar](http://localhost:8666/bar)
*   [http://localhost:8666/anything_else](http://localhost:8666/anything_else)
*   [http://localhost:8666/blah-blah](http://localhost:8666/blah-blah)

You may also specify certain tokens for mojit id and action:

    [
        {
            "settings": [ "master" ],

            "_foo_action": {
                "verb": ["get", "post", "put"],
                "path": "/foo/:mojit-action",
                "call": "@foo-1._any_"
            },

            "_bar_action": {
                "verb": ["get", "post", "put"],
                "path": "/bar/:mojit-action",
                "call": "@bar-1._any_"
            }

        }
    ]

*   [http://localhost:8666/foo/index](http://localhost:8666/foo/index)
*   [http://localhost:8666/foo/myAction](http://localhost:8666/foo/myAction)
*   [http://localhost:8666/bar/index](http://localhost:8666/bar/index)

#### URL Generation

You can also do a reverse url generation. You can specify a mojit ID, mojit Action and query params and get the URL specific to this combination. For eg if you have a routes.json file as below

    "foo_default": {
         "verb": ["get"],
         "path": "/foo",
         "call": "@foo-1.index"
     }

You can generate the URL: /foo in the controller.js file by using the URL generator action Context by simply saying `ac.url.make('@foo-1','index')`. You can get detils for this [here](/action-context/). Routes will be returned in the order they are defined in `routes.json`.
