==================================================
9. Customizing Views for Different Devices (Draft)
==================================================

Introduction
============

Thanks to the YUI responsive grid, our application adapts nicely to changes to size 
of the browser window. We’re going to go a step further though and serve different pages 
based on the client request. You can configure Mojito to find files based on a selector, 
which is just an identifier that is part of the file name. This allows you to have multiple 
templates that can be served based on the client request. The selectors can be defined for 
different contexts, allowing you to use a selector based on the runtime environment. 

Estimated Time
--------------

15 minutes

What We’ll Cover
----------------

- selectors - how to define them and how they are used.
- creating multiple multiple templates
- Handlebars helpers
- template partials
- Helper addon

Final Product
-------------

In the screenshot, you can see that when ... the menu...

<Image here!>

Before Starting
---------------

Review of the Last Module
#########################

We worked on using more sophisticated configuration to have default configurations, 
store key-value pairs, and use contexts. In addition to application.json that we’ve 
been working with, we introduced defaults.json and definition.json. We also worked 
with the Config addon again, this time using the method getDefinition. In short, 
we learned the following:

- evaluation of configurations
- defining defaults
- instance configurations
- configurations defined in definitions.json
- context configurations
- configuring YUI
- configuring logging


Setting Up
##########

``$ cp -r 08_mojit_adv_config 09_hb_templates``

Source Code for Example
-----------------------

``[app_part{x}](http://github.com/yahoo/mojito/examples/quickstart_guide/app_part{x})``

Lesson: Selectors and Custom Templates
======================================

Selectors
---------

The selector is an arbitrary user-defined string, which is used to select which 
version of each resource to use. The selector is defined in the ``application.json`` 
with the selector property. Because the selector is a global entity, you cannot 
define it at the mojit level. For example, you cannot define the selector in the
``defaults.json`` of a mojit.

The value of the selector property is a string that must not have a period ('.') 
or slash ('/') in it. In practice, it’s suggested to use alphanumeric and hyphen (‘-‘) 
characters only.

Only one selector can be used in each configuration object identified by the setting 
property, which defines the context. The specified selectors must match the selector 
found in the resource file names. So, for example, the template ``views/index.iphone.hb.html`` 
has the selector iphone.

You can also have controllers that use a selector. For example, your application could 
have all of the following controllers:

- controller.common.js
- controller.common.iphone.js
- controller.server.js
- controller.server.iphone.js

See the selector Property and Selectors for for more information.

Devices Recognized By Mojito
############################

Supported Devices
*****************

Mojito can examine the HTTP header User Agent and detect the following devices/browsers. 
The example templates would based on selectors defined for each context. For our application, 
we’re only going to be creating templates for the iPhone, iPad, and Android devices in 
addition to ``index.hb.html``.

+-----------------+---------------------------+
| Device/Browser  | Example Template          |
+=================+===========================+
| Opera Mini      | index.opera-mini.hb.html  |
+-----------------+---------------------------+
| iPhone          | index.iphone.hb.html      |
+-----------------+---------------------------+
| iPad            | index.ipad.hb.html        |
+-----------------+---------------------------+
| Android         | index.android.hb.html     |
+-----------------+---------------------------+
| Windows Mobile  | index.iemobile.hb.html    |
+-----------------+---------------------------+
| Palm            | index.palm.hb.html        |
+-----------------+---------------------------+
| Kindle          | index.kindle.hb.html      |
+-----------------+---------------------------+
| Blackberry      | index.blackberry.hb.html  |
+-----------------+---------------------------+


Defining Selectors
##################

You define selectors in application.json. We’re going to associate selectors to 
runtime environments by defining the selector for specific contexts. 

Mojito looks at the HTTP header User-Agent when receiving an HTTP request and will 
then use the appropriate context and selector to choose resources. 

.. code-block:: javascript

   [
     ...,
     {
       "settings": [ "device:android" ], 
       "selector": "android" 
     },
     { 
       "settings": [ "device:ipad" ], 
       "selector": "ipad" 
     },
     {
       "settings": [ "device:iphone" ], 
       "selector": "iphone" 
     }
   ]

Creating Multiple Templates
---------------------------

We’re going to change the layout and the number of modules based on the client 
request. 

Handlebars Helpers and Partials
###############################

Handlebars helpers in Mojito applications are defined and registered in the 
controller. You define a Handlebars helper as a function outside the controller 
namespace in the controller. Thus, the function toLinkHelper can be used as a 
helper after it has been registered, which we’ll look at next.

.. code-block:: javascript

   YUI.add('helperMojit', function(Y, NAME) {

     function toLinkHelper(title, url) {
       return "<a href='" + url + "'>" + title + "</a>";
     }
     Y.namespace('mojito.controllers')[NAME] = 
       ...,
       index: function(ac) {
         ...
       }
     };
   }, '0.0.1', {requires: ['mojito', 'mojito-helpers-addon']});

