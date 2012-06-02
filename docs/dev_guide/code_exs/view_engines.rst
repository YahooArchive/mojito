
======================================
Creating and Using a View Engine Addon 
======================================

**Time Estimate:** 15 minutes

**Difficulty Level:** Intermediate

Summary
#######

This example shows how to install a third-party rendering engine, create a view engine addon 
that uses the installed rendering engine and a view template. 

This example shows how how to install a third-party rendering engine, create a view engine addon 
that uses that rendering engine, and create a view template for the view engine.

The following topics will be covered:

- using ``npm`` to install the rendering engine
- creating a view engine addon
- using Handlebars in the view template


Implementation Notes
####################

Before you create your application, you should take a look at the following sections to better understand
how the application works. The focus here is to give you a practical example that you can use
to add your own view engines and also to show some of important points of using view engines in Mojito applications.
For more comprehensive but less practical documentation, see `Mojito Topics: View Engines <../topics/mojito_extensions.html#view-engines>`_.


What Is a View Engine?
----------------------

A view engine is code that applies data returned by the controller to a view. This is most often done by interpreting the 
view as a template. View engines in Mojito can function at either the application or mojit level. This example
uses an application-level view engine addon, allowing multiple mojits to use it although the example only uses one mojit.


Installing a Rendering Engine
-----------------------------

You could write your own rendering engine or copy code into your Mojito application, but this example 
follows the most common use case of installing a rendering engine with ``npm``. We will be 
installing the rendering engine `Handlebars <http://handlebarsjs.com>`_ with ``npm``.

Because your Mojito application is simply a ``npm`` module, you can have a ``node_modules`` directory for locally
installing other modules. Thus, from your application directory, you would use the following ``npm`` command to install ``handlebars``:

``app_dir/ $ npm install handlebars``

After you have installed ``handlebars``, a ``node_modules`` directory will be created with the contents similar to the following:

::

   node_modules
   └── handlebars
       ├── LICENSE
       ├── README.markdown
       ├── bin
       │   └── handlebars
       ├── lib
       │   ├── handlebars
       │   │   ├── base.js
       │   │   ├── compiler
       │   │   │   ├── ast.js
       │   │   │   ├── base.js
       │   │   │   ├── compiler.js
       │   │   │   ├── index.js
       │   │   │   ├── parser.js
       │   │   │   ├── printer.js
       │   │   │   └── visitor.js
       │   │   ├── runtime.js
       │   │   └── utils.js
       │   └── handlebars.js
       ├── node_modules
       ...
       
       
Creating the View Engine Addon
------------------------------

The view engine addon like other addons is simply a YUI module that lives in the ``addons/view-engines`` directory. For the application-level view engine addons that
this example is using, the view engine addon will be in ``{app_dir}/addons/view-engines``.

Requirements
~~~~~~~~~~~~

The view engine addon must have the following:

- a ``YUI.add`` statement to register the addon. For example, we register the view engine addon with the
  name ``addons-viewengine-hb`` in our code example as seen below.

   .. code-block:: javascript

      YUI.add('addons-viewengine-hb', function(Y, NAME) {
    
        // The addon name 'addons-viewengine-hb' is registered by YUI.add
    
      }, '0.1.0', {requires: []});
      
- a prototype of the object has the following two methods ``render`` and ``compiler`` as shown below. We will look
  at the ``render`` and ``compile`` methods more closely in the next section.

   .. code-block:: javascript
   
      ...
        
      HbAdapter.prototype = {
       
        render: function(data, mojitType, tmpl, adapter, meta, more) {
          ...
        },
        compiler: function(tmpl) {
          ...
        }
        ...      
        
- an object that is assigned to ``Y.mojito.addons.viewEngines.{view_engine_name}``. In our example,
  the constructor ``HbAdapter`` is assigned to the namespace ``Y.namespace('mojito.addons.viewEngines').hb`` or
  ``Y.mojito.addons.viewEngines.hb``.
   
   .. code-block:: javascript
      
      ...
        
      function HbAdapter(viewId) {
        this.viewId = viewId;
      }
      ...
      Y.namespace('mojito.addons.viewEngines').hb = HbAdapter;
      

render and compile
~~~~~~~~~~~~~~~~~~

The ``render`` method renders the template and sends the output to the methods ``adapter.flush`` or ``adapter.done``
that execute and return the page to the client.

The implementation of how the ``render`` method is up to the developer. You could write code or use a
library to render the template, but in this example we use the instance ``hb`` of ``handlebars`` to
compile the view.

.. code-block:: javascript

     ...
     
     /**
     * Renders the Handlebars template using the data provided.
     * @method render
     * @param {object} data The data to render.
     * @param {string} mojitType The name of the mojit type.
     * @param {string} tmpl The name of the template to render.
     * @param {object} adapter The output adapter to use.
     * @param {object} meta Optional metadata.
     * @param {boolean} more Whether there will be more content later.
     */
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
       var template = hb.compile(this.compiler(tmpl));
       var result = template(data);
       console.log(result);
       adapter.done(result,meta);
 
     },
     ...
        
The ``compile`` method is required to run the command ``mojito compile views``. In our example, 
the ``compile`` method also reads the view template file and returns a string to ``render``
so that it can be compiled by ``handlebars``. 

.. code-block:: javascript

   ...
   
   compiler: function(tmpl) {
     return fs.readFileSync(tmpl, 'utf8');
   }

The Mustache and Handlebars rendering engines compile templates into an executable JavaScript function, 
but the implementation of the ``compile`` method in the view engine addon is up to the developer. 
In the above code snippet, the ``compile`` method simply returns the template file to the
``render`` method, where the instance of the Handlebars rendering engine calls ``compile`` to render 
the template file into a JavaScript function. The implementation of the ``compile`` method in the 
addon could have been written to call ``hb.compile`` and return the JavaScript function to ``render``.

