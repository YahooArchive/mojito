

============================
Using Context Configurations
============================

Introduction
############

The Mojito framework allows you to define sets of configurations for different environments, languages, and devices. Your applications can either 
statically apply configurations when the application is started or dynamically apply configurations based on incoming HTTP requests. In both static and 
dynamic cases, Mojito determines which configurations to apply by a string consisting of key-value pairs known as the *context*. In the case of applying 
configurations per request, Mojito looks for the context in the HTTP headers or the query string. If no context is found, Mojito uses 
the :ref:`context_config_exs-defaults_json`.


Why Use Context Configurations?
###############################

Context configurations make it easier to develop applications by allowing developers to create sets of configurations associated to environments. 
Developers can experiment or make modifications to configurations mapped to a testing environment context without affecting the application running 
with the default configurations. Context configurations also make it easier to customize content for users. Applications can dynamically apply language 
and device configurations by determining the user's language preferences and the device making the HTTP request. Mojito provides default contexts that 
you can define configurations for, but you can also `create custom contexts <#creating-custom-contexts>`_ to meet your application's needs.

Flow of Using Context Configurations
####################################

#. **Create context configurations:**

   Define context configurations in ``application.json``, ``routes.json``, and default context configurations for your mojits in the ``defaults.json`` file in your mojit directory.

#. **Start application:**

   - Use the default configurations by not specifying a base context: ``$ mojito start``
   - Specify the base context with the ``--context`` option. Mojito will apply the configurations mapped to the base context. For example: ``$ mojito start --context "environment:test"``

#. **Receive HTTP requests:**

   *Request new context:*
      Mojito will look at the HTTP headers for language and device contexts and the query string parameters for any of the default contexts. 
      Contexts found in the request are referred to as request contexts. Mojito will then merge the default configurations or the 
      configurations of the base context with the configurations of the request context. The configurations of the request context override 
      default configurations or those of the base context.
   *Change configurations:*
      The application can dynamically change configurations by having a parent mojit execute a child with new configuration values.

Contexts
########

The context is a string consisting of key-value pairs that map to a set of configurations. Mojito provides default contexts for environments, devices, and languages. 
If none of the default contexts meet your needs, you can create :ref:`context_configs-custom`.

Syntax
======

The context has the following syntax :

``"key1:value1[,key2:value2]"``

.. _contexts-defaults:

Default Contexts
================

The following lists the contexts that are defined by Mojito. You can define configurations for these default contexts. You can combine multiple contexts to 
form a compound context as well. For example, if you wanted a context to map to configurations for Android devices in a testing environment, you could use the 
following compound context: ``"environment:test,device:android"``

- ``environment:development``
- ``environment:production``
- ``environment:dev``
- ``environment:test``
- ``environment:stage``
- ``environment:prod``
- ``device:android``
- ``device:blackberry``
- ``device:iemobile``
- ``device:iphone``
- ``device:ipad``
- ``device:kindle``
- ``device:opera-mini``
- ``device:palm``
- ``lang:{BCP 47 language tag}``

You can view the supported BCP 47 language tags and default contexts in the `dimensions.json <https://github.com/yahoo/mojito/blob/develop/source/lib/dimensions.json>`_ file of Mojito.

Configuration Precedence
========================

Mojito evaluates configurations in the following order:

#. default context configurations specified in the configuration object with the ``setting`` array with the "master" string.
#. configurations associated with a context specified on the command line with the ``--context`` option.
#. configurations associated with a context set using the query string, HTTP headers, or through the execution of a child mojit with configuration information.

Defining Configurations for Contexts
####################################

Configurations for contexts are defined in the application configuration file ``application.json``. Routing configurations for contexts are defined in the 
routing configuration file ``routes.json``. Default configurations are defined in the ``defaults.json`` file of a mojit. All configurations are merged when 
an application starts. The configuration values in ``application.json`` override those 
in ``defaults.json``.

Configuration Objects
=====================

The ``application.json`` and ``routes.json`` files in the application directory and the ``defaults.json`` file in a mojit's directory consist of an array of configuration objects. 
The configuration object has a ``settings`` array that specifies the context. The configuration objects in ``application.json`` also have a ``specs`` object 
containing mojit instances, which may also have a ``config`` object that has data in the form of key-value pairs. The configuration objects in ``defaults.json`` do not 
have a ``specs`` object because they do not define mojits, but do have a ``config`` object for storing key-value pairs. The ``routes.json`` file specifies routing 
configuration such as the path, HTTP methods, actions, and routing parameters, but does not contain a ``specs`` or a ``config`` object.

