==================
Mojito Conventions
==================

File Names and Locations
========================

Mojits
------

Location
########

The default location is ``{application_name}/mojits``, but you can specify the location of mojits
with the application configurations ``mojitDirs`` and ``mojitsDirs``.

Controllers
-----------

Location
########

``mojits/{mojit_name}/``

Name
####

The default controller file is ``controller.server.js``, but you can use the affinity
to determing where the controller will be executed and define different
versions of the controller with the ``selector`` property in ``application.json``.
Thus, the syntax for controllers is as follows: ``controller.{affinity}.{selector}.js``,
where ``{affinity}}`` can be ``server``, ``common``, or ``client``, and ``{selector}}``
can either be omitted or defined by the ``selector`` property in ``application.json``.

Models
------

Location
########

``mojits/{mojit_name}/models/``

Name
####

The default model is ``model.server.js``. The syntax for the model is ``{model_name}.{affinity}.js``,
where ``{model_name}`` is a user-defined string.

Templates (Views)
-----------------

Location
########

``mojits/{mojit_name}/views/``

Name
####

The template file when you create a Mojito application is ``index.hb.html``. The template file names
have the the following syntax: ``{action}.{selector}.{view_engine}.html``, where ``{action}`` is the
controller function being called or view specified, ``{selector}`` is defined by the ``{selector}`` property
in ``application.json``, and ``{view_engine}`` being ``hb`` for Handlebars by default or any view engine
implemented by the application developer.

Binders
-------

Location
########

``mojits/{mojit_name}/binders/``

Name
####

When you use a frame mojit, such as ``HTMLFrameMojit``, and configure your application to deploy code
to the client by setting the application configuration ``deploy`` to ``true``, Mojito will send the
binder file  ``{action}.js`` with the response body, where ``{action}`` is the controller action 
mapped to the request URL.


YUI Modules
-----------

This section is for custom YUI modules that developers want to include in the application code.

Location
########

``{application_name}/yui_modules``

Name
####

For custom YUI modules that you want to be part of your application, you should 

Tests
-----

Location
########

- ``mojits/{mojit_name}/tests``
- ``mojits/{mojit_name}/tests/models``

Name
####

Test files use the following naming convention:

- ``controller.server-tests.js``
- ``{model_name}.{affinity}-tests.js``

.. note:: Mojito will run any JavaScript tests in the ``tests`` directory, but we suggest
          you use the naming convention shown above.

Assets
------

Assets are resources that are required on the clients. These resources are primarily 
CSS but can also be JavaScript that is ancillary to and not a core component of the Mojito 
application. 

Location
########

Assets are available at the application or mojit levels, thus, the location of the 
assets varies:

- ``{application_name}/assets/`` (application-level assets)
- ``mojits/{mojit_name}/assets/`` (mojit-level assets)

For CSS assets, the convention is to create a ``css`` directory under the ``assets``
directory. For JavaScript assets, the convention is to create a ``js`` directory
under the ``assets`` directory.

Name
####

There are no naming conventions for CSS or JavaScript assets in Mojito.

Custom Addons
-------------


Location
########

- ``{app_dir}/addons/ac/``
- ``{mojit_dir}/addons/ac/``

Name
####

The naming convention for custom addons is the following, where ``{addon_namespace}``
is the string appended to the namespace defined in the addon, such as 
``Y.namespace.addons.ac.{addon_namespace}``.

``{addon_namespace}.{affinity}.js``

Configuration
-------------

Application
###########



Mojit
#####

Mojits
======

Definitions
-----------

Mojit definitions are the files and code that constitute the mojit and are
created with the command ``mojito create mojit <mojit_name>``. The naming convention
for mojit definitions is to use an upper camel-case string and keep the name as short
as possible, such as ``Flickr`` or ``FlickrPhotos``. Think of the mojit definition as a
class name and the instance as an instantiation of the mojit.


Instances
---------

The instance is defined in the application configuration file ``application.json`` 
and then created by Mojito when the application is started. The naming convention of
mojit instances is to use a lower-case string, much as you would use a lower-case 
string to name an object in JavaScript.

Mojit MVC
---------

Your models, controllers, and views in Mojito applications are in your mojit directories
in the following location:

- ``mojits/{mojit_name}/models/``
- ``mojits/{mojit_name}/``
- ``mojits/{mojit_name}/views/``


Modules
=======

The module name is the string that you use to register mojit code as custom YUI modules.
As custom modules, you register the module names with ``YUI.add``.

Controllers
-----------

The convention is for mojit controllers to register the mojit definition name as the 
module name. For example, the mojit ``Flickr`` would register the module name 
``Flickr`` with ``YUI.add``: ``YUI.add('Flickr', function(Y, NAME) {``

Models
------

The naming of modules for mojit models has the following convention but is much looser in 
its application: ``{mojit_name}Model``

Binders
-------

The naming of modules for mojit binders has the following convention: 
``{mojit_name}Binder{Action}``

Custom Addons
-------------

The naming convention for modules for custom addons is the following, 
where ``{addon_namespace}`` is the string appended to the namespace defined in the 
addon, such as ``Y.namespace.addons.ac.{addon_namespace}``.

``addon-ac-{addon_namespace}``

Requiring/Accessing Modules
---------------------------

Built-In Addons
###############

To access a built-in addon from a controller, you add the string 
``mojito-addon-{addon}`` to the ``requires`` array, where ``{addon}``
could any of the following:

- ``data`` - ``Data`` addon for sharing data
- ``models`` - ``Models`` addon for accessing models
- ``cookies`` - ``Cookie`` addon for getting/setting cookies
- ``helpers`` - ``Helpers`` addon for registering Handlebars helpers
- ``assets`` - ``Assets`` addon for managing assets
- ``config`` - ``Config`` addon for handling configurations
- ``params`` - ``Params`` addon for managing parameters
- ``composite`` - ``Composite`` addon to execute child mojits
- ``intl`` - ``Intl`` addon for localization

Custom Addons
#############

To use an addon that you created, you require the registered addon name in the 
``requires`` array of your controller.

Models
######

To require Model modules in the controller, you use the ``get`` method of the
 ``Models`` addon. You pass the registered module name to the ``get`` method as shown
in this example:

.. code-block:: javascript

   ...
     ...
       index: function(ac) {
         ac.models.get('FlickrModel').getData(function(err, data) {
     ...
   ...
  }, '0.0.1', {requires: ['mojito', 'mojito-models-addon']});

  

Methods/Functions
=================

The naming convention for methods and functions is to strings in lower-case camel.
Although the term function is often used generically for both methods and functions,
in Mojito code, you can consider functions formally as function literals that 
are generally defined outside of the ``Y.namespace()`` block in modules. Methods in 
Mojito code, on the other hand, are usually named function expressions and are defined
within the ``Y.namespace()`` block.


Configuration
=============

Application
-----------

Contexts
########

The application configuration file ``application.json`` allows you to map configurations
to different runtime environments. The contexts are defined in the configuration 
object by the ``setting`` property. In the example snippet below, different mojit instances
are created for the developer and production environments:

.. code-block:: javascript

   {
     "settings": [ "environment:development" ],
     "specs": {
       "test": {
         "type": "TestMojit"
       }
     }
   },
   {
     "settings": [ "environment:production" ],
     "specs": {
       "test": {
         "type": "ProductionMojit"
       }
     }
   },
        


Development Configurations
##########################

We recommend that you add special logging and cache configurations for the 
``environment:development``, so that all log messages are displayed and assets
are not cached. The ``environment:production`` context, in contrast, does not
show any error messages and allows caching.

.. code-block:: javascript

   {
     "settings": [ "environment:development" ],
     "staticHandling": {
        "forceUpdate": true
     },
     "yui":{
       "config": {
         "debug": true,
         "logLevel": "debug"
       }
     }
   },
   {
     "settings": [ "environment:production" ],
     "staticHandling": {
        "forceUpdate": false
     },
     "yui":{
       "config": {
            "debug": false,
            "logLevel": "none"
       }
     }
   },
       
 

Mojit Instance Configuration
############################

Routing
-------

Mojit
-----

Assets
======


Using Modules
=============

Addons
------

To use the built-in modules, you include the module in the ``requires`` array of 





Tests
=====

Unit
----

Functional
----------






