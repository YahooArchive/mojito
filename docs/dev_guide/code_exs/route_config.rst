

===================
Configuring Routing
===================

**Time Estimate:** 10 minutes

**Difficulty Level:** Beginning

Summary
#######

This example shows how to configure routing for your Mojito application. In Mojito, routing is the mapping of URLs to mojit actions.

Implementation Notes
####################

Before you create routes for your application, you need to specify one or more mojit instances that can be mapped to URLs. In the ``application.json`` below, the ``mapped_mojit`` instance of ``RoutingMojit`` 
is created, which can then be associated in a route defined in ``routes.json``.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         "mapped_mojit": {
           "type": "RoutingMojit"
         }
       }
     }
   ]

The example ``routes.json`` below associates the ``mapped_mojit`` instance defined in ``application.json`` with a path and explicitly calls the ``index`` action. If the controller for ``RoutingMojit`` had the function ``myFunction``, 
you could would use the following to call it: ``mapped_mojit.myFunction``.   Based on the ``custom-route`` route below, when an HTTP GET call is made on the URL ``http:{domain}:8666/custom-route``, 
the ``index`` action is called from the ``custom-route`` instance.

.. code-block:: javascript

   [
     {
       "settings": ["master"],
       "custom-route": {
         "verbs": ["get"],
         "path": "/custom-route",
         "call": "mapped_mojit.index"
       }
     }
   ]

The name of the mojit instance is arbitrary. For example, the mojit instance ``mapped_mojit`` above could have just as well been called ``mojit-route``. Just remember that the name of the mojit instance 
in ``routes.json`` has to be defined and have a mojit type in ``application.json``.

You can also configure multiple routes and use wildcards in ``routes.json``. The modified ``routes.json`` below uses the wildcard to configure a route for handling HTTP POST requests and calls the 
method ``post_params`` from the ``post-route`` mojit instance.

.. code-block:: javascript

   [
     {
       "settings": ["master"],
       "custom-route": {
         "verbs": ["get"],
         "path": "/custom-route",
         "call": "mapped_mojit.index"
       }
       "another-route": {
         "verbs": ["post"]
         "path": "/*",
         "call": mojit-post-route.post_params"
       }
     }
   ]

The ``routes.json`` above configures the routes below. Notice that the wildcard used for the path of ``"another-route"`` configures Mojito to execute ``post_params`` when receiving any HTTP POST requests.

- ``http://localhost:8666/custom-route``
- ``http://localhost:8666/{any_path}``

Setting Up this Example
#######################

To set up and run ``configure_routing``:

#. Create your application.

   ``$ mojito create app configure_routing``

#. Change to the application directory.

#. Create your mojit.

   ``$ mojito create mojit RoutingMojit``

#. To create an instance of ``RoutingMojit``, replace the code in ``application.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": [ "master" ],
          "appPort": 8666,
          "specs": {
            "mapped_mojit": {
              "type": "RoutingMojit"
            }
          }
        }
      ]

#. To map routes to specific actions of the mojit instance, create the file ``routes.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": ["master"],
          "root_route": {
            "verbs": ["get","post"],
            "path": "/",
            "call": "mapped_mojit.index"
          },
          "index_route": {
            "verbs": ["get"],
            "path": "/index",
            "call": "mapped_mojit.index"
          },
          "show_route": {
            "verbs": ["get","post"],
            "path": "/show",
            "call": "mapped_mojit.show"
          }
        }
      ]

   The ``mapped_mojit`` instance is created in ``application.json`` and configured here to be used when HTTP GET calls are made on the paths ``/index`` or ``/show``.

#. Change to ``mojits/RoutingMojit``.

#. Modify your controller to contain the ``index`` and ``show`` actions by replacing the code in ``controller.server.js`` with the following:

   .. code-block:: javascript

      YUI.add('RoutingMojit', function(Y,NAME) {
        Y.mojito.controllers[NAME] = {
          init: function(config) {
            this.config = config;
          },
          index: function(ac) {
            ac.done(route_info(ac));
          },
          show: function(ac){
            ac.done(route_info(ac));
          }
        };
        // Builds object containing route information
        function route_info(ac){
          var methods = "";
          var name = "";
          var action = ac.action;
          var path = ac.http.getRequest().url;
          if(path==="/" && action==="index"){
            name = ac.app.routes.root_route.name;
            Object.keys(ac.app.routes.root_route.verbs).forEach(function(n) {
              methods += n + ", ";
            });
          } else if(action==="index"){
            path = ac.app.routes.index_route.path;
            name = ac.app.routes.index_route.name;
            Object.keys(ac.app.routes.index_route.verbs).forEach(function(n) {
              methods += n + ", ";
            });
          }else {
            path = ac.app.routes.show_route.path;
            name = ac.app.routes.show_route.name;
            Object.keys(ac.app.routes.show_route.verbs).forEach(function(n)  {
                methods += n + ", ";
            });
          }
          return {
            "path": path,
            "name": name,
            "methods": methods.replace(/, $/,"")
          };
        }
      }, '0.0.1', {requires: []});

#. To display your route information in your ``index`` view template, replace the content of ``index.hb.html`` with the following:

   .. code-block:: html

      <div id="{{mojit_view_id}}">
        <b>Route Path:</b> {{path}}<br/>
        <b>HTTP Methods:</b> {{methods}}<br/>
        <b>Route Name:</b> {{name}}
      </div>

#. To display your route information in your ``show`` view template, create the file ``show.hb.html`` with the following:

   .. code-block:: html

      <div id="{{mojit_view_id}}">
        <b>Route Path:</b> {{path}}<br/>
        <b>HTTP Methods:</b> {{methods}}<br/>
        <b>Route Name:</b> {{name}}
      </div>

#. Run the server and open the following URL in a browser to see the ``index`` route: http://localhost:8666/index

#. To see the ``show`` route, open the following URL in a browser:

   http://localhost:8666/show

Source Code
###########

- `Application Configuration <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/configure_routing/application.json>`_
- `Route Configuration <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/configure_routing/routes.json>`_
- `Configure Routing Application <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/configure_routing/>`_


