

======================
Using Query Parameters
======================

**Time Estimate:** 15 minutes

**Difficulty Level:** Intermediate

Summary
#######

This example shows how to access query parameters from the URL, the POST body, and the routing configuration of your Mojito application.

The following topics will be covered:

- using the `Params addon <../../api/classes/Params.common.html>`_ to access parameters
- setting and getting parameters from your route configuration

Implementation Notes
####################

The mojit controller of this code example has four functions, each using methods from the ``Params`` addon to access different types of parameters. Let's start by learning how 
to access the query string parameters in the first function.

The ``example1`` function below gets all of the query string parameters using ``params.getFromUrl``. To get a specific parameter, just pass a key to ``params.getFromUrl(key)``. 
In the code below, the key-value pairs that are fetched by ``params.getFromUrl()`` are wrapped in objects that are pushed to the array ``paramsArray``. The array is assigned to ``params``, 
which is then passed to the ``example1`` view template. By default, the function sends data to the view template with the same name.

.. code-block:: javascript

   ...
     // Read from query string
     // e.g., GET /example1?foo=bar
     example1: function(actionContext) {
       // Returns all of the key-value pairs in
       // the query string.
       var params = actionContext.params.getFromUrl(),
       paramsArray = [];
       // Create an object for each key-value pair and
       // push those objects to an array, which is then
       // assigned to 'params' that is available in
       // index view template (index.hb.html).
       Y.Object.each(params, function(param, key) {
         paramsArray.push({key: key, value: param});
       });
       Y.log('GET PARAMS: ' + Y.dump(paramsArray));
       actionContext.done(
         {
           title: "Show all query string parameters",
           params: paramsArray
         },
         {name: 'index'}
       );
     },
   ...

The ``example2`` function below uses ``params.getFromBody()`` to extract parameters from the POST body. Once again, the array of objects containing the key-value pairs is passed to 
the ``example2`` view template, where the array is available through the ``params`` variable.

.. code-block:: javascript

   ...
     // Read parameters from POST body
     // e.g., POST /example2 with POST body
     example2: function(actionContext) {
       var params = actionContext.params.getFromBody(),
       paramsArray = [];
       Y.Object.each(params, function(param, key) {
         paramsArray.push({key: key, value: param});
       });
       actionContext.done(
         {
           title: "Show all POST parameters",
           params: paramsArray
         },
         {name: 'index'}
       );
     },
   ...

The ``example3`` function below uses ``params.getFromRoute()`` to access the parameters that are specified in ``routes.json``, which we will look at in the next code snippet.

.. code-block:: javascript

   ...
     // Read parameters from routing system
     example3: function(actionContext) {
       var params = actionContext.params.getFromRoute(),
       paramsArray = [];
       Y.Object.each(params, function(param, key) {
         paramsArray.push({key: key, value: param});
       });
       actionContext.done(
         {
           title: "Show all ROUTING parameters (see routes.json)",
           params: paramsArray
         },
         {name: 'index'}
       );
     },
   ...

In the ``routes.json`` file below, you see parameters are set for the ``example3`` and ``example4`` rout. Notice that ``example3`` only accepts HTTP GET calls, whereas ``example4`` allows 
both HTTP GET and POST calls. Storing parameters in your routing configuration allows you to associate them with a function, an HTTP method, and a URL path.

.. code-block:: javascript

   [
     {
       "settings": ["master"],
       "root": {
         "verbs": ["get"],
         "path": "/",
         "call": "frame.index"
       },
       "example1": {
         "verbs": ["get"],
         "path": "/example1",
         "call": "frame.example1"
       },
       "example2": {
         "verbs": ["get", "post"],
         "path": "/example2",
         "call": "frame.example2"
       },
       "example3": {
         "verbs": ["get"],
         "path": "/example3",
         "call": "frame.example3",
         "params": { "from": "routing", "foo": "bar", "bar": "foo" }
       },
       "example4": {
         "verbs": ["get", "post"],
         "path": "/example4",
         "call": "frame.example4",
         "params": { "from": "routing", "foo3": "bar3" }
       }
     }
   ]
   

