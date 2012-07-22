

=============================
Getting Input and Cookie Data
=============================

Introduction
############

Mojito provides addons for accessing data from query string and routing parameters, cookies, and the POST request body.

This section will provide an overview of the following addons that allow you to access data:

- `Params addon <../../api/classes/Params.common.html>`_
- `Cookies addon <../../api/classes/Cookie.server.html>`_

To see examples using these addons to get data, see `Using Query Parameters <../code_exs/query_params.html>`_ and `Using Cookies <../code_exs/cookies.html>`_.

Getting Data from Parameters
############################

The methods in the Params addon are called from the ``params`` namespace. As a result, the call will have the following syntax where ``ac`` is the 
ActionContext object: ``ac.params.*``

GET
===

The GET parameters are the URL query string parameters. The Params addon creates JSON using the URL query string parameters. The method ``getFromUrl`` 
allows you to specify a GET parameter or get all of the GET parameters. You can also use the alias ``url`` to get URL query string parameters.

For example, for the URL ``http://www.yahoo.com?foo=1&bar=2``, the Params addon would create the following object:

.. code-block:: javascript

   {
     foo: 1,
     bar: 2
   }

Single Parameter
----------------

To get the value for a specific parameter, you pass the key to the ``getFromUrl`` method, which returns the associated value.

In the example controller below, the value for the ``name`` query string parameter is retrieved:

