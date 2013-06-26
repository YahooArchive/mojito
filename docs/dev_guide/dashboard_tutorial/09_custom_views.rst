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
   ``09_hb_templates``.
#. Let’s add the contexts with the selectors to ``application.json`` that will identify the templates
   for devices such as the iPad and iPhone. Because of the new configuration objects,
   Mojito will look for the template ``index.iphone.hb.html`` when a request is received from
   an iPhone.

   .. code-block:: javascript

      {
        "settings": [ "device:iphone" ],
        "selector": "iphone"
      },
      {
        "settings": [ "device:ipad" ],
        "selector": "ipad"
      },
   
#. We're going to use a partial for a heading that we use in many of our templates.
   Create the directory ``views/partials``.
#. In the newly created directory, create the partial ``widget_refresh_heading.hb.html`` 
   for heading of those mojits that refresh data with the markup below. It's 
   just a typical HTML file with Handlebars expressions.

   .. code-block:: html
   
      <h3>
        <strong>{{title}}</strong>
        <a title="refresh module" class="refresh" href="#">⟲</a>
        <a title="minimize module" class="min" href="#">-</a>
        <a title="close module" class="close" href="#">x</a>
      </h3>
#. For those mojits that don't refresh data, create the partial ``widget_heading.hb.html``
   with the following that doesn't contain the **refresh** icon:

   .. code-block:: html
   
      <h3>
        <strong>{{title}}</strong>
        <a title="minimize module" class="min" href="#">-</a>
        <a title="close module" class="close" href="#">x</a>
      </h3>

#. Before we go ahead and update the templates to use the partial. We're going to create
   a Handlebars helper in the ``PageLayout`` mojit that will be available to 
   all the other mojits on the page as long as the controllers include the ``mojito-helpers-addon``.
   Update ``mojits/PageLayout/controller.server.js`` with the code below that includes
   a helper that takes four arguments to create links:

   .. code-block:: javascript

YUI.add('PageLayout', function(Y, NAME) {

    // Handlerbars helper for creating links
    function createLink(title, url, path, css) {
        return "<a href='" + url + path + "'" + " class='" + css + "'>" + title + "</a>";
    }
    Y.namespace('mojito.controllers')[NAME] = {
        /**
         * Method corresponding to the 'index' action.
         *
         * @param ac {Object} The ActionContext that provides access
         *        to the Mojito API.
         */
        index: function(ac) {
            // Register helper for use in template
            ac.helpers.expose('linker', createLink);

            Y.log("PageLayout: this log message won't show in the default context, but will show up in development.","info", NAME);
            var view_type = ac.params.getFromRoute('view_type') || "yui";
            if (view_type === "yui") {
                ac.composite.done({
                    title: "Trib - YUI Developer Dashboard",
                    button_text: "See Mojito Dashboard",
                    other: "/mojito"
                });
            } else if (view_type === "mojito") {
                ac.composite.done({
                    title: "Trib - Mojito Developer Dashboard",
                    button_text: "See YUI Dashboard",
                    other: "/"
                });
            }
        }
    };
   }, '0.0.1', {requires: ['mojito','mojito-composite-addon', 'mojito-params-addon', 'mojito-helpers-addon']});

#. Now let's start updating the templates to use the partials and helper. Starting with the
   template for the ``PageLayout`` mojit, which uses the helper, but not a partial:

   .. code-block:: html

     <div id="{{mojit_view_id}}" class="mojit pageLayout trib" >
  <h1>{{title}}</h1>
  {{{linker button_text "" other "yui3-button swap"}}}
  <div class="myheader" >
    {{{header}}}
  </div>
  <div class="mybody" >
    {{{body}}}
  </div>
  <div class="myfooter" >
    {{{footer}}}
  </div>
</div>

