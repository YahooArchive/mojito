

================
Framework Mojits
================

Introduction
############

Mojito comes with the built-in utility mojits that make developing applications easier. Mojito 
currently comes with the ``HTMLFrameMojit`` that constructs Web pages from the skeleton HTML to the 
styling and content and the ``LazyLoadMojit`` that allows you to lazily load mojit code. Mojito 
plans to offer additional framework mojits in the future.

HTMLFrameMojit
##############

The ``HTMLFrameMojit`` builds the HTML skeleton of a Web page. When you use ``HTMLFrameMojit`` the 
``<html>``, ``<head>``, and ``<body>`` elements are automatically created and the content from child 
mojits are inserted into the ``<body>`` element.  The ``HTMLFrameMojit`` can also automatically 
insert assets such as CSS and JavaScript files into either the ``<head>`` or ``<body>`` elements.

Because it builds the Web page from the framework to the content and styling, the ``HTMLFrameMojit`` 
must be the top-level mojit in a Mojito application. As the top-level or parent mojit, the 
``HTMLFrameMojit`` may have one or more child mojits.

To create a Mojito application that uses the ``HTMLFrameMojit``, see the code examples 
`Using the HTML Frame Mojit <../code_exs/htmlframe_view.html>`_ 
and `Attaching Assets with HTMLFrameMojit <../code_exs/framed_assets.html>`_.

Configuration
=============

As with defining instances of other mojit types, you define an instance of the ``HTMLFrameMojit`` in 
`configuration object <../intro/mojito_configuring.html#configuration-object>`_ of 
``application.json``. Because ``HTMLFrameMojit`` must be the top-level mojit, its instance cannot 
have a parent instance, but may have one or more child instances.

In the example ``application.json`` below, ``frame`` is an instance of ``HTMLFrameMojit`` that has 
the ``child`` instance of the ``framed`` mojit. After the HTML skeleton is created, 
the ``HTMLFrameMojit`` will insert the value of the ``title`` property into the ``<title>`` element 
and the content created by the ``frame`` mojit into the ``<body>`` element.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         "frame" : {
           "type" : "HTMLFrameMojit",
           "config": {
             "title": "Title of HTML page",
             "child" : {
               "type" : "framed"
             }
           }
         }
       }
     }
   ]

To have multiple child instances, the ``HTMLFrameMojit`` instance must use the ``children`` object 
to specify the child instances. In this example ``application.json``, the ``page`` instance of 
``HTMLFrameMojit`` uses the ``children`` object to specify three child instances that can create 
content for the rendered view.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         "page" : {
           "type" : "HTMLFrameMojit",
           "config": {
             "deploy": true,
             "title": HTMLFrameMojit Example with Children",
             "child": {
               "type": "Body",
               "config": {
                 "children" : {
                   "nav": {
                     "type": ""Navigation"
                   },
                   "content": {
                     "type": "articleBuilder"
                   },
                   "footer" {
                     "type": "Footer"
                   }
                 }
               }
             }
           }
         }
       }
     }
   ]

Deploying to Client
===================

To configure Mojito to deploy code to the client, you set the ``deploy`` property of the 
`config <../intro/mojito_configuring.html#configuration-object>`_ object to ``true`` 
as shown below.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         "frame" : {
           "type" : "HTMLFrameMojit",
           "config": {
             "deploy": true,
             "child" : {
               "type" : "framed"
             }
           }
         }
       }
     }
   ]

What Gets Deployed?
-------------------

The following is deployed to the client:

- Mojito framework
- binders (and their dependencies)

When a binder invokes its controller, if the controller has the ``client`` or ``common`` affinity, 
then the controller and its dependencies are deployed to the client as well. If the affinity of the 
controller is ``server``, the invocation occurs on the server. In either case, the binder is able to 
transparently invoke the controller.

Adding Assets with HTMLFrameMojit
=================================

You specify the assets for ``HTMLFrameMojit`` just as you would specify assets for any mojit. The 
basic difference is that  ``HTMLFrameMojit`` will automatically attach ``<link>`` elements for CSS 
and ``<script>`` elements for JavaScript files to the HTML page. When using assets with other mojits, 
you have to manually add ``<link>`` elements that refer to assets to view templates.  See 
`Assets <./mojito_assets.html>`_ for general information about using assets in Mojito.

In the example ``application.json`` below, the ``HTMLFrameMojit`` instance ``frame`` has one child 
mojit with a CSS asset. Because the assets are listed in the ``top`` object, the ``HTMLFrameMojit`` 
will attach the ``<link>`` element pointing to ``index.css`` to the ``<head>`` element.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         "frame" : {
           "type" : "HTMLFrameMojit",
           "config": {
             "child" : {
               "type" : "framed"
             },
             "assets": {
               "top": {
                 "css": [
                   "/static/framed/assets/css/index.css"
                 ]
               }
             }
           }
         }
       }
     }
   ]

The rendered view that was constructed by the ``HTMLFrameMojit`` should look similar to the HTML 
below.

.. code-block:: html

   <!DOCTYPE HTML>
   <html>
     <head><script type="text/javascript">var MOJITO_INIT=Date.now();</script>
       <meta name="creator" content="Yahoo! Mojito 0.1.0">
       <title>Powered by Mojito 0.1.0</title>
       <link rel="stylesheet" type="text/css" href="/static/framed/assets/css/index.css"/>
     </head>
     <body>
       <div id="yui_3_3_0_3_131500627867611" class="mojit">
         <h2 id="header">Framed Assets</h2>
         <p>Page Content</p>
       </div>
     </body>
   </html>

