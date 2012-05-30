

======================================
Creating and Using a View Engine Addon 
======================================

**Time Estimate:** 15 minutes

**Difficulty Level:** Intermediate

Summary
#######

This example shows how how to install a third-party rendering engine, create a view engine addon 
that uses that rendering engine, and create a view template for the view engine.

The following topics will be covered:

- using ``npm`` to install the rendering engine
- creating a view engine addon
- using Handlebars in the view template



Implementation Notes
####################


What Is a View Engine?
----------------------



Installing a Rendering Engine
-----------------------------

Creating the View Engine Addon
------------------------------

Handlebar Template
------------------

Setting Up this Example
#######################

To set up and run ``view_engines``:

#. Create your application.

   ``$ mojito create app view_engine``

#. Change to the application directory.

#. Create your mojit.

   ``$ mojito create mojit myMojit``

#. To specify that your application use ``SimpleMojit``, replace the code in ``application.json`` with the following:

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

#. To configure routing, create the file ``routes.json`` with the following:

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
   
#. Change to the ``view-engines`` directory that you created.


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
				  Y.log('render complete for view "' +
									me.viewId + '"',
									'mojito', 'qeperf');
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

#. Change to your mojit ``myMojit`` directory.

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
   
#. Great, your application is using two different rendering engines. You should now be ready to add your own view engine such as Jade.   

Source Code
###########

- `View Engines <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/view_engines/>`_
- `View Engine Addon <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/view_engines/addons/view-engines/hb.server.js>`_
- `View Templates <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/view_engines/mojits/myMojit/views/>`_


