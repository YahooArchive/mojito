﻿================
Extending Mojito
================

.. _mojito_extending-intro:

Introduction
============

The Mojito framework lets you add features and extend functionality through addons, 
libraries, and middleware. This chapter discusses how to create extensions and where to 
place files in the Mojito framework.

.. _mojito_extending-addons:

Addons
======

In addition to the `Action Context <../../api/classes/ActionContext.html>`_ addons that 
Mojito provides, you can create your own addons to add functionality to controller 
actions.

Addons allows you to do the following:

- wrap third-party Node.js libraries and YUI libraries
- inspect the content of the ``ActionContext`` object
- call methods on the ``ActionContext`` object, which can be references through 
  ``this.get('host')``

.. _addons-creating:

Creating New Addons
-------------------

An addon is simply a JavaScript files that contains a YUI module. You can create addons 
at the application and mojit level. Application-level addons are available to all mojits 
in the application, whereas, mojit-level addons are only available to its mojit.

.. _addons_creating-naming:

Naming Convention
#################

The name of an addon should have the following syntax where ``{addon_name}`` is a unique 
YUI module name defined by the user and ``{affinity}`` is ``server``, ``common``, or 
``client``.

``{addon_name}.{affinity}.js``

.. _addons_creating-loc:

Location of Addons
##################

Application-level addons should be placed in the following directory:

``{app_dir}/addons/ac/``

Mojit-level addons should be placed in the following directory:

``{mojit_dir}/addons/ac/``

.. _addons_creating-writing:

Writing the Addon
#################

The ``ActionContext`` is a `YUI Base <http://developer.yahoo.com/yui/3/base/>`_ object, 
and ``ActionContext`` addons are `YUI Plugins <http://developer.yahoo.com/yui/3/plugin/>`_. 
To create a new addon, you write a new YUI Plugin and register it with Mojito.

The addon must have the following:

- registered plugin name, which is the string passed to ``YUI.add``
- constructor with a ``prototype`` property
- statement assigning the constructor to a namespace of ``Y.mojito.addons.ac``, so Mojito 
  can access your addon

**Optional:** ``requires`` array to include other modules.
The code snippet below shows the skeleton of an addon with the registered 
plugin name (``'addon-ac-cheese'``) and the constructor (``CheeseAcAddon``) with its 
``prototype`` property:

.. code-block:: javascript

   // Register the plugin name
   YUI.add('addon-ac-cheese', function(Y, NAME) {
     // Constructor for addon
     function CheeseAcAddon(command, adapter, ac) {
       // The "command" is the Mojito internal details
       // for the dispatch of the mojit instance.
       // The "adapter" is the output adapter, containing
       // the "done()", "error()", etc, methods.
       // The "ac" is the ActionContext object to which
       // this addon is about to be attached.
     }
     // Use the prototype property to add
     // methods and other properties
     CheeseAcAddon.prototype = {
     // Put methods and properties here
     }
     // Assign the constructor of the addon to a
     // namespace of Y.mojito.addons.ac
     Y.mojito.addons.ac.cheddar = CheeseAcAddon;
     // Optional: 'requires' array could include other
     // YUI modules if needed.
   }, '0.0.1', {requires: ['']});

.. _addons_creating-ex:

Example Addon
#############

In this example addon, the ``YUI.add`` method registers the ``addon-ac-cheese`` plugin. 
The addon has the namespace ``cheese`` and the method ``cheesify``, which is added 
through the ``prototype`` property.

.. code-block:: javascript

   YUI.add('addon-ac-cheese', function(Y, NAME) {
     function CheeseAcAddon(command, adapter, ac) {
       // The "command" is the Mojito internal details
       // for the dispatch of the mojit instance.
       // The "adapter" is the output adapter, containing
       // the "done()", "error()", etc, methods.
       // The "ac" is the ActionContext object to which
       // this addon is about to be attached.
     }
     CheeseAcAddon.prototype = {
       // The "namespace" is where in the ActionContext
       // the user can find this addon.
       namespace: 'cheese',
       cheesify: function(obj) {
         var n;
         if (Y.Lang.isString(obj)) {
           return 'cheesy ' + obj;
         }
         for (n in obj) {
           if (obj.hasOwnProperty(n)) {
             obj[n] = this.cheesify(obj[n]);
           }
         }
         return obj;
       }
     };
     // If this addon depends on another, that can
     // be specified here. Circular dependencies are not
     // supported or automatically detected,
     // so please be careful.
     CheeseAcAddon.dependsOn = ['http'];
     Y.mojito.addons.ac.cheddar = CheeseAcAddon;
   }, '0.0.1', {});