setting
-------

The ``settings`` array specifies the context or the default ("master") that is then mapped to configurations.

Default Configurations
~~~~~~~~~~~~~~~~~~~~~~

Default configurations are used when no context is given. These configurations are found in the object where the settings array has the string "master" as seen below.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         ...
       }
     },
     ...
   ]

Simple Context Configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The context is specified in the ``settings`` array of the configuration object.

.. code-block:: javascript

   [
     ...
     {
       "settings": [ "environment:development" ],
       "specs": {
        ...
       }
     },
     ...
   ]

Compound Context Configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Compound contexts are specified in the settings array as a series of contexts separated by commas as seen below.

.. code-block:: javascript

   [
     ...
     {
       "settings": [ "environment:development", "device:android" ],
       "specs": {
         ...
       }
     },
     ...
   ]
   
Routing Context Configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "master_route": {
         ...
       }
     },
     {
       "settings": [ "environment:development"],
       "dev_route" : {
         ...
       }
     }
   ]


specs
-----

The ``specs`` object contains the mojit instances associated with a context.

.. code-block:: javascript

   [
     ...
     {
       "settings": [ "environment:production" ],
       "specs": {
         "photos": {
           "type": "PhotoMojit"
         }
       }
     },
     ...
   ]

config
------

The ``config`` object stores configuration for a mojit that is mapped to the context.

.. code-block:: javascript

   [
     ...
     {
       "settings": ["device:iphone"],
       "specs": {
         "iphone": {
           "type": "iPhoneMojit",
           "config": {
             "viewport_width": 320
           }
         }
       }
     },
     ...
   ]

Examples
========

application.json
----------------

The configuration objects in ``application.json`` below define default configurations and three context configurations. The last context configuration contains 
two strings containing key-value pairs and is, thus, called a compound context configuration.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         "mainPage": {
           "type": "TestMojit"
           "config": {
             "env": "This is the default environment."
           }
         }
       }
     },
     {
       "settings": [ "environment:development" ],
       "specs": {
         "mainPage": {
           "type": "TestMojit",
           "config": {
             "env": "I am in the development environment."
           }
         }
       }
     },
     {
       "settings": [ "environment:production" ],
       "specs": {
         "mainPage": {
           "type": "TestMojit",
           "config": {
             "env": "I am in the production environment."
           }
         }
       }
     },
     {
       "settings": [ "environment:production", "device:kindle" ],
       "specs": {
         "mainPage": {
           "type": "TestMojit",
           "config": {
             "env": "I am in the production environment for Kindles."
           }
         }
       }
     },
   ]

.. _context_config_exs-defaults_json:

defaults.json
-------------

The configuration ``gamma`` in the example ``defaults.json`` below is mapped to contexts for languages.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "config": {
         "alpha" : "I am the first!",
         "beta" : "I am the second!",
         "gamma": "I am the third!"
       }
     },
     {
       "settings": [ "lang:de" ],
       "config": {
         "gamma": "I am (when lang=de is passed) the third!"
       }
     },
     {
       "settings": [ "lang:fr" ],
       "config": {
         "gamma": "defaults.json - (when lang=fr is passed) the third!"
       }
     }
   ]
   
routes.json
-----------

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "prod_route": {
         "verbs": ["get"],
         "path": "/",
         "call": "hello.index"
       }
     },
     {
       "settings": [ "environment:development"],
       "dev_route" : {
         "verbs": ["get"],
         "path" : "/testing",
         "call" : "dev_hello.index"
       }
     }
   ]


Applying Context Configurations
###############################

The configurations for a context can be applied statically or dynamically. The base context is used to statically apply configurations. The request context is used to 
dynamically apply configurations.

Base Context
============

The base context is specified with the ``--context`` option when you start an application. The following starts the application with the base context ``environment:production``:

``$ mojito start --context "environment:production"``

Request Contexts
================

Contexts that are dynamically invoked by HTTP requests are called request contexts. When Mojito receives an HTTP request that specifies a context, the configurations mapped 
to that context will be dynamically applied. The contexts can be specified in HTTP request as a parameter in the query string or in the HTTP header.

Request Headers
---------------

