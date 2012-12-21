==========================
Configuring YUI in Mojito
=========================

.. _yui_config-intro:

Overview
========

Mojito allows you to configure the YUI seed file and use YUI groups for dynamically
loading modules in applications. By customizing YUI configuration in Mojito,
you have finer grain control over the modules included in the seed 
and the combo handler used for dynamically loading YUI modules. Developers
can also just use Mojito's default YUI configurations, which are optimized
for improved performance.

.. _yui_config_intro-benefits:

Benefits of Customizing YUI Configuration
----------------------------------------- 

Developers can customize YUI configuration in Mojito applications 
to do the following:

- select which YUI modules are included in the YUI seed file
- configure the combo handler to use a CDN
- optimize performance for environments that may have latency issues
  or have limited CPU power
- limit the loading of certain YUI modules for specific languages


.. _yui_config-seed:

YUI Seed File
=============

.. _seed-yui:

Seed File in YUI Applications
-----------------------------

To use YUI in Web pages, you include a small JavaScript file called the 
YUI seed file. The YUI seed file allows you to load other YUI components on your page. 
The seed file is added to your Web page by with following ``<script>`` tag.

``<script src="http://yui.yahooapis.com/3.8.0/build/yui/yui-min.js"></script>``

From the URL to the seed file, the YUI library can infer the version of the library that 
should be used, the filter that you want to use (min, debug or raw), and the CDN that is 
serving the library. 

.. _seed-mojito:

Seed File in Mojito Applications
--------------------------------

In Mojito applications, the YUI seed is configured in ``application.json`` rather than 
including a ``<script>`` tag in templates. Thus, the information inferred from 
the URL to the YUI seed file in YUI applications is instead provided 
in the ``yui.config.seed`` object of ``application.json`` in Mojito applications.
We will look at ``yui.config.seed`` in `Configuring the Seed File <>`_.

Mojito uses configuration for the YUI seed because of the following reasons:

- The YUI library is bundled with the application using npm, so loading
  modules is done differently.
- Mojito applications may run as mobile applications that have connectivity
  issues preventing access to the YUI seed file.
- When applications are started, new YUI modules, part of the Mojito code, and part of the 
  application code are loaded in the same way as the YUI Core modules, so
  it is difficult to simply include the YUI seed file in a template.

.. _seed-default:

Mojito's Default Seed File
##########################

Mojito creates a default configuration for the YUI seed, so most users do not 
need to configure the YUI seed as the default configuration is sufficient.
Developers who want finer grain control over the loader for performance 
optimization should consider customizing the configuration for the YUI seed.

.. _seed-configure:

Configuration of the Mojito Seed File
=====================================

Starting from Mojito v0.5.0, developers can configure the YUI seed 
using the ``yui.config.seed`` object in ``application.json`` file. 

In the example ``application.json`` below, the YUI seed includes
the modules specified in the ``seed`` object. Besides the YUI modules
``loader-app`` and ``loader-app-base_{BCP 47 lang tag}``, which we will discuss in 
:ref:`Synthetic Modules in Mojito <seed_configure-modules>`. The other modules are 
just YUI Core modules.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "yui": {
         "config": {
           "seed": [
             "yui-base",
             "loader-base",
             "loader-yui3",
             "loader-app",
             "loader-app-base_{BCP 47 lang tag}"
           ]
         }
       }
     }
   ]

.. _seed_configure-modules:

What Modules Should Be in the Seed?
-----------------------------------

When including modules as part of the seed, developers need to decide
which modules are critical and understand what modules are available for 
Mojito applications. In theory, all YUI modules that are part of Mojito core, YUI core, 
and your own application are available to be used as part of the seed. You 
can also add non-core YUI modules to be part of the seed, but we recommend  
that you don't unless you have a strong reason to do so because the seed file
should be as small as possible. 

In addition, Mojito generates a few more virtual files (in memory, not actual physical 
files) that we will call *synthetic* modules, which you can also include in the ``seed``
object. We will discuss synthetic modules and how to use them next.


.. _seed_configure-synthetic:

Synthetic Modules in Mojito
---------------------------

.. _synthetic_mods-what:

What Are Synthetic Modules?
###########################