In the ``example4`` function below, you find the parameters catch-all method ``params.getFromMerged``. Using ``params.getFromMerged``, you can get the query string parameters, the POST body parameters, 
and the parameters set in ``routes.json`` at one time. You can also get a specific parameter by passing a key to ``params.getFromMerged(key)``. For example, ``params.getFromMerged("from")`` would 
return the value "routing" from the parameters set in the ``routes.json`` shown above.

.. code-block:: javascript

   ...
     // Read the merged map created by Mojito of all
     // input parameters from the URL query string (GET),
     // the POST body, and any routing parameters
     // that may have been attached during the routing look up.
     // Priority of merging is : Route -> GET -> POST
     example4: function(actionContext) {
       var params = actionContext.params.getFromMerged(),
       paramsArray = [];
       Y.Object.each(params, function(param, key) {
         paramsArray.push({key: key, value: param});
       });
       actionContext.done(
         {
           title: "Show all ROUTING parameters (see routes.json)",
           params: paramsArray
         },
         {name: 'index'}
       );
     }
   ...

For more information, see the `Params addon <../../api/classes/Params.common.html>`_ in the Mojito API documentation.

Setting Up this Example
#######################

To set up and run ``using_parameters``:

#. Create your application.

   ``$ mojito create app using_parameters``

#. Change to the application directory.

#. Create your mojit.

   ``$ mojito create mojit QueryMojit``

#. To specify that your application use ``QueryMojit``, replace the code in ``application.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": [ "master" ],
          "specs": {
            "frame": {
              "type": "QueryMojit"
            }
          }
        }
      ]

#. To configure the routing for your application, create the file ``routes.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": ["master"],
          "root": {
            "verbs": ["get"],
            "path": "/",
            "call": "frame.index"
          },
          "example1": {
            "verbs": ["get"],
            "path": "/example1",
            "call": "frame.example1"
          },
          "example2": {
            "verbs": ["get", "post"],
            "path": "/example2",
            "call": "frame.example2"
          },
          "example3": {
            "verbs": ["get"],
            "path": "/example3",
            "call": "frame.example3",
            "params": { "from": "routing", "foo": "bar", "bar": "foo" }
          },
          "example4": {
            "verbs": ["get", "post"],
            "path": "/example4",
            "call": "frame.example4",
            "params": { "from": "routing", "foo3": "bar3" }
          }
        }
      ]

#. Change to ``mojits/QueryMojit``.

#. Modify the controller to access different query parameters by replacing the code in ``controller.server.js`` with the following:

   .. code-block:: javascript

      YUI.add('QueryMojit', function(Y,NAME) {
        Y.mojito.controllers[NAME] = {
          init: function(config) {
            this.config = config;
          },
          index: function(actionContext) {
          actionContext.done('Mojito is working.');
          },
          // Read from query string
          // e.g. GET /example1?foo=bar
          example1: function(actionContext) {
            var params = actionContext.params.getFromUrl(),
            paramsArray = [];
            Y.Object.each(params, function(param, key) {
              paramsArray.push({key: key, value: param});
            });
            actionContext.done(
            {
              title: "Show all query string parameters",
              params: paramsArray
            },
            {name: 'index'}
             );
          },
          // Read parameters from POST body
          // e.g. POST /example2 with POST body
          example2: function(actionContext) {
            var params = actionContext.params.getFromBody(),
            paramsArray = [];
            Y.Object.each(params, function(param, key) {
              paramsArray.push({key: key, value: param});
            });
            actionContext.done(
              {
                title: "Show all POST parameters",
                params: paramsArray
              },
              {name: 'index'}
            );
          },
          // Read parameters from routing system
          example3: function(actionContext) {
            var params = actionContext.params.getFromRoute(),
            paramsArray = [];
            Y.Object.each(params, function(param, key) {
              paramsArray.push({key: key, value: param});
            });
            actionContext.done(
              {
                title: "Show all ROUTING parameters (see routes.json)",
                params: paramsArray
              },
              { name: 'index'}
            );
          },
          // Read the merged map created by Mojito
          // of all input parameters from URL query
          // string (GET), the POST body, and any
          // routing parameters that may have been
          // attached during routing look up..
          // Priority of merging is : Route -> GET -> POST
          example4: function(actionContext) {
            var params = actionContext.params.getFromMerged(),
            paramsArray = [];
            Y.Object.each(params, function(param, key) {
              paramsArray.push({key: key, value: param});
            });
            actionContext.done(
              {
                title: "Show all ROUTING parameters (see routes.json)",
                params: paramsArray
              },
              {name: 'index'}
            );
          }
        };
      }, '0.0.1', {requires: ['dump']});

