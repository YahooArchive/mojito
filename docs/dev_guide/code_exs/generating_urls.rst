

===============
Generating URLs
===============

**Time Estimate:** 15 minutes

**Difficulty Level:** Intermediate

Summary
#######

This example shows you a way to generate URLs to a particular view independent of the controller or action of the mojit.

The following topics will be covered:

- configuring routing paths to call actions from mojit instances
- creating a URL in the mojit controller with the `Url addon <../../api/classes/Url.common.html>`_

Implementation Notes
####################

The route paths for this code example are defined in the routing configuration file ``routes.json``. You can define any path and then associate that path with a mojit instance and an action. 
When the client makes an HTTP request on that path, the associated action on the mojit instance defined in ``application.json`` will be executed. Before creating the routes for the application, 
you first need to create the mojit instance.

In the ``application.json`` below, you configure the application to use an instance of the mojit ``GenURLMojit``. The instance in this example is ``mymojit``, but the instance name can be 
any string as defined by `RFC 4627 <http://www.ietf.org/rfc/rfc4627.txt>`_.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         "mymojit": {
           "type": "GenURLMojit"
         }
       }
     }
   ]

In the ``routes.json``, you not only can define route paths, but you can also configure Mojito to respond to specific HTTP methods called on those paths. The ``routes.json`` below defines 
two route paths that only respond to HTTP GET calls. When HTTP GET calls are made on these two paths, Mojito executes different methods from the ``mymojit`` instance. The ``index`` method 
is executed when the root path is called, and the ``contactus`` method is executed when the ``/some-really-long-url-contactus`` path is called.  The ``routes.json`` file gives you the 
freedom to create route paths independent of the mojit controller.

.. code-block:: javascript

   [
     {
       "settings": ["master"],
       "root": {
         "verbs": ["get"],
         "path": "/",
         "call": "mymojit.index"
       },
       "contactus": {
         "verbs": ["get"],
         "path": "/some-really-long-url-contactus",
         "call": "mymojit.contactus"
       }
     }
   ]

The mojit controller, however, can use the ``Url`` addon to access the route paths defined in ``routes.json`` to create URLs. For example, in the ``controller.server.js`` below, 
the route path that calls the ``contactus`` action is formed with ``url.make`` in the ``index`` function. You just pass the instance and action to ``url.make`` to create the URL 
based on the path defined in ``routes.json``.

.. code-block:: javascript

   YUI.add('GenURLMojit', function(Y,NAME) {
     Y.mojito.controllers[NAME] = {
       init: function(config) {
         this.config = config;
       },
       index: function(actionContext) {
         var url = actionContext.url.make('mymojit', 'contactus', '');
         actionContext.done({contactus_url: url});
       },
       contactus: function(actionContext) {
         var currentTime = actionContext.i18n.formatDate(new Date());
         actionContext.done({currentTime: currentTime});
       }
     };
   }, '0.0.1', {requires: ['mojito-intl-addon']});

Setting Up this Example
#######################

To set up and run ``generating_urls``:

#. Create your application.

   ``$ mojito create app generating_urls``

#. Change to the application directory.

#. Create your mojit.

   ``$ mojito create mojit GenURLMojit``

#. To configure your application to use ``GenURLMojit``, replace the code in ``application.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": [ "master" ],
          "specs": {
            "mymojit": {
              "type": "GenURLMojit"
            }
          }
        }
      ]

#. To configure routing paths, replace the code in ``routes.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": ["master"],
          "root": {
            "verbs": ["get"],
            "path": "/",
            "call": "mymojit.index"
          },
          "contactus": {
            "verbs": ["get"],
            "path": "/some-really-long-url-that-we-dont-need-to-remember-contactus",
            "call": "mymojit.contactus"
          }
        }
      ]

#. Change to ``mojits/GenURLMojit``.

#. Enable the controller to create a URL using the route paths defined in ``routes.json`` by replacing the code in ``controller.server.js`` with the following:

   .. code-block:: javascript

      YUI.add('GenURLMojit', function(Y,NAME) {
        Y.mojito.controllers[NAME] = {
          init: function(config) {
            this.config = config;
          },
          index: function(actionContext) {
            var url = actionContext.url.make('mymojit', 'contactus', '');
            actionContext.done({contactus_url: url});
          },
          contactus: function(actionContext) {
            var currentTime = actionContext.intl.formatDate(new Date());
            actionContext.done({currentTime: currentTime});
          }
        };
      }, '0.0.1', {requires: ['mojito-intl-addon']});

#. To display the rendered ``index`` view template when HTTP GET is called on the root path,  replace the code in ``views/index.hb.html`` with the following:

   .. code-block:: html

      <div id="{{mojit_view_id}}" class="mojit">
        <div>
          <p>This is the default page that is visible on the root path.</p>
          <p>The purpose of this demo is to show that as a developer, you don't have to remember any custom routing path you specify in routes.json configuration file.</p>
          <p>All you need is the mojit identifier (e.g. mymojit), and the action that you are calling on the mojit (e.g. contactus). See the mojits/GenURLMojit/controller.server.js for more details.</p>
        </div>
        <div style="text-align: center; background-color: #0776A0">
          <p>Click <a href="{{contactus_url}}">here</a> on how to Contact Us.</p>
        </div>
      </div>

#. To display the rendered ``contactus`` view template when the ``contactus`` action is executed,  replace the code in ``views/contactus.hb.html`` with the following:

   .. code-block:: html

      <div id="{{mojit_view_id}}" class="mojit">
        <div>
          <p>This is the contact page last viewed on: <strong>{{currentTime}}</strong>
          </p>
        </div>
        <div>
          <p>Yahoo Inc, 701 First Avenue, Sunnyvale CA 94089</p>
        </div>
      </div>

#. Run the server and open the following URL in a browser: http://localhost:8666/

#. From your application, click on the `here <http://localhost:8666/some-really-long-url-that-we-dont-need-to-remember-contactus>`_ link to see the URL with the long path.

Source Code
###########

- `Routing Configuration <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/generating_urls/routes.json>`_
- `Mojit Controller <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/generating_urls/mojits/GenURLMojit/controller.server.js>`_
- `Generating URLs Application <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/generating_urls/>`_


