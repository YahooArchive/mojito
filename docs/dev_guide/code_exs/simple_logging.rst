

==============
Simple Logging
==============

**Time Estimate:** 15 minutes

**Difficulty:** Intermediate

Summary
#######

This example shows how to configure the log levels for the client and the server in Mojito.

The following topics will be covered:

- configuring the logging levels
- displaying client-side and server-side logging
- using ``Y.log`` to set log levels

Implementation Notes
####################

Log Configuration
=================

Logging is configured in the ``application.json`` file with the ``log`` object. The ``log`` object can contain a ``client`` object and/or a ``server`` object to configure logging 
for the client and server respectively. In the example ``log`` object below, you can see that you can configure the levels and some elements of the output for logs. 
See `Log Defaults <../topics/mojito_logging.html#log-defaults>`_ for the list of configuration properties and their default values.

.. code-block:: javascript

   "log":{
     "client":{
       "level":"debug",
       "yui":true,
       "timestamp": false
     },
     "server":{
       "level":"debug",
       "yui":true,
       "timestamp": true
     }
   }

Log Levels
==========

Mojito has the following five log levels that you configure in ``application.json`` or set with ``Y.log``.

- ``DEBUG``
- ``INFO``
- ``WARN``
- ``ERROR``
- ``MOJITO``

Setting a log level of ``WARN`` will filter out all ``DEBUG`` and ``INFO`` messages, while ``WARN``, ``ERROR``, and ``MOJITO`` log messages will be processed. To see all log messages, 
set the log level to ``DEBUG``. The ``MOJITO`` log level is for showing Mojito framework-level logging that indicate important framework events are occurring.

Setting Log Level with Y.log
============================

The function ``Y.log`` takes two parameters. The first parameter is the log message, and the second parameter is used to indicate the log level. When the second parameter is omitted, 
the log message will be reported at the default or configured log level.

For example, the first use of ``Y.log`` below will report the message at the log level that is configured in ``application.json`` or use the default. The second use of ``Y.log`` will 
use the log level ``INFO``.

.. code-block:: javascript

   Y.log("This message will be reported at the log level set in application.json or the default level.");
   Y.log("This log message will be reported at the INFO log level.", "info");

Setting Up this Example
#######################

To set up and run ``simple_logging``:

#. Create your application.

   ``$ mojito create app simple_logging``

#. Change to the application directory.

#. Create your mojit.

   ``$ mojito create mojit log``

#. To configure the log levels for the client and server, replace the code in ``application.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": [ "master" ],
          "specs": {
            "frame": {
              "type": "HTMLFrameMojit",
              "config":{
                "deploy": true,
                "child":{
                  "type": "log"
                }
              }
            }
          },
          "log":{
            "client":{
              "level":"debug",
              "yui":true,
              "timestamp": false
            },
            "server":{
              "level":"debug",
              "yui":true,
              "timestamp": true
            }
          }
        }
      ]

#. To configure routing, create the file ``routes.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": ["master"],
          "root": {
            "verb": ["get"],
            "path": "/",
            "call": "frame.index"
          }
        }
      ]

#. Change to ``mojits/log``.

#. Modify your controller so that one log message uses the default log level and one log message has the log level set by ``Y.log`` by replacing the code in ``controller.server.js`` with the following:

   .. code-block:: javascript

      YUI.add('log', function(Y, NAME) {
        Y.mojito.controllers[NAME] = {
          init: function(config) {
            this.config = config;
          },
          index: function(ac) {
            Y.log('[CONTROLLER]: entering into controller index (...)',"info");
            var today = new Date(),
            data = {
              type : 'simple',
              time : {
                hours: today.getHours()%12,
                minutes: today.getMinutes()<10 ? "0" + today.getMinutes() : today.getMinutes(),
                period: today.getHours()>=12 ? "p.m." : "a.m."
              },
              show : true,
              hide : false,
              list : [
                {
                  id: 2
                },
                {
                  id: 1
                },
                {
                  id: 3
                }
              ],
              hole : null,
              html : "<h3 style='color:red;'>simple html</h3>"
            };
            Y.log('[CONTROLLER]: Today ' +today);
            ac.done(data);
          }
        };
      }, '0.0.1', { requires: ['mojito']});

#. To display your client logging,  replace the content of ``binders/index.js`` with the following:

   .. code-block:: javascript

      YUI.add('logBinderIndex', function(Y, NAME) {
        Y.namespace('mojito.binders')[NAME] = {
          init: function(mojitProxy) {
            Y.log('[BINDER]: Log message from init.',"info");
            this.mojitProxy = mojitProxy;
          },
          bind: function(node) {
            Y.log('[BINDER]: Log message from bind.',"info");
            this.node = node;
          }
        };
      }, '0.0.1', {requires: ['mojito-client']});

#. Modify the default view template by replacing the code in ``views/index.hb.html`` with the following:

   .. code-block:: html

      <div id="{{mojit_view_id}}" class="mojit">
        <h2 style="color: #606; font-weight:bold;">Simple Log Configuration </h2>
        <div>This app is to demonstrate the the logging level and its configuration.
          <h3> Server Configuration </h3>
          <b>Log level: </b> DEBUG <br/>
          <b>Timestamp: </b> TRUE <br/>
          <h3> Client Configuration </h3>
          <b>Log level: </b> INFO <br/>
          <b>Timestamp: </b> FALSE <br/>
        </div>
      </div>

#. From the application directory, run the server.

   ``$ mojito start``

#. Open the URL below in a browser and look at the output from the Mojito server. You should see the log messages from the controller that start with the string "\[CONTROLLER]:". Notice that the two messages have different log levels.

   http://localhost:8666/

#. Open your browser's developer console, such as Firebug, and view the console logs. You should see the client log messages from the binder that start with the string "\[BINDER]".

Source Code
###########

- `Simple Logging App <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/simple_logging/>`_
- `Logging Configuration <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/simple_logging/application.json>`_
- `Mojit Controller <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/simple_logging/mojits/log/controller.server.js>`_
- `Binder <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/simple_logging/mojits/log/binders/index.js>`_