.. code-block:: javascript

   YUI.add('ParamsMojit', function(Y) {
     Y.mojito.controller = {
       init: function(config) {
         this.config = config;
       },
       getNameParam: function(actionContext) {
         var nameParam = actionContext.params.getFromUrl('name');
         actionContext.done(
           {
             name: nameParam
           },
       }
     }
   }, '0.0.1', {requires: []});

All Parameters
--------------

To get all of the query string parameters, you call ``getFromUrl`` or its alias ``url`` without passing a key as a parameter.

In this example controller, all of the query string parameter are stored in the ``qs_params`` array, which ``ac.done`` makes available in 
the view template.

.. code-block:: javascript

   YUI.add('ParamsMojit', function(Y) {
     Y.mojito.controller = {
       init: function(config) {
         this.config = config;
       },
       ...
       getAllParams: function(actionContext) {
         var qs_params = [];
         var allParams = actionContext.params.getFromUrl();
         Y.Object.each(allParams, function(param, key) {
           qs_params.push({key: key, value: param});
         });
         actionContext.done(
           {
             query_string: qs_params
           },
       }
     }
   }, '0.0.1', {requires: []});

POST
====

The POST parameters come from the HTTP POST request body and often consist of form data. As with query string parameters, the Params addon has the 
method ``getFromBody`` that allows you to specify a single parameter or get all of the POST body parameters.

Single
------

To get a parameter from the POST body, call ``getFromBody`` with the key as the parameter. You can also use the alias ``body`` to get a parameter
from the POST body.

In the example controller below, the POST body parameter ``name`` is retrieved and then uses the ``done`` method to make it accessible to the view template.

.. code-block:: javascript

   YUI.add('ParamsMojit', function(Y) {
     Y.mojito.controller = {
       init: function(config) {
         this.config = config;
       },
       getPostName: function(actionContext) {
         var postName = actionContext.params.getFromBody('name');
         actionContext.done(
           {
             posted_name: postName
           });
       }
     }
   }, '0.0.1', {requires: []});

All
---

To get all of the parameters from the POST body, call ``getFromBody`` or ``body`` without any parameters.

In the example controller below, ``getFromBody`` gets all of the POST body parameters, which are then stored in an array and made accessible to the view 
template.

.. code-block:: javascript

   YUI.add('ParamsMojit', function(Y) {
     Y.mojito.controller = {
       init: function(config) {
         this.config = config;
       },
       ...
       getAllParams: function(actionContext) {
         var post_params = [];
         var allPostParams = actionContext.params.getFromBody();
         Y.Object.each(allPostParams, function(param, key) {
           post_params.push({key: key, value: param});
         });
         actionContext.done(
           {
             posted_params: post_params
           }
         )
       }
     }
   }, '0.0.1', {requires: []});

Routing
=======

Routing parameters are mapped to routing paths, actions, and HTTP methods. You can use the routing parameters to provide data to mojit actions when 
specific routing conditions have been met.

Setting Routing Parameters
--------------------------

The routing parameters are set in the routing configuration file ``routes.json``. For each defined route, you can use the ``params`` property to set 
routing parameters. Because ``routes.json`` allows you to specify mojit actions for different paths and HTTP methods, you can set routing parameters 
based on the routing configuration.

For instance, in the ``routes.json`` below, the routing parameter ``coupon`` is ``true`` when a POST call is made on the ``/coupon/form``, but when a 
GET call is made on the same path, ``coupon`` is ``false``. The ``coupon`` parameter could be used by the mojit controller to do something such as give 
a coupon to a user posting information.

.. code-block:: javascript

   [
     {
       "settings": ["master"],
       "post": {
         "verbs": ["post"],
         "path": "/coupon/form",
         "call": "coupon.index",
         "param": "coupon=true"
       },
       "get": {
         "verbs": ["get"],
         "path": "/coupon/form",
         "call": "coupon.index",
         "param": "coupon=false"
       }
     }
   ]

Getting Routing Parameters
--------------------------

The Params addon has the method ``getFromRoutes`` that allows you to specify a single parameter or get all of the 
routing parameters. You can also use the alias ``route`` to get routing parameters.

Single
~~~~~~
To get a routing parameter, call ``getFromRoute`` with the key as the parameter.

In the example controller below, the routing parameter ``coupon`` is used to determine whether the user gets a coupon.

.. code-block:: javascript

   YUI.add('CouponMojit', function(Y) {
     Y.mojito.controller = {
       init: function(config) {
         this.config = config;
       },
       index: function(actionContext) {
         var sendCoupon = actionContext.params.getFromRoute('coupon');
         var name = actionContext.params.getFromBody("name");
         if(sendCoupon){
            // Display coupon to user
             var coupon = getCoupon;
         }
         actionContext.done(
           {
             name: name ? name : "Dear customer";
             coupon : coupon ? coupon : "";
           });
       }
     }
   }, '0.0.1', {requires: []});

All
~~~

To get all of the routing parameters, call ``getFromRoute`` or ``route`` without any arguments.

In the example controller below, all of the routing routing parameters to create a URL.

.. code-block:: javascript

   YUI.add('LinkMojit', function(Y) {
     Y.mojito.controller = {
       init: function(config) {
         this.config = config;
       },
       index: function(actionContext) {
         var routeParams = actionContext.params.getFromRoute();
         var submitUrl = actionContext.url.make("myMojit", 'submit', routeParams);
         actionContext.done(
           {
             url: submitUrl
           });
       }
     }
   }, '0.0.1', {requires: []});

Getting All Parameters
======================

The Params addon also has the method ``getFromMerged`` that lets you get one or all of the GET, POST, and routing parameters. Because all of the 
parameters are merged into one collection, one parameter might be overridden by another with the same key. You can also use the alias ``merged`` to
get one or all of the GET, POST, and routing parameters.

Thus, the parameter types are given the following priority:

#. routing parameters
#. GET parameters
#. POST parameters

For example, if each parameter type has a ``foo`` key, the ``foo`` routing parameter will override both the GET and POST ``foo`` parameters.

Single
------

To get one of any of the different type of parameters, call ``getFromMerged`` or ``merged`` with the key as the parameter.

In the example controller below, the ``name`` parameter is obtained using ``getFromMerged``.

.. code-block:: javascript

   YUI.add('MergedParamsMojit', function(Y) {
     Y.mojito.controller = {
       init: function(config) {
         this.config = config;
       },
       getPostName: function(actionContext) {
         var mergedName = actionContext.params.getFromMerged('name');
         actionContext.done(
           {
             name: mergedName
           });
       }
     }
   }, '0.0.1', {requires: []});

All
---

To get all of the GET, POST, and routing parameters, call ``getFromMerged`` or ``merged`` without any arguments.

.. code-block:: javascript

   YUI.add('MergedParamsMojit', function(Y) {
     Y.mojito.controller = {
       init: function(config) {
         this.config = config;
       },
       ...
       getAllParams: function(actionContext) {
         var all_params = [];
         var allParams = actionContext.params.getFromMerged();
         Y.Object.each(allParams, function(param, key) {
           all_params.push({key: key, value: param});
         });
         actionContext.done(
           {
             params: all_params
           }
         )
       }
     }
   }, '0.0.1', {requires: []});

Cookies
=======

The `Cookies addon <../../api/classes/Cookie.server.html>`_ offers methods for reading and writing cookies. The API of the Cookie addon is the same as 
the `YUI 3 Cookie Utility <http://yuilibrary.com/yui/docs/api/classes/Cookie.html>`_. For a code example showing how to use the Cookies addon, 
see `Using Cookies <../code_exs/cookies.html>`_.

Getting Cookie Data
-------------------

The method ``cookie.get(name)`` is used to get the cookie value associated with ``name``. In the example controller below, the cookie value 
for ``'user'`` is obtained and then used to pass user information to the view template.

.. code-block:: javascript

   YUI.add('CookieMojit', function(Y) {
     Y.mojito.controller = {
       init: function(config) {
         this.config = config;
     },
     index: function(actionContext) {
       var user = actionContext.cookie.get('user');
        actionContext.done(
           {
             user: user && users[user] ? users[user] : ""
           }
         );
       }
     }
   }, '0.0.1', {requires: []});

Writing Data to Cookies
-----------------------

The method ``cookie.set(name, value)`` is used to set a cookie with the a given name and value.  The following example controller sets a cookie 
with the name ``'user'`` if one does not exist.

.. code-block:: javascript

   YUI.add('CookieMojit', function(Y) {
     Y.mojito.controller = {
       init: function(config) {
         this.config = config;
     },
     index: function(actionContext) {
       var user = actionContext.cookie.get('user');
        if(!user){
           actionContext.cookie.set('user',(new Date).getTime());
        }
        actionContext.done(
           {
             user: user
           }
         );
       }
     }
   }, '0.0.1', {requires: []});