When you run ``mojito start`` or use an alternative way to boot your application, 
the Mojito store analyzes the directory structure and dependencies to try to understand the 
structure and then make assumptions. From this analysis, the synthetic modules 
create application metadata that can be used by YUI Loader to load the application and 
Mojito modules on demand. Without this metadata, the application cannot function.

Synthetic modules are not physical files except in the case of hybrid applications, 
when synthetic modules are generated as files during the build process. If you need
to generate physical files for a CDN from the synthetic modules, you can 
use `Shaker <http://developer.yahoo.com/cocktails/shaker/>`_. 
For production, we recommend using Shaker, especially in the case that your mojits contain 
language resource bundles.

.. _synthetic_mods-base_resolved:

Base and Resolved Synthetic Modules
###################################

Synthetic modules can have *base* and *resolved* versions. The **base** synthetic
modules have the suffix ``-base``, and the **resolved** synthetic modules have the suffix
``-resolved``. 

In general, the base synthetic modules contain basic metadata that 
is consumed and processed recursively by the YUI Loader on the client
to generate the file(s) needed to be loaded when a particular module is used.

The resolved synthetic modules have the expanded metadata, so no 
process is needed to determine which file(s) need to be loaded when a 
particular module is used. 

The base synthetic module requires less memory than the resolved synthetic module,
but requires more CPU power to process because the YUI loader has to recursively
consume and process metadata. The resolved synthetic module, in contrast, requires 
more memory but less CPU power because the metadata is expanded.
See the `resolve <http://yuilibrary.com/yui/docs/api/classes/Loader.html#method_resolve>`_
method of the `Loader <http://yuilibrary.com/yui/docs/api/classes/Loader.html>`_
class in the YUI API documentation for more information.

When using resolved synthetic modules, your application is restricted to using 
YUI Core modules that are required in Mojito or application modules. 
For example, if the YUI Core modules ``autocomplete-list`` is not required by 
a binder, controller, module, or any other custom YUI module in your application, 
Mojito will assume that the ``autocomplete-list`` metadata is not really needed 
and will not include it in the resolved metadata to keep the size of the 
expanded metadata as small as possible. This is important if you have integration 
tests or functional tests that are meant to inject dynamic modules and dependencies, 
or if you have custom ``Y.use`` statements that are not controlled by Mojito.

.. _synthetic_mods-mult_langs:

Synthetic Modules for Multiple Languages
########################################

Your application can run in multiple languages, but you should not load all available 
language bundles in the client runtime for performance reasons. Instead, you can use 
synthetic modules to load modules based on the languages specified in the request 
information and the user preferences. Mojito will locate the corresponding synthetic 
module name based on the language context. 

.. _synthetic_mult_langs-syntax:

Syntax
******

``{yui_module}-{base|resolved}_{BCP 47 lang tag}``

For example, the US English form of the base synthetic module ``loader-app-base``
is ``loader-app-base_en-US``.

.. _synthetic_mult_langs-restriction:

Restrictions
************

Not all synthetic modules can be customized per language. 
Only **base** and **resolved** synthetic modules can have language versions. 
Also, the default synthetic modules, such as ``loader-app``,
always exists, so, if no language is specified, but many language resource bundles 
exist for a mojit, then the default synthetic module will load the metadata for all of 
the modules. If an application has multiple mojits each with dozens of language bundles,
the amount of metadata can be considerable, so be sure that
the synthetic modules have all the different language versions.

.. _synthetic_mods-create:

Creation of Synthetic Files
###########################

In terms of extending Mojito's functionality, if you create a Resource Store addon, you 
can create new synthetic modules, as well as control the seed generation by piping into 
``store.YUI.getAppSeedFiles`` method. Check the API documentation for more details on the 
signature of that method.

.. _seed_configure-optimize_perf:

Performance Optimization
------------------------

.. _optimize_perf-default:

Default Application Optimization
################################

In mobile and applications requiring high performance, relying on the YUI Loader to compute 
and resolve dependencies that are needed in a recursive way could drastically affect booting 
time on the runtime. For that, Mojito is smart enough to use 
`Y.Loader->resolve <http://yuilibrary.com/yui/docs/api/classes/Loader.html#method_resolve]>`_
to expand the loader application metadata, which is considerable bigger than the regular 
metadata computed through ``loader-app-base_{BCP 47 lang tag}``. 