Handlebar Templates
-------------------

Handlebars are similar to Mustache tags, but have some additional features such as registering help function and built-in block helpers. 
Mustache templates are actually compatible with Handlebars, so both view templates used in the example could have been rendered by the view 
engine addon for Handlebars. We're just going to look at some of the Handlebars expressions used in this example, so please see 
`Handlebars expressions <http://handlebarsjs.com/expressions.html>`_ for more comprehensive documentation.


One of the things that we mentioned already is block helpers, which help you iterate through arrays. 
In this example, the view template uses the block helper ``#each`` (shown below) to iterate through the array
of strings containing some of the available view engine names such as Jade, EJS, etc.

.. code-block:: html
   
   <ul>
   {{#each view_engines}}
     <li>{{this}}</li>
   {{/each}} 
   </ul>

Another interesting block helper used in this example is ``#with``, which will invoke
a block when given a specified context. For example, in the code snippet below,
if the ``ul`` object is given, the property ``title`` is evaluated. 

.. code-block:: html

   {{#with ul}}
     <h3>{{title}}</h3>
   {{/with}}



Setting Up this Example
#######################


To set up and run ``adding_view_engines``:

#. Create your application.

   ``$ mojito create app adding_view_engines``

To set up and run ``view_engines``:

#. Create your application.

   ``$ mojito create app view_engine``

#. Change to the application directory.

#. Create your mojit.

   ``$ mojito create mojit myMojit``

#. To specify that your application use ``myMojit``, replace the code in ``application.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": [ "master" ],
          "specs": {
            "myMojit": {
              "type": "myMojit"
            }
          }
        }
      ]


#. To configure routing so controller functions using different view templates are used, create the file ``routes.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": [ "master" ],
          "mu": {
            "verbs": ["get"],
            "path": "/",
            "call": "myMojit.default_ve"
          },
          "hb": {
            "verbs": ["get"],
            "path": "/hb",
            "call": "myMojit.added_ve"
          }
        }
      ]

#. Install the Handlebars module.

   ``$ npm install handlebars --local``

#. Create the addons directory for your view engine addon.

   ``$ mkdir -p addons/view-engines``
   
#. Change to the ``addons/view-engines`` directory that you created.

#. Create the view engine addon file ``hb.server.js`` with the following code:

   .. code-block:: javascript
   
      YUI.add('addons-viewengine-hb', function(Y, NAME) {
	
        var hb = require('handlebars'),
        fs = require('fs');
        function HbAdapter(viewId) {
          this.viewId = viewId;
        }
        HbAdapter.prototype = {
        
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
		    var template = hb.compile(this.compiler(tmpl));
		    var result = template(data);
		    console.log(result);
		    adapter.done(result,meta);
		  },
		  compiler: function(tmpl) {
		    return fs.readFileSync(tmpl, 'utf8');
		  }
		};
		Y.namespace('mojito.addons.viewEngines').hb = HbAdapter;
      }, '0.1.0', {requires: []});

#. Change to the ``adding_view_engines/mojits/myMojit`` directory.

#. Replace the code in ``controller.server.js`` with the following:

   .. code-block:: javascript
   
      YUI.add('myMojit', function(Y, NAME) {

        Y.mojito.controllers[NAME] = {
  
          init: function(config) {
            this.config = config;
          },
          default_ve: function(ac) {
            ac.done({
              "title": "Mustache at work!",
              "view_engines": [ 
                { "name": "Handlebars"},
                {"name": "EJS"},
                {"name": "Jade"}, 
                {"name": "dust"},
                {"name": "underscore" }
              ],
              "ul": { "title": 'Here are some of the other available rendering engines:' },
            });
          },
          added_ve: function(ac) {
            ac.done({
              "title": "Handlebars at work!",
              "view_engines": [ "Mustache","EJS","Jade", "dust","underscore" ],
              "ul": { "title": 'Here are some of the other available rendering engines:' }
            });  
          }
        };
      }, '0.0.1', {requires: ['mojito', 'myMojitModelFoo']});
 
#. Create the view template ``views/default_ve.mu.html`` that uses Mustache tags with the following:

   .. code-block:: html
   
      <h2>{{title}}</h2>
      <div id="{{mojit_view_id}}">
        <h3>
        {{#ul}}
          {{title}} 
        {{/ul}}
        {{^ul}}
          Besides Mustache, here are some other rendering engines:
        {{/ul}}  
        </h3>
        <ul>
        {{#view_engines}}
          <li>{{name}}</li>
        {{/view_engines}} 
        </ul>
      </div>

#. Create the view template ``views/added_ve.hb.html`` that uses Handlebars with the following:

   .. code-block:: html
   
      <h2>{{title}}</h2>
      <div id="{{mojit_view_id}}">
      {{#with ul}}
        <h3>{{title}}</h3>
      {{/with}}
        <ul>
        {{#each view_engines}}
          <li>{{this}}</li>
        {{/each}} 
        </ul>
      </div>

#. From your application directory, start Mojito.

   ``$ mojito start``
   
#. Open the following URL in your browser to see the view template rendered by the Mustache rendering engine.   

   `http://localhost:8666/ <http://localhost:8666/>`_
   
#. Now see the view template rendered by the Handlebars rendering engine at the following URL:

   `http://localhost:8666/hb <http://localhost:8666/hb>`_   

#. Great, your application is using two different rendering engines. You should now be ready to add your own view engine that uses a rendering engine such as Jade.   


Source Code
###########

- `View Engines <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/adding_view_engines/>`_
- `View Engine Addon <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/adding_view_engines/addons/view-engines/hb.server.js>`_
- `View Templates <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/adding_view_engines/mojits/myMojit/views/>`_