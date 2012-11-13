=======
Logging
=======

Mojito has its own logging system. When you call ``Y.log`` from within your mojits, your 
log messages are intercepted and processed by Mojito. You can set logging levels
to control the degree of detail in your log reports. You can also configure Mojito to enable 
log buffering, so performance during crucial runtime periods is not adversely affected.

.. _mojito_logging-levels:

Log Levels
==========

Mojito has the following five log levels:

- ``DEBUG``
- ``INFO``
- ``WARN``
- ``ERROR``
- ``MOJITO``

All of them should be familiar except the last, which are framework-level messages that 
indicate that an important framework event is occurring (one that users might want to 
track).

Setting a log level of ``WARN`` will filter out all ``DEBUG`` and ``INFO`` messages, while 
``WARN``, ``ERROR``, and ``MOJITO`` log messages will be processed. To see all 
log messages, set the log level to ``DEBUG``.

.. _mojito_logging-defaults:

Log Defaults
============

The server and client log settings have the following default values:

- ``level:`` ``DEBUG`` - log level filter.
- ``yui:`` ``true`` - determines whether YUI library logs are displayed.
- ``buffer:`` ``false`` -  determines whether logs are buffered.
- ``maxBufferSize: 1024`` - the number of logs the buffer holds before auto-flushing.
- ``timestamp: true`` -  log statements are given a timestamp if value is true.
- ``defaultLevel: 'info'`` - if ``Y.log`` is called without a log level, this is the 
  default.

.. _mojito_logging-config:

Log Configuration
=================

All the values above are configurable through the 
`yui.config object <../intro/mojito_configuring.html#yui_config>`_ in the ``application.json`` 
file. In the example ``application.json`` below, the ``yui.config`` object 
overrides the defaults for ``logLevel`` and ``buffer``.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "yui": {
         "config": {
           "level": "error",
           "buffer": true
         }
       },
       ...
     }
   ]

.. Commenting out Mutator Log Function documentation because as of 10/03/12, you
.. cannot create log mutator functions.

    .. _mojito_logging-mutator:   
 
	Mutator Log Functions
	=====================
	
	You can create different write function to change the format of log messages and 
    control where the logs are written. The logger has functions for formatting, writing, 
    and publishing log messages that can be provided by a Mojito application. The function 
    names are defined by users. For example, you could name the log formatter either 
    ``formatLogs`` or ``log_formatter``.

    .. _logging_mutator-custom_formatter:   
	
	Custom Log Formatter
	--------------------
	
	The log formatter function accepts the log message, the log level, a string 
    identifying the source of the log (usually the YUI module name emitting the log), a 
    timestamp, and the complete ``logOptions`` object. The function returns a string, 
    which is passed to the log writer.
	
	.. code-block:: javascript
	
	   function {log_formatter_name}(message, logLevel, source, timestamp, logOptions) {
		 return "formatted message";
	   }
	
    .. _logging_mutator-custom_writer:  

	Custom Log Writer
	-----------------
	
	The log writer function accepts a string and does something with it. You can provide 
    a function that does whatever you want with the log string. The default log writer 
    calls ``console.log``.
	
	.. code-block:: javascript
	
	   function {log_writer_name}(logMessage[s]) {}
	
	.. note:: Your log writer function must be able to handle a string or an array of 
              strings. If you have set buffered logging, it may be sent an array of 
              formatted log messages.

    .. _logging_mutator-custom_pub:  
	
	Custom Log Publisher
	--------------------
	
	If a log publisher function is provided, it is expected to format and write logs. 
    Thus, a log publisher function takes the place of the log formatter and the log writer 
    functions and accepts the same parameters as the log formatter function.
	
	.. code-block:: javascript
	
	   function {log_publisher_name}(message, logLevel, source, timestamp, logOptions) {

    .. _logging_mutator-custom_client:  
	
	Custom Log Functions on the Client
	----------------------------------
	
	To provide custom log function on the client, you add the log function to a JavaScript 
    asset that your application will load.
	
	In the example JavaScript asset below, the log function ``formatter`` is first defined 
    and then set as the log formatter function.
	
	.. code-block:: javascript
	
	   function formatter(msg, lvl, src, ts, opts) {
		 return "LOG MSG: " + msg.toLowerCase() + " -[" + lvl.toUpperCase() + "]- (" + ts + ")";
	   }
	   YUI._mojito.logger.set('formatter', formatter);
	
	Using the ``formatter`` function above, the log messages will have the following format:
	
	``>LOG MSG: dispatcher loaded and waiting to rock! -[INFO]- (1305666208939)``

    .. _logging_mutator-custom_server:  
	
	Custom Log Functions on the Server
	----------------------------------
	
	On the server, you must add log mutator functions to ``server.js``, so that Mojito 
    will set them as the log functions before starting the server.
	
	In this example ``server.js``, ``writeLog`` writes logs to the file system.
	
	.. code-block:: javascript
	
	   var mojito = require('mojito'), fs = require('fs'), logPath = "/tmp/mojitolog.txt";
	   function writeLog(msg) {
		 fs.writeFile(logPath, msg, 'utf-8');
	   }
	   // You can access log formatter, writer, or
	   // publisher for the server here.
	   mojito.setLogWriter(function(logMessage) {
		 writeLog(logMessage + '\n');
	   });
	   module.exports = mojito.createServer();

.. _mojito_logging-buffering:

Log Buffering
=============

To avoid performance issues caused by logging, you can enable buffering, which will 
configure Mojito to cache all logs in memory. You can force Mojito to flush the logs with 
the ``Y.log`` function or setting the maximum buffer size. The following sections show you 
how to enable buffering and force Mojito to flush the cached logs.

.. _logging_buffering-enable:

Enable Buffering
----------------

To configure Mojito to buffer your logs,  set the ``buffer`` property to ``true`` in the 
``yui.config`` object as shown in the example ``application.json`` below.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "yui": {
         "config": {
           "buffer": true
         }
       },
       ...
     }
   ]

.. _logging_buffering-flush:

Flush Cached Logs
-----------------

Mojito provides you with two ways to forcefully flush cached logs. When you have buffering 
enabled, you can force Mojito to flush the cached logs with ``Y.log(({flush: true})``. 
You can also set the maximum buffer size, so that Mojito will flush cached logs after the 
cache has reached the maximum buffer size.

In the example ``application.json`` below, the maximum buffer size is set to be 4096 bytes. 
Once the log cache reaches this size, the logs are then flushed. The default size of the 
log cache is 1024 bytes.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "yui": {
         "config": {
           "buffer": true,
           "maxBufferSize": 4096
         }
       },
       ...
     }
   ]

.. _mojito_logging-custom:

Customizing Logging for Client/Server
=====================================

.. _logging_custom-rt_context:

Using Runtime Contexts
----------------------
TBD: Need more info.

To customize this for client or server, you can use the runtime context. 

.. _logging_custom-include_exclude_src:

Including and Excluding Sources From Logging
--------------------------------------------

Also, you can 
now use logExclude and logInclude. More information at 
http://yuilibrary.com/yui/docs/api/classes/config.html.

.. code-block:: javascript

   "yui": {
     "config": {
      "logLevel": "INFO",
      "buffer": true,
      "logExclude": <some_source>
     }
   }