After you have defined your Handlebars helper, you register it with the Helpers 
addon. The Helpers addon has several methods for getting helpers, setting 
mojit-level helpers, or exposing helpers so that they can shared with other mojits.

Helpers Addon
#############

As we’ve seen with other addons, you need to require the Helpers addon by adding 
the string ‘mojito-helpers-addon’ in the requires array of your controller. 
You also access the addon and its methods through the ``ActionContext`` object.

The Helper addon has the following three methods:

- ``expose`` - Exposes a parent mojit’s helper function so that on the server 
  side any child mojit instance under a particular request can use the helper. 
  On the client, any child mojit instance on the page can use the helper.
- ``get`` - Allows you to get a specify helper (if given an argument) or all 
  the helpers if not given any arguments.
- ``set`` - Sets a helper function for a mojit instance. Other mojit instances 
  will not have access to this helper function.

Setting Helpers for a Mojit Instance
####################################

You can expose a helper for use with a mojit instance or make it available to all 
mojits. The reason for setting the helper for this mojit instance is that it depends 
on a specific data structure passed to it. To register the helper toLinkHelper that 
we defined earlier.

.. code-block:: javascript

   ...
     index: function(ac) {
       var data = {
         modules: [
           {name: "event", user_guide: "http://yuilibrary.com/yui/docs/event/", title: "Event Utility"},
           {name: "node", user_guide: "http://yuilibrary.com/yui/docs/node/",  title: "Node Utility"},
           {name: "base", user_guide: "http://yuilibrary.com/yui/docs/base/", title: "Base" },
           {name: "test", user_guide: "http://yuilibrary.com/yui/docs/test/", title: "YUI Test"},
           {name: "cookie", user_guide: "http://yuilibrary.com/yui/docs/cookie/",  title: "Cookie Utility"},
           {name: "yql", user_guide: "http://yuilibrary.com/yui/docs/yql/", title: "YQL Query"}
         ]
       };
       ac.helpers.set('toLinkHelper', toLinkHelper);
       ac.done({ yui_info: data, highlighted_module: ac.params.url('module') || "event"});
     }
   ...

In the ``index.hb.html`` template, the helper toLinkHelper highlights takes as the arguments passed to it by 
``ac.done`` to create links.