#. We're going to update our templates so that they use the partials we just created.
   The syntax for using the partial is ``{{> partial_name}}``. Go ahead and replace the 
   contents of ``mojits/Blog/views/index.hb.html`` with the following:

  .. code-block:: html
    
     <div id="{{mojit_view_id}}" class="mojit">
      <div class="mod" id="blog">
        {{> widget_heading}}
        <div class="inner">
            <ul>
                {{#results}}
                    <li>
                        <a href="{{link}}">{{title}}</a>
                        <span class="desc" title="AUTHOR: [ {{creator}} ] DESC: {{description}} DATE: ( {{pubDate}} )">{{description}}</span>
                    </li>
                {{/results}}
            </ul>
         </div>
       </div>
     </div>

#. Again, do the same for ``mojits/Calendar/views/index.hb.html``:
 
  .. code-block:: html

<div id="{{mojit_view_id}}" class="mojit">
    <div class="mod" id="calendar">
        {{> widget_heading}}
        <div class="inner">
            <ul>
                {{#results}}
                    <li>{{#entry}}<span>{{#summary}}{{content}}{{/summary}}</span><a href="{{#link}}{{href}}{{/link}}" title="{{#title}}{{content}}{{/title}}">{{#title}}{{content}}{{/title}}</a>{{/entry}}</li>
                {{/results}}
            </ul>
        </div>
    </div>
</div>

#. And for the ``Gallery`` template:

   .. code-block:: html

<div id="{{mojit_view_id}}" class="mojit">
    <div class="mod" id="gallery">
        {{> widget_heading}}
        <div class="inner galleryFlow">
            <ul>
                {{#results}}
                    {{#json}}
                        <li><a href="http://yuilibrary.com/gallery/buildtag/{{.}}">{{.}}</a></li>
                    {{/json}}
                {{/results}}
            </ul>
        </div>
    </div>
</div>

#. And for the ``Youtube`` template:

#. The Twitter and Github mojits will use the partial with the **refresh** button. Add those
   with the following:

   .. code-block:: html

  <div id="{{mojit_view_id}}" class="mojit">
    <div class="mod" id="twitter">
        {{> widget_refresh_heading}}
        <div class="inner">
            <ul>
                {{#results}}
                    <li><strong><a href="http://twitter.com/{{from_user}}">{{from_user}}</a></strong> - <span>{{text}}</span></li>
                {{/results}}
            </ul>
        </div>
    </div>
</div>

   .. code-block:: html


<div id="{{mojit_view_id}}" class="mojit">
    <div class="mod" id="github">
        {{> widget_refresh_heading}}
        <div class="inner">
            <ul>
                {{#results}}
                    <li><a href="http://github.com/{{username}}">{{username}}</a> - <a href="{{link}}">{{message}}</a></li>
                {{/results}}
            </ul>
        </div>
    </div>
</div>


#. The use of partials just made our templates cleaner. Now we're going to create templates
   that with different selectors so Mojito can render the appropriate ones depending
   on the device making an HTTP request. Notice that the layout changes for each.

   **mojits/Body/views/index.ipad.hb.html**

   .. code-block:: html

<div id="{{mojit_view_id}}" class="mojit">
  <h4 class="bodytext">{{title}}</h4>
  <div class="bodyStuff yui3-g-r">
  <div class="yui3-u-1-3">
      {{{twitter}}}
      {{{gallery}}}
    </div>
    <div class="yui3-u-1-3">
      {{{github}}}
      {{{blog}}}
    </div>
    <div class="yui3-u-1-3">
      {{{calendar}}}
      {{{youtube}}}
    </div>
  <div>
</div>

    **mojits/Body/views/index.iphone.hb.html**

<div id="{{mojit_view_id}}" class="mojit">
  <h4 class="bodytext">{{title}}</h4>
  <div class="bodyStuff yui3-u-1">
      {{{blog}}}
      {{{github}}}
      {{{calendar}}}
      {{{gallery}}}
      {{{twitter}}}
      {{{youtube}}}
  <div>
</div>

#. Okay, before we start the application, you're going to need to add the ``mojito-helpers-addon``
   to the mojits that are using the helper: ``

#. Now fire her up. You won't see much of a difference in the look of the application,
   but your templates are smaller and cleaner because of the partials and helper.

#. Append the query string parameter ``?device=iphone`` to the URL. You should see a 
   different layout for the iPhone. Try the same using ``?device=ipad``. 

TBD: tell them how to view the pages on their devices.


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


