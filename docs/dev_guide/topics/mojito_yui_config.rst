==========================
Configuring YUI in Mojito
=========================

.. _YUI_config-intro:

Overview
========

Mojito allows you to configure the YUI seed file and use YUI groups for dynamically
loading in the ``application.json`` file. 

YUI Seed File
=============

YUI Applications
----------------

To use YUI in Web pages, you include a small JavaScript file called the 
YUI seed file. The YUI seed file allows you to load other YUI components on your page. 
The seed file is added to your Web page by with following ``<script>`` tag.

``<script src="http://yui.yahooapis.com/3.8.0/build/yui/yui-min.js"></script>``

From the URL to the seed file, the YUI library can infer the version of the library that 
should be used, the filter that you want to use (min, debug or raw), and the CDN that is 
serving the library. 

Mojito Applications
-------------------

In Mojito applications, the YUI seed is configured in ``application.json`` rather than 
including a ``<script>`` tag in templates. Thus, the information inferred from 
the URL to the YUI seed file in YUI applications is instead provided 
in the ``yui.config.seed`` object of ``application.json`` in Mojito applications.
We will look at ``yui.config.seed`` in `Configuring the Seed File <>`_.

The following are the reasons Mojito uses configuration for the YUI seed:

- The YUI library is bundled with the application using npm, so loading
  is done differently.
- Mojito applications may run as mobile applications that have connectivity
  issues preventing access to the YUI seed file.
- When applications are started, new YUI modules, part of the Mojito code, and part of the 
  application code are loaded in the same way as the YUI Core modules, so
  it is difficult to use the YUI seed file in a Mojito application.

Default Seed File
-----------------

Mojito creates a default configuration for the YUI seed, so most users do not 
need to configure the YUI seed as the default configuration is sufficient.
Developers who want finer grain control over the loader for performance 
optimization should consider customizing the configuration for the YUI seed.

Configuring the Seed File
-------------------------

Starting from Mojito v0.5.0, developers can configure the YUI seed 
using the ``yui.config.seed`` object in ``application.json`` file. 

In the example ``application.json`` below, the YUI seed includes
the modules specified in the ``seed`` object. The modules ``loader-app`` and 
``loader-app-base{langPath}``, which we will discuss in ` <>`_. The other
modules are just YUI Core modules.

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
             "loader-app-base{langPath}"
           ]
         }
       }
     }
   ]



What Modules Should Be in the Seed?
###################################

When including modules to be part of the seed, developers need to decide
which modules are critical and understand what modules that are available for 
Mojito applications. In theory, all YUI modules that are part of Mojito core, YUI core, 
and your own application are available to be used as part of the seed, but in 
addition, Mojito generates a few more files that are called synthetic modules. 

We recommend keeping the seed size small because Mojito can load required modules 
at any given time. So, unless you have a strong reason for adding a new module to 
the seed array, try to keep it simple.


Synthetic Modules in Mojito
###########################

What Are Synthetic Modules?
***************************

Synthetic modules generate application metadata that can be used by the YUI loader
to load application and Mojito modules on demand, which are critical for the application 
to function. Synthetic modules are not physical files except in the case
of hybrid applications, when synthetic modules are generated as files during
the build process. You can also use `Shaker <>`_ to generate and bundle physical files
from synthetic files as part of the content to upload to a CDN. 

Each of those 
synthetic modules will be computed and will not represent physical files at all, 
so, when it comes to production, you might want to use Shaker to generate and bundle 
them as part of the content you want to upload to CDN, and when it comes to hybrid 
applications, those files will be generated into the build artifact as part of the Mojito 
build command.

When Are Synthetic Modules Created?
***********************************

Every time you run ``mojito start`` or use any alternative way to boot your application, 
the Mojito store will analyze the folder structure and dependencies to try to understand the 
structure and then make assumptions along the way. Part of that analysis is to generate 
application metadata that could be used by YUI loader to load application and Mojito 
modules on demand, and that part is critical for the application to function, and 
that's what synthetic modules do. 


Using Synthetic Modules for Multiple Languages
**********************************************

Your application can run in multiple languages, but you should not load all available 
language bundles in the client runtime for performance reasons. Instead, you can load 
specify synthetic modules that will load modules based on the request information and the 
user preferences. Mojito will locate the corresponding synthetic name 
based on the language context. 

Syntax
^^^^^^

``{syntheticModule}-{langPath}``

For example, the US English form of the ``loader-app-base`` synthetic module
is ``loader-app-base_en-US``.