#. To display the key-value pairs from the query string parameters, create the view template ``views/example1.hb.html`` with the following:

   .. code-block:: html

      <div id="{{mojit_view_id}}" class="mojit">
        <h2>{{title}}</h2>
        List of key value pairs:
        <ul>
        {{#params}}
          <li>{{key}} => {{value}}</li>
        {{/params}}
        </ul>
      </div>

#. To display the key-value pairs from the POST request body parameters, create the view template ``views/example2.hb.html`` with the following:

   .. code-block:: html

      <div id="post_params">
        <h2>Form for Posting Parameters</h2>
        <form method="post">
          <p>
            Framework: <input type="text" name="framework" value="Mojito"/><br/>
            Addon Used: <input type="text" name="addon" value="params"/><br/>
            Method Called: <input type="text" name="method" value="getFromBody()"/><br/>
            <h3>Type of Parameters Passed</h3>
            <input type="radio" name="param_type" value="POST" checked> POST Body</input><br/>
            <input type="radio" name="param_type" value="query string"> Query String</input><br/><br/>
            <input type="submit" value="Submit"/>
            <input type="reset"/>
          </p>
        </form>
      </div>
      <div id="{{mojit_view_id}}" class="mojit">
        <h2>{{title}}</h2>
        List of key value pairs:
        <ul>
          {{#params}}
          <li>{{key}} => {{value}}</li>
          {{/params}}
        </ul>
      </div>

#. To display the key-value pairs set in ``routes.json``, create the view template ``views/example3.hb.html`` with the following:

   .. code-block:: html

      <div id="{{mojit_view_id}}" class="mojit">
        <h2>{{title}}</h2>
        List of key value pairs:
        <ul>
          {{#params}}
          <li>{{key}} => {{value}}</li>
          {{/params}}
        </ul>
      </div>

#. To display all of the available parameters, create the view template ``views/example4.hb.html`` with the following:

   .. code-block:: html

      <div id="post_params">
        <h2>Form for Posting Parameters</h2>
        <form method="post">
          <p>
            Framework: <input type="text" name="framework" value="Mojito"/><br/>
            Addon Used: <input type="text" name="addon" value="params"/><br/>
            Method Called: <input type="text" name="method" value="getFromBody()"/><br/>
            <h3>Type of Parameters Passed</h3>
            <input type="radio" name="param_type" value="POST" checked> POST Body</input><br/>
            <input type="radio" name="param_type" value="query string"> Query String</input><br/><br/>
            <input type="submit" value="Submit"/>
            <input type="reset"/>
          </p>
        </form>
      </div>
      <div id="{{mojit_view_id}}" class="mojit">
        <h2>{{title}}</h2>
        List of key value pairs:
        <ul>
          {{#params}}
          <li>{{key}} => {{value}}</li>
          {{/params}}
        </ul>
      </div>

#. From the application directory, run the server.

   ``$ mojito start``

#. To see the query string parameters fetched by the controller, go to the URL with the query string below:

   http://localhost:8666/example1?foo=bar&bar=foo

#. To see the POST body parameters fetched by the controller, go to the URL below and submit the form on the page.

   http://localhost:8666/example2

#. To see the parameters set in ``routes.json``, go to the URL below:

   http://localhost:8666/example3

#. To see the query string parameters, the post body parameters, and those set in ``routes.json``, go to the URL below and submit the form on the page:

   http://localhost:8666/example4?foo=bar&bar=foo

Source Code
###########

- `Mojit Controller <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/using_parameters/mojits/QueryMojit/>`_
- `Routing Configuration <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/using_parameters/routes.json>`_
- `Using Parameters Application <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/using_parameters/>`_


