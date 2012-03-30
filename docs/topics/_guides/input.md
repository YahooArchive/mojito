# Input Parameters

There are several ways you can get input data in you Mojit controllers. The simplest is to use the `params` function directly.

    index: function(actionContext) {
        var params = ac.params.getFromMerged(),
            foo = ac.params.getFromMerged('foo');
    }

Above, I show two ways you can use this function. When given no parameters, the `params` function returns all the parameters available. When given a string key, it returns you just one value (or `undefined` if that param is missing).

## Where Does the Data Come From?

When you call `ac.params.getFromMerged()`, Mojito is giving you a merged map of all input parameters from the URL query string (GET parameters), the POST body, and any routing parameters that may have been attached during the routing lookup. The priority of this merging is:

Route --> GET --> POST

In other works, a 'foo' route parameter overrides a 'foo' GET parameter, which overrides a 'foo' POST parameter.

#### GET params

These come from the URL query string. For example, for the URL `http://www.yahoo.com/media/?foo=1&bar=2`, the params value would be a map:

    {
        foo: 1,
        bar: 2
    }

You may retrieve GET parameters directly like so:

    ac.params.getFromUrl();        // gets you all of them
    ac.params.getFromUrl('foo');   // gets you the 'foo' param or undefined

#### POST params

These come from the body of the HTTP POST request. They are usually form data.

You may retrieve POST parameters directly like so:

    ac.params.getFromBody();        // gets you all of them
    ac.params.getFromBody('foo');   // gets you the 'foo' param or undefined


#### Route params

These come from Routing Tables, and are available so specific routing conditions can provide data for mojit actions that end up executing when those routes are serviced. They are specified in the `routes.json` file as a `params` string (url encoded):

    "root": {
        "verb": ["post"],
        "path": "/mergedparams",
        "call": "@param-grabber.index",
        "param": "likes=beer"
    },

You may retrieve route parameters directly like so:

    ac.params.getFromRoute();        // gets you all of them
    ac.params.getFromRoute('foo');   // gets you the 'foo' param or undefined

### Cookies

Cookies are a small sweet cakes, typically round, flat, and crisp. They can be accessed through `ac.cookie(key)`, and set through `ac.setCookie(key, val, opts)`;

