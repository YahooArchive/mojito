==================
Mojito Conventions
==================

Overview
========

This chapter is provides an overview of the general conventions and practices when
developing Mojito applications. Think of this chapter as a guideline or a cheat sheet 
to help you remember Mojito-specific conventions. If you don't find the information 
that you're looking for here, see the chapter dedicated to the topic you're interested in, 
such as `Mojits <mojito_mojits.html>`_ or `Configuring Mojito <mojito_configuring.html>`_.


MVC Structure
-------------

Your models, controllers, and views in Mojito applications are in your mojit directories
in the following location:

- ``mojits/{mojit_name}/models/``
- ``mojits/{mojit_name}/``
- ``mojits/{mojit_name}/views/``

Configuration
-------------

Configurations are found in either the ``.json`` or ``.yaml`` files in the application
directory or under mojit directories. The configurations are composed of JSON or YAML, which
is a superset of JSON. 


Application
###########

The configurations files found directly under the application directory are considered 
application-level or shared configurations that all mojits can access.  The application 
configuration files are ``application.json`` and ``routes.json`` or the YAML versions 
``application.yaml`` and ``routes.yaml``. 

The ``application.json`` file stores general configuration for the application as well
as defines mojit instance configurations, which are covered in the `Mojits <>`_ section.
The ``routes.json`` file is for configuring routing paths so that a path is mapped to
the execution of a mojit action. 

We're only going to cover the use of contexts, suggested settings for development
and production, and routing. See `Configuring Mojito <>`_ for descriptions and possible 
values for all the configurations as well as examples for configuring routing and more. 

Contexts
********

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
        

Development/Production Configurations
*************************************

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
       
Routing
#######

The names of routing paths should be short, descriptive, and in lowercase. The routes
are defined by an object that associates a path with an action of a mojit instance.

.. code-block:: javascript

   "root": {
     "path": "/",
     "call": "frame.index"
   }


Modules
-------

Mojito code is organized into files that are custom YUI modules. In the YUI module, 
you use ``YUI.add`` to register a string as the name of the custom YUI modules. See
the `Mojits section <>`_ for more module information for controllers, models, binders, and
tests.

Tests
-----

Unit
####

Unit tests are located in the mojits and are run with the Mojito command-line utility. 
Mojito allows you to write server-side unit tests for the controller and model.
See the `Mojits: Tests <>`_ below for more information.

Functional 
##########

Mojito does not come with a functional testing suite, but we suggest that you use 
the npm module Arrow for writing and running functional tests. Arrow is a testing framework 
that fuses together JavaScript, Node.js, PhantomJS, and Selenium. 

Mojito does not have any formal conventions for using Arrow. We recommend
that you read the `Arrow documentation <>`_ and the wiki 
`Mojito Framework's Unit and Functional Tests <https://github.com/yahoo/mojito/wiki/Mojito-Framework's-Unit-and-Functional-Tests>`_
to see some examples.


Mojits
======

Mojit Instances
---------------

The instance is defined in the application configuration file ``application.json`` 
and then created by Mojito when the application is started. The naming convention of
mojit instances is to use a lower-case string, much as you would use a lower-case 
string to name an object in JavaScript.

Configuration
#############

Mojits have instance configuration, default configuration, and definition files.
The instance configuration is specified in the ``config`` object of the mojit instance
in ``application.json`` and is generally information that is important to the execution
of mojit instance. The default configuration is found in ``defaults.json`` in the mojit
directory and is used to store default instance configuration values in the ``config``
object. For general data, mojits should use the ``definition.json`` file to store key-value 
pairs not used to determine what action is executed or template is rendered.


Mojit Definitions
-----------------

Mojit definitions are the files and code that constitute the mojit and are
created with the command ``mojito create mojit <mojit_name>``. 

Location
########

The default location for mojits is in ``{application_name}/mojits``, but you can specify 
the location of mojits with the application configurations ``mojitDirs`` and ``mojitsDirs``.

Naming
######

The naming convention for mojit definitions is to use an upper camel-case string and keep 
the name as short as possible, such as ``Flickr`` or ``FlickrPhotos``. Think of the mojit 
definition as a class name and the instance as an instantiation of the mojit.

Controllers
###########

Location
********

``mojits/{mojit_name}/``

Naming
******

The default controller file is ``controller.server.js``, but you can use the affinity
to determining where the controller will be executed and define different
versions of the controller with the ``selector`` property in ``application.json``.

Thus, the syntax for controllers is as follows: ``controller.{affinity}.{selector}.js``,
where ``{affinity}}`` can be ``server``, ``common``, or ``client``, and ``{selector}}``
can either be omitted or defined by the ``selector`` property in ``application.json``.

YUI Module Names
****************