.. _addons-using:

Using Your Addon
----------------

The addon in `Example Addon`_ registered the plugin ``addon-ac-cheese`` and made its 
constructor available through the namespace ``cheese``. The addons are not automatically 
added to the ``ActionContext`` object, but to access an addon, your controller needs to 
add the YUI plugin name to the ``requires`` array. The YUI plugin name is the string 
passed to ``YUI.add`` in the addon. To invoke the addon methods, call the methods from 
the namespace defined in the ``prototype`` property of the addon's constructor. In our 
addon, we defined the namespace ``cheese`` (``"namespace": "cheese"``).

.. code-block:: javascript

   YUI.add('Foo', function(Y, NAME) {
     Y.namespace('mojito.controllers')[NAME] = { 
       index: function(ac) {
         // Use the type 'cheese' and then the
         // the addon function 'cheesify'
         var cheesy = ac.cheese.cheesify({
           food: "nachos",
           things: "jokes"
         });
       }
     };
     // To use your addon, add 'addon-ac-cheese' to your
     // 'requires' array.
   }, '0.0.1', {requires: [ 'mojito', 'addon-ac-cheese']});


.. _mojito_extending-middleware:

Middleware
==========

.. _middleware-intro:

Introduction
------------

Middleware is code that can handle (or modify) the HTTP request in the server. Because 
Mojito middleware is based on the HTTP middleware 
`Connect <http://senchalabs.github.com/connect/>`_,  the code must follow the Connect API. 
Also, because each piece of middleware is a Node.js module, it should use 
``module.exports`` to create a function to handle incoming requests.

.. _middleware-configure:

Configuring Middleware
----------------------

To use middleware, the path to its code must be listed in the ``middleware`` array in 
``application.json``. The path can be marked as relative to the application by prefixing 
it with "./".

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "middleware": [
         "./middleware/static.js"
       ],
       "specs": {
         "hello": {
           "type": "HelloMojit"
         }
       }
     }
   ]

.. _middleware-loc:

Location of Middleware
----------------------

We suggest that middleware be located in the directory ``{app_dir}/middleware/``, but 
this is only a convention and not required. The name of the file is not important.

.. _middleware-ex:

Example
-------

The simple example below of middleware intercepts an HTTP request and lowercases URLs 
containing the string "module_" before the URLs are received by the server.

.. code-block:: javascript

   module.exports = function (req, res, next) {
     if (req.url.indexOf('module_') > -1) {
       req.url = req.url.toLowerCase();
     }
     next();
   };


.. _mojito_extending-libraries:

Libraries
=========

Mojito allows you to use YUI libraries, external libraries, or customized libraries. To 
use any library in Mojito, you need to specify the module in either the ``requires`` 
array in the controller for YUI libraries or using the ``require`` method for 
Node.js modules.

.. _libraries-yui:

YUI Library
-----------

YUI libraries can be made available at the application or the mojit level. Each file can 
only have one ``YUI.add`` statement. Other components, such as controllers, models, etc., 
needing the library should specify the YUI module name in the ``requires`` array.

.. _libraries_yui-naming:

File Naming Convention
######################

The file name of a YUI module should have the following syntax where ``{yui_mod_name}`` 
is a unique YUI module name defined by the user and ``{affinity}`` is ``server``, 
``common``, or ``client``.

``{yui_mod_name}.{affinity}.js``

.. _libraries_yui-loc:

Location of YUI Modules
#######################

Application-level YUI modules should be placed in the following directory:

