=======
Logging
=======

Mojito has its own logging system. When you call ``Y.log`` from within your mojits, your 
log messages are intercepted and processed by Mojito. You can set logging levels
to control the degree of detail in your log reports. You can also configure Mojito to 
enable log buffering, so performance during crucial runtime periods is not adversely 
affected.

.. _mojito_logging-levels:

Log Levels
==========

Mojito has the following six log levels:

- ``debug``
- ``info``
- ``warn``
- ``error``
- ``mojito``
- ``none``

All of them should be familiar except the last, which are framework-level messages that 
indicate that an important framework event is occurring (one that users might want to 
track).

Setting a log level of ``warn`` will filter out all ``debug`` and ``info`` messages, while 
``warn``, ``error``, and ``mojito`` log messages will be processed. To see all 
log messages, set the log level to ``debug``.

.. _mojito_logging-defaults:

Log Defaults
============

The server and client log settings have the following default values:

- ``logLevel:`` ``DEBUG`` - log level filter.

.. _mojito_logging-config:

Log Configuration
=================

All the values above are configurable through the 
`yui.config object <../intro/mojito_configuring.html#yui_config>`_ in the ``application.json`` 
file. In the example ``application.json`` below, the ``yui.config`` object 
overrides the default for ``logLevel``.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "yui": {
         "config": {
           "logLevel": "error",
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
           "logLevel": "warn"
         }
       }
     },
     {
       "settings": [ "runtime:server" ],
       ...
	   "yui": {
         "config": {
           "logLevel": "info"
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
      "logExclude": { "FinanceModel": true } 
     }
   }