The contexts for languages can be requested using the HTTP header ``Accept-Language``. After starting an application with the context ``"environment:testing"``, you can 
dynamically apply the configurations for the context ``"environment:testing,lang:fr"`` by sending the HTTP header ``"Accept-Language: fr"``. In the same way, the contexts 
for devices can be requested using the HTTP header ``User-Agent``. The configurations for the context "device:android" could be requested with the 
HTTP header ``"User-Agent: Mozilla/5.0 (Linux; U; Android 2.3; en-us)"``.

Query String Parameters
-----------------------

The key and value pairs in the context are dynamically set by the query string using the standard syntax for query strings: ``?key1=value1,key2=value2``

For example, if an application is started with the base context ``"environment:testing"`` and you want to dynamically apply the context ``"environment:testing,device:iphone"``, you could append the following query string to the application URL: ``?device=iphone``

Merged Base and Request Contexts
================================

An application started with a base context can apply configurations for request contexts. Mojito will merge the configurations for both the base and request contexts. 
The configurations for request contexts override those of the base context.

Dynamically Changing Configurations
###################################

You may dynamically change the configurations for any context by having a parent mojit execute a child mojit with new configurations. This is different than getting 
different configurations by requesting a new context or specifying a different base context. Regardless of the context being used, you can use the same context and change 
the configurations by executing a child mojit with new configurations. The parent mojit uses the ``execute`` method of the 
`Composite addon <../../api/classes/Composite.common.html>`_ to execute the child mojit. 
Let's look at an example to see how it works.

In the example controller below, if the ``child`` parameter is found in the routing, query string, or request body, a child instance with its own configuration is executed, allowing the application to add new or change configurations of the current context.

.. code-block:: javascript

   YUI.add('TestMojit', function(Y) {
     Y.mojito.controller = {
       index: function(ac) {
         var cfg = {
           children: {
             "one": {
               "type": "Child",
               "action": "index",
               "config": {
                 "alpha": "Creating a new 'alpha' key or replacing the value of the alpha key mapped to the context being used. The context, however, does not change."
               }
             }
           }
         };
         var child = ac.params.getFromMerged('child');
         if(child){
           ac.composite.execute(cfg, function (data,meta){
             ac.done(data["one"]);
           });
         }else{
           ac.done(
             'config key "alpha": ' + ac.config.get('alpha', '[alpha not found]')
           );
         }
       }
     };
   }, '0.0.1', {requires: ['mojito']});


.. _context_configs-custom:

Creating Custom Contexts
########################

The Mojito framework defines default contexts that developers can map configurations to. These default contexts are defined in the ``dimensions.json`` file found in 
the Mojito source code. Developers can create an application-level ``dimensions.json`` to define custom contexts that can be mapped to configurations as well. 
Defining and applying configurations for custom contexts is done in the same way as for default contexts.

Who Should Create Custom Contexts?
==================================

Developers who create applications that require a degree of personalization that extends beyond language and device would be good candidates to create custom contexts. 
Before beginning to create your own ``dimensions.json`` file, you should review the :ref:`contexts-defaults` to make sure that you truly need custom contexts.

Dimensions File
===============

The key-value pairs of the context are defined in the ``dimensions.json`` file in the application directory. Once contexts are defined in the ``dimensions.file``, 
you can then map configurations to those contexts. If your application has configurations for a context that has not been defined by Mojito or at the application 
level in ``dimensions.json``, an error will prevent you from starting the application.

Syntax for JavaScript Object
----------------------------

In the ``dimension.json`` file, the ``dimensions`` array contains JavaScript objects that define the contexts. The keys of the context are the names of the objects, 
and the values are the object's properties as seen below.

.. code-block:: javascript

   [
     {
       "dimensions":[
         {
           "region": {
           "us": null,
           "jp": null,
           "cn": null
         },
         ...
        ]
     }
   }

Example dimensions.js
---------------------

Based on the example ``dimensions.json`` below, the following are valid contexts:

- ``"account_type:basic"``
- ``"account_type:premium"``
- ``"account_type:basic,region:us"``
- ``"account_type:premium,region:fr"``

.. code-block:: javascript

   [
     {
       "dimensions": [
         {
           "account_type": {
             "basic": null,
             "premium": null
         },
         {
           "region":{
             "us": null,
             "gb": null,
             "fr": null
         }
     }
   ]