Restrictions
^^^^^^^^^^^^
Not all synthetic modules can be customized per language. 
Only the synthentic modules that have the suffix ``-base`` and ``-resolved`` 
can have language versions. The default synthetic modules, such as ``loader-app``,
always exists. So, if no language is specified, but many language resource bundles 
exist for a mojit, then the default synthetic module will load the meta data for all of 
the modules. If an application has multiple mojits each with dozens of language bundles,
the amount of meta data can be considerable, so you'd want to make sure that
the synthetic modules have all the different language versions.


Creating Synthetic Files
------------------------

In terms of extending Mojito functionalities, if you create a Resource Store addon, you 
can create new synthetic files, as well as control the seed generation by piping into 
``store.YUI.getAppSeedFiles`` method. Check the API documentation for more details on the 
signature of that method.

base v. resolved
----------------

https://github.com/yahoo/Mojito/blob/develop/lib/app/addons/rs/YUI.js#L48
In general, *base files will have basic metadata, which needs to be digested/processed in 
a recursive way by the YUI Loader in the client side in order to generate the file or 
files that need to be loaded when a particular module is used.
In the other hand, *resolved files will have the expanded metada, which do not require any 
process to determine which file or files need to be loaded when a particular module is used. 
Check the documentation about "loader.resolve" from YUI api. the problem is that it is 
HUGE compared with the *base, but it performance better down the road, specially on mobile.

resolved is bigger, way bigger. In desktop, where we have a lot of CPU power, we normally 
use the *base, but when it comes to mobile, *resolved is probably a better choice, also when 
you don't have network latency (like hybrid apps), *resolved is better as well.

When Not to Use Them
####################


Extending Mojito with Synthetic Modules
#######################################

Building Synthetic Modules with Shaker
#######################################

Synthetic Modules in Hybrid Applications
#########################################


Optimizing Performance
----------------------