LazyLoadMojit
#############

``LazyLoadMojit`` allows you to defer the loading of a mojit instance by first dispatching the 
``LazyLoadMoit`` as a proxy to the client. From the client, ``LazyLoadMojit`` can then request 
Mojito to load the proxied mojit. This allows your Mojito application to load the page quickly and 
then lazily load parts of the page.

How Does It Work?
=================

The ``LazyLoadMojit`` is really a proxy mojit that dispatches it's binder and an empty DOM node to 
the client. From the client, the binder sends a request to the controller to execute the code of 
the proxied (original) mojit. The output from the executed mojit is then returned to the binder of 
the ``LazyLoadMojit``, which attaches the output to the empty DOM node. The binder of 
``LazyLoadMojit`` destroys itself, leaving the DOM intact with the new content.

Configuring Lazy Loading
========================

To use the ``LazyLoadMojit``, the ``application.json`` must do the following:

- create a top-level mojit instance of type ``HTMLFrameMojit``
- deploy the mojit instance of type ``HTMLFrameMojit`` to the client (``"deploy": true``)
- create a container mojit that has children mojit instances (``"children": { ... }``)
- defer the dispatch of the mojit instance that will be lazily loaded (``"defer": true``)

In the example ``application.json`` below, the child mojit instance ``myLazyMojit`` is configured to 
be lazily loaded. The action (``hello``) of the proxied mojit is also configured to be executed 
after lazy loading is complete.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         "frame": {
           "type": "HTMLFrameMojit",
           "config": {
             "deploy": true,
             "child": {
               "type": "Container",
               "config": {
                 "children": {
                   "myLazyMojit": {
                     "type": "LazyPants",
                     "action": "hello",
                     "defer": true
                   },
                   "myActiveMojit": {
                      "type": "GoGetter",
                   }
                 }
               }
             }
           }
         }
       }
     }
   ]

Example
=======

This example shows you application configuration as well as the code for the parent mojit and the 
child mojit that is lazy loaded.  If you were to run this lazy load example, you would see the 
content of the parent mojit first and then see the child mojit's output loaded in the page. 

Application Configuration
-------------------------

The application configuration for this example (shown below) meets the requirements for using 
``LazyLoadMojit``:

- creates the ``frame`` mojit instance of type ``HTMLFrameMojit``
- sets ``"deploy"`` to ``true`` for ``frame`` so that the code is deployed to the client
- creates the ``child`` mojit instance that has the ``children`` object specifying child mojit 
  instance
- configures the ``myLazyMojit`` instance to defer being dispatched, which causes it to be lazily 
  loaded by ``LazyLoadMojit``

In this ``application.json``, the ``parent`` mojit instance has the one child ``myLazyMojit``. 
The ``myLazyMojit`` mojit instance of type ``LazyChild`` is the mojit that will be lazily loaded by 
``LazyLoadMojit``. In a production application, you could configure the application to have many 
child instances that are lazily loaded after the parent mojit instance is already loaded onto the 
page.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         "frame": {
           "type": "HTMLFrameMojit",
           "config": {
             "deploy": true,
             "parent": {
               "type": "Container",
               "config": {
                 "children": {
                   "myLazyMojit": {
                     "type": "LazyChild",
                     "action": "hello",
                     "defer": true
                   }
                 }
               }
             }
           }
         }
       }
     }
   ]

Container Mojit
---------------

The ``Container`` mojit uses ``ac.composite.done`` to execute its child mojits.

.. code-block:: javascript

   YUI.add('Container', function(Y) {
     Y.mojito.controller = {
     /**
     * Method corresponding to the 'index' action.
     *
     * @param ac {Object} The ActionContext that
     * provides access to the Mojito API.
     */
       index: function(ac) {
         ac.composite.done();
       }
     };
   }, '0.0.1', {requires: ['mojito']});

Instead of waiting for the child mojit to execute, the partially rendered view of the ``Container`` 
mojit is immediately sent to the client. After the child mojit is lazily loaded, the content of the 
executed child replaces the Handlebars expression ``{{{myLazyMojit}}}``.

.. code-block:: html

   <div id="{{mojit_view_id}}">
     <h1>Lazy Loading</h1>
     <hr/>
       {{{myLazyMojit}}
     <hr/>
   </div>

LazyChild Mojit
---------------

The ``LazyLoadMojit`` in the ``application.json`` is configured to lazily load the mojit instance 
``myLazyMojit`` and then call the action ``hello``. Thus, the ``index`` function in the 
``LazyChild`` mojit below is never called.

.. code-block:: javascript

   YUI.add('LazyChild', function(Y) {
     Y.mojito.controller = {
       hello: function(ac) {
         ac.done({time: new Date()});
       },
       index: function(ac) {
         ac.done("This is never seen.");
       }
     };
   }, '0.0.1', {requires: ['mojito']});

The view template ``hello.hb.html`` is rendered on the server and then lazily loaded to the client.

.. code-block:: html

   <div id="{{mojit_view_id}}">
     <h2>I was lazy-loaded at {{{time}}}.</h2>
   </div>