.. code-block:: html

   <ul>
   {{#each yui.modules}}
     <li>{{{toLink title user_guide }}}</li>
   {{/each}}
   </ul>

Exposing Helpers for Global Use
###############################

To register a helper so that parent mojits can share them with their children, you 
use the expose method of the Helpers addon. In the example controller below, the 
expose method registers the helper toLinkHelper that creates links. You’d want this 
helper to be available to other mojits, so exposing it globally makes sense.

.. code-block:: javascript

   ...
     function toLinkHelper(title, url) {
       return "<a href='" + url + "'>" + title + "</a>";
     }
     index: function(ac) {
       var data = {
         modules: [
           {name: "event", user_guide: "http://yuilibrary.com/yui/docs/event/", title: "Event Utility"},
           {name: "node", user_guide: "http://yuilibrary.com/yui/docs/node/",  title: "Node Utility"},
           {name: "base", user_guide: "http://yuilibrary.com/yui/docs/base/", title: "Base" },
           {name: "test", user_guide: "http://yuilibrary.com/yui/docs/test/", title: "YUI Test"},
           {name: "cookie", user_guide: "http://yuilibrary.com/yui/docs/cookie/",  title: "Cookie Utility"},
           {name: "yql", user_guide: "http://yuilibrary.com/yui/docs/yql/", title: "YQL Query"}
         ]
       };
       ac.helpers.expose('toLink',toLinkHelper);
       ac.done({ yui_info: data });
     }
   ...


Using the Helper in the Template
################################

After you define your handler and then register it with the ``Helper`` addon, you can 
use the handler in your template. In the template ``index.hb.html`` below, the 
Handlebars block helper each iterates through the objects contained in the array 
``yui_info.modules``, and then the custom helper toLink creates links with the values 
of the properties title and user_guide:

.. code-block:: javascript

   <div id="{{mojit_view_id}}">
     <h3>YUI Modules</h3>
     <ul>
     {{#each yui_info.modules}}
       <li>{{{toLink title user_guide }}}</li>
     {{/each}}
     </ul>
   </div>

Partials
########

Handlebars partials are simply templates using Handlebars expressions that other 
templates can include. Mojito allows you to have both global (shared by all mojits) 
or local (available only to one mojit) partials depending on the context. Global 
and local partials are used the same way in templates, but the location of the 
partials is different. Data that is available to templates is also available to 
partials.

Now let’s look at the file naming convention, location, and usage of partials 
before finishing up with a simple example.

File Naming Convention
**********************

The file name for partials is similar to templates using Handlebars except ``{partial_name}`` 
replaces ``{controller_function}``: ``{partial_name}.[{selector}].hb.html``

Location of Partials
********************

Global Partials
^^^^^^^^^^^^^^^

``{app_dir}/views/partials``

Thus, the global partial ``foo.hb.html`` in the application ``bar_app`` would be located at
``bar_app/views/partials/foo.hb.html``.

Local Partials
^^^^^^^^^^^^^^

``{app_dir}/mojits/{mojit_name}/views/partials``

Thus, the local partial foo.hb.html in the mojit bar_mojit would be located at
``mojits/bar_mojit/views/partials/foo.hb.html``.

Using Partials in Templates
***************************

To use a partial, the template uses the following syntax: ``{{> partial_name}}``

To use the partial ``status.hb.html``, you would included the following in a 
template: ``{{> status }}``

Example
^^^^^^^

``/my_news_app/views/partials/global_news.hb.html``

.. code-block:: html

   <div>
     <h3>Global News</h3>
     {{global_news_stories}}
   </div>

``/my_news_app/mojits/newsMojit/views/partials/local_news.hb.html``

.. code-block:: html

   <div>
     <h3>Local News</h3>
     {{local_news_stories}}
   </div>

``/my_news_app/mojits/newsMojit/views/index.hb.html``

.. code-block:: html

   <div id="{{mojit_view_id}}">
     <h2>Today's News Stories</h2>
     {{> global_news}}
     {{> local_news}}
   </div>




Creating the Application
========================

#. After you have copied the application that you made in the 
   last module (see Setting Up), change into the application 
   ``05_getting_data``.
#. Let’s create the Twitter mojits that get Twitter data for us.

   ``$ mojito create mojit twitterMojit``

Troubleshooting
===============

Problem One
-----------

Nulla pharetra aliquam neque sed tincidunt. Donec nisi eros, sagittis vitae lobortis nec, 
interdum sed ipsum. Quisque congue tempor odio, a volutpat eros hendrerit nec. 

Problem Two
-----------

Nulla pharetra aliquam neque sed tincidunt. Donec nisi eros, sagittis vitae lobortis nec, 
interdum sed ipsum. Quisque congue tempor odio, a volutpat eros hendrerit nec.  

Summary
=======


Q&A
===

Test Yourself
=============



Terms
=====


Source Code
===========

``[app_part{x}](http://github.com/yahoo/mojito/examples/quickstart_guide/app_part{x})``

Further Reading
===============

``[Mojito Doc](http://developer.yahoo.com/cocktails/mojito/docs/)``