The convention is for mojit controllers to register the mojit definition name as the 
module name. For example, the mojit ``Flickr`` would register the module name 
``Flickr`` with ``YUI.add``: ``YUI.add('Flickr', function(Y, NAME) {``

Models
######

Location
********

``mojits/{mojit_name}/models/``

Naming
******

The default model is ``model.server.js``. The syntax for the model is ``{model_name}.{affinity}.js``,
where ``{model_name}`` is a user-defined string.

YUI Module Names
****************

The naming of modules for mojit models has the following convention but is much looser in 
its application: ``{mojit_name}Model``

Using Models
************

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

Templates (Views)
#################

Location
********

``mojits/{mojit_name}/views/``

Naming
******

The template file when you create a Mojito application is ``index.hb.html``. The template file names
have the the following syntax: ``{action}.{selector}.{view_engine}.html``, where ``{action}`` is the
controller function being called or view specified, ``{selector}`` is defined by the ``{selector}`` property
in ``application.json``, and ``{view_engine}`` being ``hb`` for Handlebars by default or any view engine
implemented by the application developer.

Binders
#######

Location
********

``mojits/{mojit_name}/binders/``

Naming
******

When you use a frame mojit, such as ``HTMLFrameMojit``, and configure your application to deploy code
to the client by setting the application configuration ``deploy`` to ``true``, Mojito will send the
binder file  ``{action}.js`` with the response body, where ``{action}`` is the controller action 
mapped to the request URL.

YUI Module Names
****************

The naming of modules for mojit binders has the following convention: 
``{mojit_name}Binder{Action}``

Tests
-----

Location
########

- ``mojits/{mojit_name}/tests``
- ``mojits/{mojit_name}/tests/models``

Naming
######

Test files use the following naming convention:

- ``controller.server-tests.js``
- ``{model_name}.{affinity}-tests.js``

.. note:: Mojito will run any JavaScript tests in the ``tests`` directory, but we suggest
          you use the naming convention shown above.


YUI Modules
===========

This section is for custom YUI modules that developers want to include in the application code.

Location
---------

``{application_name}/yui_modules``

Name
----

``{module_name}.{affinity}.js``


Addons
======

Addons are  extensions that provide functionality that lives both on the server 
and/or client. Each addon provides additional functions through a namespace that is 
attached directly to the ``ActionContext`` object and is available when required in a 
controller.

Built-In Addons
---------------

Mojito comes with built-in addons that are accessible through the ``ActionContext`` 
object. To access a built-in addon from a controller, you add the string 
``mojito-{addon}-addon`` to the ``requires`` array, where ``{addon}``
could be any of the following:

- ``assets`` - ``Assets`` addon for managing assets
- ``config`` - ``Config`` addon for handling configurations
- ``composite`` - ``Composite`` addon to execute child mojits
- ``cookies`` - ``Cookie`` addon for getting/setting cookies
- ``data`` - ``Data`` addon for sharing data
- ``helpers`` - ``Helpers`` addon for registering Handlebars helpers
- ``http`` - ``Http`` addon for getting and setting HTTP headers, request information.
- ``intl`` - ``Intl`` addon for localization
- ``meta`` - ``Meta`` addon for getting and merging meta data of child mojits.
- ``models`` - ``Models`` addon for accessing models
- ``params`` - ``Params`` addon for managing parameters
- ``partial`` - ``Partials`` addon for rendering partials. 
- ``url`` - ``Url`` addon for creating and finding URLs.


.. note:: The list of built-in ``ActionContext`` addons above is not complete. Mojito also
          has **Resource Store** (``rs``) and **View Engine** (``view-engine``) addons.
          See the `addons <https://github.com/yahoo/mojito/tree/develop/lib/app/addons>`_
          directory in the Mojito source code and the `Mojito API <http://developer.yahoo.com/cocktails/mojito/api/>`_
          documentation for more information.

Custom Addons
-------------

You can also create your own addons that you can include in controllers and then
access through the ``ActionContext`` object just like the built-in addons.

Location
########

- ``{app_dir}/addons/ac/``
- ``{mojit_dir}/addons/ac/``

Naming
######

The naming convention for custom addons is the following, where ``{addon_namespace}``
is the string appended to the namespace defined in the addon, such as 
``Y.namespace.addons.ac.{addon_namespace}``.

``{addon_namespace}.{affinity}.js``


Module Names
############

The naming convention for modules for custom addons is the following, 
where ``{addon_namespace}`` is the string appended to the namespace defined in the 
addon, such as ``Y.namespace.addons.ac.{addon_namespace}``.

``addon-ac-{addon_namespace}``


Accessing Addons
----------------

To use an addon, you require the registered addon name in the 
``requires`` array of your controller.


Tests
-----

The module names for both controller and model unit tests using the following naming
convention: 

- ``{mojit_name}-tests`` - (controller unit tests)
- ``{mojit_name}Model-tests`` - (model unit tests)


Static Assets
=============

Assets are resources that are required on the clients. These resources are primarily 
CSS but can also be JavaScript that is ancillary to and not a core component of the Mojito 
application. 

The suggested method for including CSS and JS assets in applications is to include the
in the ``assets`` directory, specify the path to the assets in the ``assets``
property of ``application.json``, and then have the ``HTMLFrameMojit`` attach the assets
to the HTML skeleton. You can also just hard-code the path to the assets in your templates,
but this is not the recommended approach.

Location
--------

For application-level (or shared) assets, the recommended location 
would be the following directories: 

- ``{application_name}/assets/css/``
- ``{application_name}/assets/js/``

For mojit-level assets, the recommended location is the following:

- ``{mojit_name}/assets/css/``
- ``{mojit_name}/assets/js/``

Path
----
Mojito registers a path to the assets based on a prefix, a source path, and 
the relative path to the assets. The *prefix* is the basename directory of 
the static URL. The default value for the prefix is ``/static/``,
but you can define the prefix with the ``staticHandling.prefix`` property in ``application.json``.

The *source path* for assets would either be the application or the mojit depending on the 
level of the resource. The *relative path* is the path relative to the source path, which
in the case of assets would be either ``/assets/css/`` or ``/assets/js/``.

Thus, the default path to assets would have the following syntax: ``/{prefix}/{source_path}/{relative_path}``
For example, the default path to the application-level CSS asset ``index.css`` for the
application ``NewsAggregator`` would be ``/static/NewsAggregator/assets/css/index.css``.


