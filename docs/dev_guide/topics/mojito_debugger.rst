

========
Debugger
========

Mojito has an API used for collecting debug data/logs/perfomance data. Debug data is only collected when a application specified query param is set.
The debug data is then displayable using some general purpose mojits, or you can create your own custom mojits to display the debugging data.


Setup
#####

To start using the mojito debugger, you need to change your app configuration and enable debugging.
By default, the debugger interface is turned off. 
To enable, update your application.json file with a **debug** section.

Example

.. code-block:: javascript

     [
         {
             "settings": [ "master" ],
             "specs": {
                   ...
             },
             "debug": {
                 "queryParam": "my_debug",
                 "debugMojit": "@DebugFrame.index",
                 "debugPath": "/debug_path",
                 "modules": {
                 },
                 "debugAllowed": "mojito-debug-reqest-validate.handler"  (optional)
             }

* queryParam : (required)
    A query param that provides a list of debug flags to turn on.
    When this query param is not present, the debug API does not collect any data.
    
    Example: ?my_debug=help
* debugMojit : (required)
    Name of mojit to redirect request to. If using the debug mojits from the npm module ``mojito-debug-view``,
    then set this to **@DebugFrame.index**. If you want to build your own debug UI, set this to the mojit that
    will render your app, and display the debug mojits.
    
    Example: @DebugFrame.index
* debugPath : (required)
    Name of a path that is NOT used by the application. This path will be used internal to redirect
    the request. This needs to not conflict with any other path the application uses.
    
    Example: /debug_path
* modules: (optional)
    A list of user defined flags. Each flag is associated with a mojit to render the data.
    See :ref:`Custom debug data <custom-debug>` for more information.
* debugAllowed: (optional)
    This is the name of a YUI module and a function inside it (module_name.function). This function
    takes a single argument that is the request object. It should return true of false if this request is by a valid
    user of the debugging system. Invalid request will return error. Valid request will redirect
    to the debugMojit.
    
Once your application has the debugger enabled, you will need to install the UI. You can either use the 
interface provided by the npm module ``mojito-debug-view``, or you can create your own.
See :ref:`Custom UI <custom-ui>` for more information on building your own UI.
See :ref:`Using mojito-debug-view <mojito-debug-view>` for more informatnio on installing a general purpose UI.


Using
#####


To use the debugger you need to append the debug query param, you configured in application.json, to the url of the page you want to debug.

Example: ``http://something.com/page?my_debug=flags,...``

The value of the query param is a comma seperated list of debug flags to turn on. Each flag is associated with a specific piece
of debug data. If using the ``mojito-debug-view`` UI, then the special flag **help** is available. This will bring up a help
mojit that lists all the available debug flags.


Pre-Defined Debugging Flags
===========================

The core mojito system has been instrimented with this debuggign system. The following flags are available.


* log.AC_Logger
    All log lines logged to the ``ac.logger`` are viewable from this flag.

* log.AC
    The AC object is logged under this flag. This provides an easy way to see the request object, and app config, context, and anything else
    attached to the AC object.

* log.Render
    This is a log of the data that was used to render templates in your application.

* prof.dispatch
    This is a profiling breakdown showing when the different mojits in your application started rending, and when the ac.done was called for each.

* prof.PerfMark
    If you manually enable perf markers, this is profiling view is available. It will show you when the different perf markers were set.
    



User Defined Debugging Flags
############################

Users can define there own flags and record there own debuggig data. Users will need to use the `MojitoDebugAPI <../../api/classes/MojitoDebugAPI.html>`_
API to log there own data.  There are three basic options available for logging your own data.


Logs
====

The log API allow you to log both simple strings, or objects. 
You can either log data to the general purpose log flag, or you can log data to your own custom flag.

Example

.. code-block:: javascript

    req.debug.log("Some log data");
    req.debug.logOn("my_flag", "Some log data");

Timing
======

The profiling API allows you to mark the start and end of specific events in your code. Events
can have multiple ends. This allows you to mark different aspects of a single event. All events
logged under the same flag are displayed together in a single waterfall graph.

Example

.. code-block:: javascript

    req.debug.profOpen("my_flag", "event 1", "call to something");
    req.debug.profClose("my_flag", "event 1", "DNS lookup done");
    req.debug.profClose("my_flag", "event 1", "Req sent");


General Purpose
===============

You can also log general purpose data. This system allows you to attach any data your want to
and object, and then build your own mojit to render this data.

Example

.. code-block:: javascript

    req.debug.on("my_flag", function (data) {
        data.some = 'thing';
    });

See :ref:`Custom debug data <custom-debug>` for information on building your own custom mojti to display this data.


.. _mojito-debug-view:

Using ``mojito-debug-view`` module
##################################

To use the debugging system you will need a UI. The esasiet way to get started is to use the ``mojito-debug-view``
package. This package provides mojits for logs, profiling data, and a help interface.

Installing
==========

To install you need to add the following to your application package.json file.

.. code-block:: javascript

    "dependencies": {
        ...
        "mojito-debug-view": "0.0.4-13"
    },

Run "npm install"


.. _custom-debug:

User defined mojits
===================

User defined debug data, collected with the ``debug.on``, can be rendered by creating a custom
mojit. This mojit will be passed the object created with the ``debug.on`` calls. This custom
debug mojit needs to also be registred with the debug system.


Registering mojit
-----------------

To register your own custom debug mojits, you will need to add the mojits to the debug
section of the application.json file.

Example


Example

.. code-block:: javascript

     [
         {
             "settings": [ "master" ],
             "specs": {
                   ...
             },
             "debug": {
                 ...
                 "modules": {
                    "my_flag": {
                        "title": "Bar",
                        "description": "Test debug of Bar",
                        "type": "DebugBar"
                    }
                 },

* my_flag
    The keys used in the modules object are the name of the debug flag. This must match the flag
    used int he ``debug.on`` calls, and also what is passed to the debug query param ``?my_debug=my_flag``.

* title
    This is the name of the mojit. It will appear in the help page and in the title bar of the mojit.

* description
    This appears in the help page.

* type
    This is the mojit that will be rendered to display that data.


Render mojit
------------

The mojit you registered to display your debug data, can use the api call ``debug.get("my_flag")`` to get
the data your stored with the ``debug.on`` calls. You can use the ac addon ``mojito.debug.api`` to get
easy access to the debug api.

Example:

.. code-block:: javascript

    YUI.add('DebugBar', function(Y, NAME) {

        Y.namespace('mojito.controllers')[NAME] = {

            init: function(config) {
                this.config = config;
            },

            index: function(ac) {
                var my_data = ac.debug.get("my_flag");
                ac.done("My data: " + my_data.some);
            }

        };

    }, '0.0.1', {requires: ['mojito', 'mojito.debug.api']});


.. _custom-ui:

Creating Custom UI
##################


If you don't want to use the ``mojito-debug-view`` package, you can define your own UI. You register your UI
in the application.json file, set ``debugMojit`` to the name of your own top level UI mojit. This mojit will
need to do several things.

#. Parse the debug query param and call ``debug.addFlag(flag)`` for each flag set.

#. Render the real page.

#. For each flag set, get the debug data by calling ``debug.get(flag)`` and render that data.


Example:

.. code-block:: javascript

    YUI.add('MyUI', function(Y, NAME) {
        Y.namespace('mojito.controllers')[NAME] = {
            init: function(config) {
                this.config = config;
            },
            index: function(ac) {
                var debug = ac._adapter.debug,
                    currentUrl = ac._adapter.req.url,
                    config = YUI.Env.mojito.DataProcess.retrieve('static-app-config'),
                    newUrl = currentUrl.slice(config.debug.debugPath.length),
                    mojitoRoute = ac.url.find(newUrl),
                    call = mojitoRoute.call.split('.'),
                    route = Y.clone(ac.app.config.specs[call[0]]);

                route.action = call[1];

                Y.each(debug.parseDebugParameters(ac.params.url()[config.debug.queryParam]), function (flag) {
                    debug.addFlag(flag);
                });

                ac.http.setHeader('Content-type', 'text/html');

                ac.http.getRequest().url = newUrl;
                ac.composite.execute({
                    children: {
                        'application': route
                    }
                }, function (data, meta) {
                    var res;

                    res = data.application + "<P>";
                    Y.each(debug.parseDebugParameters(ac.params.url()[config.debug.queryParam]), function (flag) {
                        var data = debug.get(flag);

                        if (data)
                            res += JSON.stringify(data) + "<P>";
                    });
                    ac.done(res);
                });
            }
        };
    }, '0.0.1', {requires: ['mojito', 'mojito-url-addon', 'mojito-params-addon', 'mojito-http-addon', 'mojito-composite-addon']});