``{app_dir}/autoload/``

Mojit-level YUI modules should be placed in the following directory:

``{mojit_dir}/autoload/``

.. _libraries_yui-creating:

Creating a YUI Module
#####################

To create a YUI module, your code needs to have the following:

- ``YUI.add`` statement to add the module to YUI
- constructor for the module
- methods created through the ``prototype`` object

.. _yui_creating-add:

Adding the Module to YUI
************************

Your YUI module must have a ``YUI.add`` statement that adds the module to YUI. Below is 
the basic syntax of the ``YUI.add`` statement:

``YUI.add('{module-name', function(Y){ ... }``

For example, the ``send-photos`` YUI module would use the following:

``YUI.add('send-photos', function(Y){ ... }``

.. _yui_creating_add-constructor:

Constructor
+++++++++++

The constructor of a YUI module is basically a new namespace that is assigned a function. 
The new namespace is created with the following syntax:

``Y.namespace('mojito').{constructor_name} = function() { ... }``

For example, to create the constructor ``HELLO`` for a YUI module, you would could use 
the following:

``Y.namespace('mojito').HELLO = function() { this.greeting="hello"; }``

.. _yui_creating_add-ex:

Example
+++++++

In the code example below, the ``create_id`` function becomes the constructor for the 
``UID`` namespace. This will let you create an instance, and the ``prototype`` object 
then allows you to access the method ``log`` from that instance.

.. code-block:: javascript

   YUI.add('hello-uid', function(Y){
     function create_id(){
       var uid = Math.floor(Math.random()*10000000);
       this.uid = uid;
     }
     create_id.prototype = {
       log: function(user_name){
         Y.log(user_name + "'s UID is " + '['+this.uid+']');
       }
     }
     Y.namespace('mojito').UID = create_id;
   });

.. _libraries_yui-using:

Using the YUI Module
####################

In the example mojit controller below, the YUI module ``hello-uid`` is loaded because the 
module is in the ``requires`` array. An instance of the module is created and saved in 
the ``init`` function. With the saved instance, the ``log`` method from the ``hello-uid`` 
module can be called:

.. code-block:: javascript

   YUI.add('HelloMojit', function(Y, NAME) {
     Y.namespace('mojito.controllers')[NAME] = { 
       init: function(config) {
         this.config = config;
         this.uid = new Y.mojito.UID();
       },
       index: function(ac) {
         var user_name = ac.params.getFromMerged("name") || "User";
         this.uid.log(user_name);
         ac.done('Hello World!');
       }
     };
   }, '0.0.1', {requires: ['hello-uid']});


.. _libraries-other:

Other Libraries
---------------

Non-YUI libraries can also be used at either the application or mojit level. Because 
Node.js and **not** Mojito will read the contents of the library files, you need to use 
``require()`` to include the library. Mojito will only confirm that the files exist.

.. _libraries-loc:

Location of Non-YUI Libraries
#############################

Application-level libraries should be placed in the following directory:

``{app_dir}/libs/``

Mojit-level libraries should be placed in the following directory:

``{mojit_dir}/libs``

.. _mojito_extending-view_engines:

View Engines
============

.. _view_engines-overview:

Overview
--------

A view engine is the piece of code that takes the data returned by a controller and 
applies it to a view. This is most often done by interpreting the view as a template. 
View engines in Mojito can be at either the application or mojit level. Application-level 
view engines are available to all mojits.

The view engine consists of an addon that we will refer to as the view engine addon to 
differentiate it from other addons. The view engine addon can include code that renders 
templates or use a rendering engine, such as 
`Embedded JavaScript (EJS) http://embeddedjs.com/>`_, to render templates. In the 
latter case, the view engine addon acts as an interface between the 
Mojito framework and the rendering engine. 

In the following sections, we will be discussing how to create a view engine addon that 
relies on a rendering engine, not how to write code that renders templates.

.. _view_engines_overview-terms:

Terminology
###########

The following list may help clarify the meaning of commonly used terms in this section.

- **view engine** - The code used to apply data to a view. In Mojito, the view engine 
  consists of a view engine addon. 
- **view engine addon** - The Mojito addon that compiles and renders templates. The addon 
  typically relies on a rendering engine to compile and render templates, but may include 
  code to do the compilation and rendering. 
- **rendering engine** - The rendering engine is typically an off-the-shelf technology, 
  such as `Dust <http://akdubya.github.com/dustjs>`_, `Jade <http://jade-lang.com/>`_, or 
  `EJS <http://embeddedjs.com/>`_, that renders the template into markup for an HTML page.
- **template** - The template file (chosen by the controller) that contains tags and HTML
  that is rendered into markup for an HTML page.

.. _view_engines-create_steps:

General Steps for Creating View Engines
---------------------------------------

#. Use ``npm`` to install the rendering engine into your Mojito application or copy it 
   into a directory such as ``{app_dir}/libs``.
#. Create a view engine addon that references the rendering engine with a ``require`` 
   statement and meets the :ref:`requirements of the view engine addon <reqs_ve_addon>`.
#. Create templates using the templates for the rendering engine and place them in 
   ``{mojit_dir}/views``. 

.. _view_engines-naming:

File Naming Conventions 
-----------------------

.. _view_engines_naming-ve_addon:

View Engine Addon
#################

The name of the addon should have the following syntax where ``{view_engine_name}`` is the 
view engine and ``{affinity}`` is ``server``, ``common``, or ``client``.

``{view_engine_name}.{affinity}.js``


.. _view_engines_naming-template:

Template
########

The name of the template should have the following syntax where ``{view_engine_name}`` 
should be the same as the ``{view_engine_name}`` in the file name of the view engine 
addon.

``{view}.{view_engine_name}.html``


.. _view_engines-loc:

File Locations
--------------

.. _view_engines_loc-app-level:

Application-Level View Engine Addons
####################################

``{app_dir}/addons/view-engines``


.. _view_engines_loc-mojit-level:

Mojit-Level View Engine Addons
##############################

``{mojit_dir}/addons/view-engines``

.. _view_engines_loc-engine:

Rendering Engines
#################

Mojito does not require rendering engines to be in a specific location. The recommended 
practice is to use ``npm`` to install rendering engines into the ``node_modules`` 
directory or copy the rendering engine into the ``libs`` directory as shown below:

``{app_dir}/node_modules/{rendering_engine}``

``{app_dir}/libs/{rendering_engine}``

``{mojit_dir}/libs/{rendering_engine}}``

.. note:: If you are using mojit-level view engine addons, the rendering engine should be 
          at the mojit level as well, such as ``{mojit_dir}/libs/{rendering_engine}``.


.. _reqs_ve_addon:

Requirements of the View Engine Addon
-------------------------------------

The view engine addon must have the following:

- a ``YUI.add`` statement to register the addon. For example:

   .. code-block:: javascript

      YUI.add('addons-viewengine-hb', function(Y, NAME) {
    
        // The addon name 'addons-viewengine-hb' is registered by YUI.add
    
      }, '0.1.0', {requires: []});

- an object that is assigned to ``Y.mojito.addons.viewEngines.{view_engine_name}`` as seen 
  below:
   
   .. code-block:: javascript
      
      ...
        
        function EjsAdapter(viewId) {
          this.viewId = viewId;
        }
      ...
      Y.namespace('mojito.addons.viewEngines').ejs = EjsAdapter;
      
- a prototype of the object has the following two methods ``render`` and ``compiler`` as 
  shown below:

   .. code-block:: javascript
   
      ...
        
        EjsAdapter.prototype = {
       
          render: function(data, mojitType, tmpl, adapter, meta, more) {
           ...
          },
          compiler: function(tmpl) {
            ...
          }
          ...

.. _reqs_ve_addon-methods:    
   
Methods for the View Engine Addon
---------------------------------

.. _ve_addon_methods-render:   

render
######

.. _methods_render-desc:   

Description
***********

Sends a rendered template as the first argument to the methods ``adapter.flush`` or 
``adapter.done``.

.. _methods_render-sig:   

Signature
*********

``render(data, mojitType, tmpl, adapter, meta, more)``

.. _methods_render-params:   

Parameters
**********

- ``data`` (Object) - the data to render.
- ``mojitType`` (String) - the mojit whose view is being rendered.
- ``tmpl`` - (String) - path to template to render.
- ``adapter`` (Object) - the output adapter to use.
- ``meta`` (Object) - the metadata that should be passed as the second argument to 
  ``adapter.flush`` or ``adapter.done``
- ``more`` (Boolean) - if ``true``, the addon should call the method ``adapter.flush``, 
  and if ``false``, call the method ``adapter.done``.

.. _methods_render-return:   

Return
******

None

.. _ve_addon_methods-compiler:

compiler
########

.. _methods_compiler-desc:  

Description
***********

Returns the compiled template. The ``compiler`` method is only used when you run the 
following command: ``mojito compile views``

.. _methods_compiler-sig: 

Signature
*********

``compile(tmpl)``

.. _methods_compiler-params: 

Parameters
**********

- ``tmpl`` (String) - path to the template that is to be rendered

.. _methods_compiler-return: 

Return
******

``String`` - compiled template

.. _ve_addon-view:   

View Engine Addon and Its View
------------------------------

A naming convention associates a view engine and its templates. For example, the view 
engine ``{mojit_dir}/addons/view-engines/big_engine.server.js`` will be used to render the 
template ``{mojit_dir}/views/foo.big_engine.html``. Having two templates that only differ 
by the view engine will cause an error because Mojito will not be able to decide which 
view engine to use (which to prioritize above the other) to render the template.

.. _ve_addon-view_ex: 

Example
#######

.. _ve_addon-view_ex-ejs: 

Embedded JavaScript (EJS)
*************************

The following example is of the `EJS view engine <http://embeddedjs.com/>`_. 

.. _ve_addon-view_ex-ejs_engine: 

EJS Rendering Engine
++++++++++++++++++++

You install ``ejs`` locally with ``npm`` so that the EJS rendering engine is installed in
the ``node_modules`` directory as seen below:


::

   {app_dir}/node_modules
   └── ejs
       ├── History.md
       ├── Makefile
       ├── Readme.md
       ├── benchmark.js
       ├── ejs.js
       ├── ejs.min.js
       ├── examples
       ├── index.js
       ├── lib
       ├── package.json
       ├── support
       └── test

.. _ejs_engine-ex: 

View Engine Addon
+++++++++++++++++

``{app_dir}/addons/view-engines/ejs.server.js``


.. code-block:: javascript

   YUI.add('addons-viewengine-ejs', function(Y, NAME) {
	
     var ejs = require('ejs'),
     fs = require('fs');
     function EjsAdapter(viewId) {
       this.viewId = viewId;
     }
     EjsAdapter.prototype = {
        
       render: function(data, mojitType, tmpl, adapter, meta, more) {
         var me = this,
         handleRender = function(output) {
		    
           output.addListener('data', function(c) {
	     adapter.flush(c, meta);
           });
	   output.addListener('end', function() {
	     if (!more) {
	       adapter.done('', meta);
	     }
	   });
	 };
	 Y.log('Rendering template "' + tmpl + '"', 'mojito', NAME);
	 var result = ejs.render(this.compiler(tmpl),data);
         adapter.done(result,meta);
       },
       compiler: function(tmpl) {
         return fs.readFileSync(tmpl, 'utf8');
       }
     };
     Y.namespace('mojito.addons.viewEngines').ejs = EjsAdapter;
   }, '0.1.0', {requires: []});    

.. _ejs_engine-template:

Template
++++++++

``{app_dir}/mojits/{mojit_name}/views/foo.ejs.html``

.. code-block:: html

   <h2> <%= title %></h2>
   <div id=<%= mojit_view_id %>>
     <h3><%= ul.title %></h3>
     <ul>
     <% for(var i=0;i<view_engines.length;i++){ %>
       <li><%= view_engines[i] %></li>
     <% } %>
     </ul>
   </div> 