.. _optimize_perf-seed_size:

Minimize the Size of the Seed File
##################################

Use only include critical modules in the seed. Mojito can load other required module at 
any given time.

.. _optimize_perf-synth_mods:

Use Synthetic Modules for YUI Core Modules
##########################################

Mojito already has default optimization for application metadata, but you
can use base and synthetic modules to optimize performance for YUI Core modules
as well.

In the ``application.json`` below, a resolved synthetic module is 
use to optimize the YUI Core module ``loader-yui3``.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "yui": {
         "config": {
           "seed": [
             "yui-base",
             "loader-base",
             "loader-yui3-resolved",
             "loader-app",
             "loader-app-resolved"
           ]
         }
       }
     }
   ] 

.. _optimize_perf-base_synth:

Use Base Synthetic Modules to Reduce Latency and Memory
#######################################################

The base synthetic modules are small, making them ideal for applications that 
may have connectivity issues. You should also take into consideration that
your application will require more CPU power when using base synthetic modules.
For desktop applications,  when you have more CPU power, you should use 
base synthetic modules.  

.. _optimize_perf-resolved_synth:

Use Resolved Synthetic Modules to Use Less CPU Power
####################################################

Resolved synthetic modules require less CPU power because they do not require recursive 
computation as the computation was already done at the server side. The size of the 
resolved synthetic module in memory, however, is much larger than
the base synthetic module. For mobile devices, which have less CPU power, you
would want to use resolved synthetic modules. 

.. _optimize_perf-contexts:

Use Contexts to Customize Seed to Runtime Environment
#####################################################

Contexts allow you to have different configurations for different runtime environments.
As we have discussed, base synthetic modules are better suited for desktop applications
because of the high demand for CPU power, while resolved synthetic modules are better
suited for mobile devices that do not have as much CPU power. With context configurations,
you can configure the runtime to use the better suited synthetic module.

In this example ``application.json``, the context ``runtime:client`` uses
a resolved synthetic module that expands metadata so that 

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "yui": {
         "config": {
           "seed": [
             "yui-base",
             "loader-base",
             "loader-yui3",
             "loader-app",
             "loader-app-base_{BCP 47 lang tag}"
           ]
         }
       }
     },
     {
       "settings": [ "runtime:client" ],
       "yui": {
         "config": {
           "seed": [
             "yui-base",
             "loader-base",
             "loader-yui3",
             "loader-app",
             "loader-app-resolved_{BCP 47 lang tag}"
           ]
         }
       }
     }
   ]

.. _optimize_perf-lang_tags:

Use Language Tags for Base and Resolved Synthetic Modules
#########################################################

Use base and resolved synthetic modules to load modules based on the languages 
specified in the request information and the user preferences by adding the language tag
to the name of the synthetic module. Instead of the default of loading all the 
modules for the language resource bundles, Mojito will only load the corresponding 
synthetic module name based on the language context. 

See :ref:`Using Synthetic Modules for Multiple Languages <synthetic_mods-mult_langs>`
for more information.


.. _yui_config-app_grp:

YUI App Group
=============

.. _app_grp-intro:

Introduction
------------

By default, YUI defines the three groups ``default``, ``gallery``, and ``yui2``. 
In Mojito v0.5.0, we introduce the group ``app`` as part of the loader metadata. This 
new group aggregates all the YUI modules defined in Mojito core and in the application and 
contains configuration that define how YUI manages those modules when they are needed.

.. _app_grp_intro-why:

Why Use the App Group?
######################

Groups are an important part of the YUI Loader configuration because they allow 
developers to define buckets of files that can be loaded from different mediums and 
sources. For example, by using the ``app`` group, you can load YUI modules from a CDN
and change the group configurations for a particular environment. 

For more details about the group configuration, refer to the 
`groups <http://YUIlibrary.com/YUI/docs/api/classes/config.html#property_groups>`_
property of the `YUI config Class <http://yuilibrary.com/YUI/docs/api/classes/config.html>`_.

. _app_grp-using:

Configuration of  the App Group
-------------------------------