In mobile, and in some high performance applications, relying on the Loader to compute and 
resolve dependencies that are needed in a recursive way could affect booting time on the 
runtime drastically. For that, Mojito is smart enough to use 
Y.Loader->resolve feature [http://YUIlibrary.com/YUI/docs/api/classes/Loader.html#method_resolve] 
to expand the loader metadata, which is considerable bigger than the regular metadata 
computed through loader-app-base{langPath}. 

Here is an example:

[
    {
        "settings": [ "master" ],
        "YUI": {
            "config": {
                "seed": [
                    "YUI-base",
                    "loader-base",
                    "loader-YUI3",
                    "loader-app",
                    "loader-app-resolved{langPath}"
                ]
            }
        }
    }
]

Reducing Latency
################

 So, *base is more network friendly because it is
 considerable smaller so it loads faster initially,

Reducing Memory
###############

Yes, that's the idea, just keep in mind the difference between the size of the metadata, 
which can also affect the boot time.  but *rebase is more CPU friendly on 
the runtime because it does not require recursive computation to fulfill requirements 
since that computation was already done at the server side. 


YUI App Groups
==============

Introduction
------------

Starting on Mojito 0.5.0, we introduced a special group called ``app`` as part of the 
loader metadata. This new setting will group all the YUI modules defined in Mojito core 
and in the application, and will hold a series of settings and configurations that will 
define how YUI will deal with those modules when they are needed.

Groups are an important part of the YUI Loader configuration because they allow us to 
define buckets of files that could be loaded from different mediums and sources. For more 
details about the group configuration, reference to the 
YUI Groups config API: http://YUIlibrary.com/YUI/docs/api/classes/config.html#property_groups

Why Use App Groups
##################

  - allows you to load YUI modules from a CDN
  - allows you to change the group configurations for a particular environment


Default App Groups
------------------

By default, YUI defines the three groups ``default``, ``gallery``, and ``YUI2``. 
In Mojito, we introduce a fourth one, called `app`, and it defines anything that is part 
of the application or any of its dependencies, including ``mojito`` core modules. As a 
regular practice, Mojito will assume few things about this group, and in many case, you 
don't need to worry about customize it, but if you need to, you can do it  through the 
regular ``application.json`` configuration, using the YUI.config structure. 


Example
#######

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

Default Combo Handler Bundle with Mojito
----------------------------------------

As part of Mojito 0.5.0 release, we also ship an extended version of the 
`Mojito-handler-static` middleware that implements a fully functional, fully capable 
combo handler, which supports cache, fallback when proxies cut the URL, etc. This combo 
follows the recommendations described in this blogpost 
[http://www.YUIblog.com/blog/2012/11/06/managing-your-javascript-modules-with-YUI-3-stockpile-2/] 
from John Lindal (@jafl5272), and it is the default configuration used for the Mojito 
application if the `app` group is not configured, and it will have these default settings:

* ``comboBase: "/combo~"``
* ``comboSep: "~"``
* ``root: ""``
* ``maxURLLength: 1024``

Inheriting Default Group Configurations
---------------------------------------

Another useful mechanism to control the ``app`` group is by inheriting some of the settings 
from the default configuration, like the `combine` flag. Here is another example where we 
disable the combo handler while in development environment:

[
    {
        "settings": [ "environment:development" ],
        "YUI": {
            "config": {
                ""combine": false
            }
        }
    }
]

By doing that, YUI Core modules will not be using the combo handler, but also the `app` 
group will inherit that configuration, but only then your application is running in the 
`development` `environment`.

Shaker Integration
------------------

`Mojito-shaker` 3.x extension will be able to control this setting if you decide to push 
your assets into a CDN like amazon. Shaker will also version the files and create the 
necessary rollups to speed up the caching and booting process in the client runtime, in 
case you decide to use it, you will not need to specify much though. Reference to 
`shaker` documentation for more details.


My Notes
========

Seed File information
---------------------

- You specify 'loader-app-base{langPath}' to tell Mojito to use a
  synthetic module to generate application metadata that could
  be used by YUI loader to load app/modules on demand, right?

Yes, app/modules and mojito/modules.

- What YUI modules are part of the Mojito core?

YUI modules that are part of the Mojito package. in other words, those that we control. 
the distinction here is important since Mojito will flatten the structure and treat 
mojito/modules and app/modules alike, so, from the loader point of view, their are in the 
same category (app), but the reality is that they are part of the Mojito package.

[DONE]

- Is there a standard syntax for synthetic modules, such as loader-app*
  and loader-app-base{langPath}, or are these the only two synthetic modules
  available. In other words, can you create other synthetic modules using an arbitrary string
  'loader-app-somestring'.

Yes, any Resource Store addon can create synthetic assets, including YUI modules, just 
like we do today, and the name of those YUI modules is completely arbitrary. As today, you 
can explorer those that we are creating here:
https://github.com/yahoo/Mojito/blob/develop/lib/app/addons/rs/YUI.js#L48
I added a lot of notes in that `MODULE_TEMPLATES` structure. In the doc I did not 
mentioned some of them, one of them in fact: loader-YUI3-base because that's a very edge 
case, but feel free to add it.

Now, the {langPath} means that those synthetic modules might be customized per lang, in 
a form of `loader-app-base_en-US`, so Mojito will locate the corresponding synthetic name 
based on the context. I didn't mention that either. Not all synthetic are customized 
per lang, only *base and *resolved are, and even for those, the default always exists, 
e.g. `loader-app-base` without lang specific info, and it will load meta for EVERYTHING, 
which for search is pretty big because they have 42 langs per mojit.

[DONE]
- Is the target audience anyone using Mojito? Based on your doc, there
  seems to be a default seed. Is that true and is it good enough for most
  users? Who should override the default seed?

That's correct, Mojito will work for most users without any custom config. the target 
audience are users who want to take control over the loader for performance reasons, and 
performance optimization, advanced users I must say.

[DONE]
- Can mojits specify seed files (default.json) or is it just at the
  application level?

application level only since this represent the app not a specific mojit.

[ON HOLD]
- Do we need an example of using Shaker to generate and bundle synthetic
files?

We are still waiting for shaker 3.x, once we get that, we can add to the docs.


[ON HOLD]
- Can you provide a process description of how the seed is loaded? I think
understanding the sequence of how modules are loaded would make it clearer
to users.

I will work on this today, I will create a diagram.

[DONE]
- What are the differences between 'loader-app-base{langPath}'
and'loader-app-resolved{langPath}'?

https://github.com/yahoo/Mojito/blob/develop/lib/app/addons/rs/YUI.js#L48
In general, *base files will have basic metadata, which needs to be digested/processed in 
a recursive way by the YUI Loader in the client side in order to generate the file or 
files that need to be loaded when a particular module is used.
In the other hand, *resolved files will have the expanded metada, which do not require any 
process to determine which file or files need to be loaded when a particular module is used. 
Check the documentation about "loader.resolve" from YUI api. the problem is that it is 
HUGE compared with the *base, but it performance better down the road, specially on mobile.

[DONE]
 - Is it that when you use the synthetic file
'loader-app-base{langPath}', the dependencies are computed and resolved
dependencies, which affects booting time on the
   runtime, whereas, "loader-app-resolved{langPath}" represents the
expanded metadata so dependencies do not need to be computed and resolved?
Sorry, it's unclear to me.

Yes, that's the idea, just keep in mind the difference between the size of the metadata, 
which can also affect the boot time. So, *base is more network friendly because it is
 considerable smaller so it loads faster initially, but *rebase is more CPU friendly on 
the runtime because it does not require recursive computation to fulfill requirements 
since that computation was already done at the server side. 

[NOOP]
- Can we call synthetic modules that represent expanded metadata "resolved
synthetic modules" to differentiate them in the documentation? Having a
nomenclature will be easier
 to explain and discuss the concepts.

Well, synthetic assets (where synthetic YUI modules are a subset of) as completely 
independent from resolved/base in concept. We are just creating synthetic YUI modules 
that happens to carry loader metadata, but they could be anything else. An example of this 
is a compiled HB view, which is coming soon, in which case we explorer the HB files, and 
compile them during the app booting process and create synthetic YUI modules that holds 
the compiled->to->javascript of each view, in which case the HB parser (which is around 25kb) 
will not need to be loaded in the runtime, instead, views will be loaded in a form of JS as 
YUI modules using loader. That's another example of synthetic files, and we will have more 
of those in the future.


[DONE]
- If 'loader-app-resolved{langPath}' is more performant than
'loader-app-base{langPath}', why would you use the latter? Is it because
the former is more restrictive and
 would not allow you to dynamically inject/call modules?

No, because it is bigger, way bigger. In desktop, where we have a lot of CPU power, we normally 
use the *base, but when it comes to mobile, *resolved is probably a better choice, also when 
you don't have network latency (like hybrid apps), *resolved is better as well.

The restrictive note only applies to "loader-YUI3-base*" and "loader-YUI3-resolved*", 
since they will hold metadata of YUI core modules that are required by any Mojito/modules and app/modules.

[PENDING]
- Do you have any working examples that I could try?

No, but I can create some. I think Alberto modified some of the hybrid apps in our 
examples to use resolved when using Mojito build, but I can look for it.

[NOOP]
- Is there any way to dump the synthetic module to see what it contains?

Just create a dummy app, run it, and hit: http://localhost:8666/combo~/static/loader-app-base.js

[DONE]
- Is this definition of synthetic modules correct? Synthetic modules
  generate application metadata that can be used by the YUI loader
  to load app and Mojito modules on demand. This is critical for the
  application to function.

The definition is correct for synthetic loader modules, but not for synthetic modules in 
general since they cover much more than that (I described the details above).

YUI App Group
-------------

[DONE]
Are these the only benefits of using the 'app' group?
  - allows you to load YUI modules from a CDN
  - allows you to change the group configurations
  for a particular environment
  - ??

that's correct.

[DONE]
- Is this correct? Seems like you're discussing the 'app' group, but the
'app' object is not included.
[
  {
    "settings": [ "environment:development" ],
    "YUI": {
      "config": {
        "combine": false
      }
    }
  }
]

Yes, it is correct, because app group will inherit the `combine` flag from the top level. 
Usually, when you set combine: false is because you don't want combo, and that includes 
YUI combo and app combo, that's why we want to inherit it from YUI loader configuration.

In other words, YUI->config->combine will work as the default definition for YUI->config->groups->app->combine, 
if you don't have a custom app group definition in your application.json.

[NOOP]
- Do we need to provide more information about the extended version of
'mojito-handler-static' middleware? Can users require it in middleware?

It is already included by default. This is not a new middleware, but an enhanced one. It 
is also responsible for css, images, or any other static asset. I don't think we need to 
provide more details here.

[NOOP]
- Do users ever directly use this middleware or does it just do everything
for users under the covers?

they don't need to use it directly, unless they decide to change the middleware list, in 
which case they normally replicate the original + more changes. In any case, the current 
infrastructure will be refactor soon.

[DONE]
- The two gists that you created seem to be about YUI configuration in
Mojito applications. Does it make sense to have a new topic titled "YUI
Configuration in Mojito"?

Yes, normally YUI users know how to deal with this in a YUI app, and they will expect to 
have similar functionality in Mojito. It will definitely facilitate the onboarding.

Best Regards,
Caridy