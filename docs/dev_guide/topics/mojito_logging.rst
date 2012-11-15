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

- ``logLevel:`` ``DEBUG`` - log level filter.
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

.. _logging_config-prod:

Recommended Logging Configuration for Production
------------------------------------------------

For production, we recommend that you use the ``environment:production``
context with the log configuration shown below:

.. code-block:: javascript

   [
     {
       "settings": [ "environment:production" ],
       "yui": {
         "config": {
           "debug": false,
           "logLevel": "none"
         }
       },
       ...
     }
   ]

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

Customizing Logging
===================

.. _logging_custom-rt_context:

Client and Server Logging
-------------------------

You can use the ``runtime:client`` and ``runtime:server`` contexts to create different logging
settings for the client and server.

In the ``application.json`` file, create two configuration
objects that use the ``runtime:client`` and ``runtime:server``
contexts as shown below. 

.. code-block:: javascript

   [
     {
       "settings": [ "runtime:client" ],
     },
     {
       "settings": [ "runtime:server" ],
     }
   ]

For each context, configure your logging with
the ``yui.config`` object.

.. code-block:: javascript

   [
     {
       "settings": [ "runtime:client" ],
       ...
	   "yui": {
         "config": {
           "logLevel": "WARN"
         }
       }
     },
     {
       "settings": [ "runtime:server" ],
       ...
	   "yui": {
         "config": {
           "logLevel": "INFO"
         }
       }
     }
   ]


.. _logging_custom-include_exclude_src:

Including and Excluding Modules From Logging
--------------------------------------------

You can use the ``logExclude`` and ``logInclude`` properties
of the ``yui.config`` object to include or exclude logging
from YUI modules of your application. 

The configuration below excludes logging from the YUI module 
``FinanceModel``:

.. code-block:: javascript

   "yui": {
     "config": {
      "logLevel": "INFO",
      "buffer": true,
      "logExclude": { "FinanceModel": true } 
     }
   }