In the ``application.json`` file, you can use the ``yui.config.groups`` object
to configure the following properties for the combo handler.

+--------------------+------------+---------------------------------------------------+---------------------------+
| Property           | Data Type  | Example                                           | Description               |
+====================+============+===================================================+===========================+
| ``combine``        | boolean    | ``combine: true``                                 | Determines whether this   |
|                    |            |                                                   | group has a combo service |
+--------------------+------------+---------------------------------------------------+---------------------------+
| ``comboSep``       | string     | ``comboSep: ';'``                                 | The separator for this    |
|                    |            |                                                   | group's combo handler.    |   
+--------------------+------------+---------------------------------------------------+---------------------------+
| ``maxURLLength``   | number     | ``maxURLLength: 500``                             | The maximum length of the |
|                    |            |                                                   | URL for this server.      |
+--------------------+------------+---------------------------------------------------+---------------------------+
| ``base``           | string     | ``base: 'http://yui.yahooapis.com/3.8.0/build/'`` | The base path/URL for     |
|                    |            |                                                   | non-combo paths.          |
+--------------------+------------+---------------------------------------------------+-+-------------------------+
| ``comboBase``      | string     | ``comboBase: 'http://yui.yahooapis.com/combo?'``  | The path/URL to the combo |
|                    |            |                                                   | service.                  |              
+--------------------+------------+---------------------------------------------------+---------------------------+
| ``root``           | string     | ``root: '3.8.0/build/'``                          | A prefix to the path      |
|                    |            |                                                   | attribute when building   |
|                    |            |                                                   | combo URLs.               |
+--------------------+------------+---------------------------------------------------+---------------------------+


In the example ``application.json``, the ``app`` group is configured
so that YUI modules are loaded from a CDN.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "yui": {
         "config": {
           "groups": {
             "app": {
               "combine": false,
               "maxURLLength": 516,
               "base": "http://companycdn.com/path/to/files"
             }
           }
         }
       }
     }
   ]

.. _app_grp-default_combo:

Default Combo Handler of Mojito
-------------------------------

Mojito comes with an extended version of the 
``mojito-handler-static`` middleware that implements a fully functional
combo handler that supports cache, fallbacks when proxies cut the URL, and more. This 
combo handler adheres the recommendations in the blog post 
`Managing your JavaScript Modules with YUI 3 Stockpile <http://www.YUIblog.com/blog/2012/11/06/managing-your-javascript-modules-with-YUI-3-stockpile-2/>`_
by `John Lindal <http://jjlindal.net/jafl/>`_, and it is the default configuration used 
for the Mojito application if the ``app`` group is not configured. 
 
The following are the default configurations for the ``app`` group:

- ``comboBase: "/combo~"``
- ``comboSep: "~"``
- ``root: ""``
- ``maxURLLength: 1024``

.. _app_grp-inherit_default:

Inheritance of Default Group Configurations
-------------------------------------------

You can inherit the default configurations of the ``app`` group by setting
the ``yui.config.combine`` property to ``true``. 

.. code-block:: javascript

   [
     {
       "settings": [ "environment:development" ],
       "yui": {
         "config": {
           "combine": true
         }
       }
     }
   ]



You can also use the ``combo`` property to disable the combo handler. In the 
example ``application.json`` below, the combo handler is disabled in
the ``environment:development`` context:

.. code-block:: javascript

   [
     {
       "settings": [ "environment:development" ],
       "yui": {
         "config": {
           "combine": true
         }
       }
     },
     {
       "settings": [ "environment:development" ],
       "yui": {
         "config": {
           "combine": false
         }
       }
     }
   ]

By disabling the combo handler, the YUI Core modules will not be using the combo handler, 
and the ``app`` group will also inherit that configuration.

.. _app_grp-shaker:

Shaker Integration
------------------

The ``mojito-shaker`` 3.x extension will be able to control the configurations defined
by the ``app`` group if you decide to push your assets into a CDN like Amazon. Shaker will 
also version the files and create the necessary rollups to speed up the caching and booting 
process in the client runtime. To learn how to use the ``mojito-shaker`` extension, 
see the `Shaker documentation <http://developer.yahoo.com/cocktails/shaker/>`_.


