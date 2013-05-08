===============================
7. Mojito on the Client (Draft)
===============================

Introduction
============

Although we’ve created client-side code by deploying controllers, models, framework 
code, and templates to the client, we have written client code that works with the 
DOM. Mojito has a special way for you to write code specifically for DOM binding 
and manipulation called binders. Mojits can have one or more binders that are 
deployed to the client (they cannot run on the server). We’re going to create 
some binders to make our dashboard application more interactive.

Estimated Time
--------------

15 minutes

What We’ll Cover
----------------

- requirements for using binders
- allow event handlers to attach to the mojit DOM node
- communicate with other mojits on the page
- execute actions on the mojit that the binder is attached to
- refreshing templates with binders
- destroying child mojits with binders

Final Product
-------------

In the screenshot, you can see that when ... the menu...


Image here!


Before Starting
---------------

Review of the Last Module
#########################

In the last module, we covered writing unit and functional tests for Mojito. 
We looked at both the YUI Test and Arrow testing frameworks and also fleshed 
out our dashboard application. In summary, we looked at the following:

- structure of unit tests
- YUI Test overview: test suite, test cases, and assertions
- controller and model unit tests
- introduction to Arrow
- writing YUI Tests for Arrow
- running functional tests with Arrow


Setting Up
##########

``$ cp -r 06_testing 07_binders``

Source Code for Example
-----------------------

[app_part{x}](http://github.com/yahoo/mojito/examples/quickstart_guide/app_part{x})

Lesson: Binders
===============

Introduction
------------

A mojit may have zero, one, or many binders within the binders directory. Each binder 
will be deployed to the browser along with the rest of the mojit code, where the 
client-side Mojito runtime will call it appropriately. The view used to generate 
output determines which binder is used. Thus, if the simple view is used, the 
bindersimple.js is used. This can be overridden by setting view.binder in the meta 
argument to ac.done. If no binder matches the view, then no binder is used.

Location
--------

``{app_name}/mojits/{mojit_name}/binders/{action_name}.js``

Requirements for Using Binders
------------------------------

The top-level mojit instance defined in application.json is of type HTMLFrameMojit 
or your own frame mojit. See HTMLFrameMojit for an introduction and example configuration.
Your application is configured to deploy code to the client with the deploy property in
``application.json``. See Configuring Applications to Be Deployed to Client for more 
information. The template files (e.g., index.hb.html) have containers (div elements)
that have the id attribute assigned the value {{mojit_view_id}}. 
For example: ``<div id={{mojit_view_id}}>``. The attribute value ``{{mojit_view_id}}`` 
allows binders to attach themselves to the DOM.

Binder Code
-----------

Like controllers and models, binders register a module name with YUI.add and their own 
namespace. Binders have the two essential functions init and bind. The init function 
initializes the binder and contains the mojitProxy object, which we will discuss in 
detail soon. The bind function as you might imagine, allows the binder code to be 
attached to the DOM.

The example binder below shows its basic structure:

.. code-block:: javascript

   YUI.add('blogMojitBinderIndex', function(Y, NAME) {
     Y.namespace('mojito.binders')[NAME] = {
       init: function(mojitProxy) {
         this.mojitProxy = mojitProxy;
       },
       bind: function(node) {
       }
     };
   }, '0.0.1', {requires: ['mojito-client']});

When Are Binders Executed?
##########################

The binder ``index.js`` will be created whenever the index function of the controller is 
executed. and its corresponding DOM node is attached to a client page. Mojito will 
select that DOM node and pass it into the bind function. This allows you to write 
code to capture UI events and interact with Mojito or other mojit binders.

Binder Functions
################

init
****

The init method is called with an instance of a mojit proxy specific for this mojit 
binder instance. The mojit proxy can be used at this point to listen for events. It is 
typical to store the mojit proxy for later use as well. The mojit proxy is the only 
gateway back into the Mojito framework for your binder.

bind
****

The bind method is passed a Y.Node instance that wraps the DOM node representing this mojit 
instance within the DOM. It will be called after all other binders on the page have been 
constructed and their initmethods have been called. The mojit proxy can be used at this 
point to broadcast events. Users should attach DOM event handlers in bind to capture user 
interactions.


mojitProxy Object
#################

Each binder, when constructed by Mojito on the client, is given a proxy object for interactions 
with the mojit it represents as well as with other mojits on the page. This mojitProxy should 
be saved with this for use in the other parts of the binder.

Properties
**********

- ``config`` - the instance specification for the mojit linked to the binder
- ``context`` - environment information such as language, device, region, site, etc.
- ``children`` - the children of the mojit, which is defined in application.json.
- ``type`` - the name of the mojit that attached the binder to the DOM.

From the mojitProxy, you can access properties that use the interface and provides the 
information below:

.. code-block:: javascript

   YUI.add('githubModel', function(Y, NAME) {

     // The namespace for the model that passes the
     // name.
     Y.mojito.models[NAME] = {
       init: function(config) {
         this.config = config;
       },
       getData: function(params, callback) {
         // Model function to get data...
       },
       ... 
     };
   }, '0.0.1', {requires: ['yql']});

API Methods
###########

In addition to  the properties of the mojitProxy object, you can also use the methods 
of the ``MojitProxy`` class so that the binder can interact with the controller and 
other mojits. We’re going to focus on a core set of the available methods and recommend 
you look at the API documentation to complete the picture.

In the next few sections, we’ll be using the following MojitProxy methods. The methods 
broadcast and listen allow binder code to communicate with each other. The invoke function 
allows binder to call controller functions. The methods refreshView and render help binders 
to update content of a template.

Binder-to-Binder Communication 
##############################

- ``broadcast`` - Used by mojit binders to broadcast a message between mojits.
- ``listen`` - Allows mojit binders to register to listen to other mojit events.

Binder-to-Controller Communication
##################################

``invoke`` - Used by the mojit binders to invoke actions on themselves within Mojito. 

Updating DOM / Rendering Data
#############################

- ``refreshView`` - Refreshes the current DOM view for this binder without recreating the binder instance. 
  Will call the binder's ``onRefreshView`` function when complete with the new Y.Node and HTMLElement objects.
- ``render`` - This method renders the "data" provided into the "View" specified. The "view" must be the name 
  of one of the files in the current Mojits "views" folder. Returns via the callback.

Invoking Controller Methods
###########################

The invoke method is critical because it allows user-driven events to trigger the 
execution of controller functions. In the binder snippet below, the invoke 
method calls the controller function show with parameters. The returned value is 
used to update the DOM. This is the typical use of the invoke method. The controller 
may need to get data from the model, so the flow would be 
binder->controller->model->controller->binder.

.. code-block:: javascript 

   ...
     init: function(mojitProxy) {
       var self = this;
       this.mojitProxy = mojitProxy;
       var params = {
         url: {
           url: “http://example.com”
         }
       };
       mojitProxy.invoke('show', { params: params }, function(err, markup) {
         self.node.setContent(markup);
       });
     });
   },
   ...

Client to Server Communication
##############################

If the controller has not been deployed to the client, the binder sends a request to the 
server through a special path that Mojito creates a tunnel URL that allows the client to 
make HTTP requests from the client to the server. The default path is http://domain:8666/tunnel, 
but you can configure the name of the path.

Broadcasting and Listening for Events
#####################################

The broadcast method lets you emit custom events that other mojit binders can listen to and 
respond.  In this way, mojits can respond to user events and communicate with each other.

The mojit binder below broadcasts the event ‘fire-link’ when a user clicks on a hyperlink in a 
unordered list. 

.. code-block:: javascript

   ...
     bind: function (node) {
       var mp = this.mp;
       this.node = node;
       // capture all events on "ul li a"
       this.node.all('ul li a').on('click', function(evt) {
         var url = evt.currentTarget.get('href');
         evt.halt();
         Y.log('Triggering fire-link event: ' + url, 'info', NAME);
         mp.broadcast('fire-link', {url: url});
       });
     } 
   ...

Another binder listening for the ‘fire-link’ event then responds by emitting the event ‘broadcast-link’. 

.. code-block:: javascript

   ...
     init: function (mojitProxy) {
       var mp = this.mp = this.mojitProxy = mojitProxy;
       this.mojitProxy.listen('fire-link', function(payload) {
         var c = mp.getChildren(),
             receiverID = c.receiver.viewId;
             mojitProxy.broadcast('broadcast-link', {url: payload.data.url}, { target: {viewId: receiverID }});
             Y.log('broadcasted event to child mojit: ' + payload.data.url, 'info', NAME);
       });
     },
   ...

Refreshing Views and Rendering Data
###################################

Often all you want your binder to do is to refresh its associated view. From the 
``mojitProxy`` object, you can call the refreshView method to render a new DOM node 
for the current mojit and its children, as well as reattach all of the existing 
binders to their new nodes within the new markup. Because all binder instances 
are retained, state can be stored within a binder’s scope.

.. code-block:: javascript

   ...
     mojitProxy.listen('flickr-image-detail', function(payload) {
       var urlParams = Y.mojito.util.copy(mojitProxy.context);
       var routeParams = {
         image: payload.data.id
       };
       mojitProxy.refreshView({
         params: {
           url: urlParams,
           route: routeParams
         }
       });
     });
   ...

Creating the Application
========================

#. After you have copied the application that you made in the last module (see Setting Up), 
   change into the application ``05_getting_data``.
#. Let’s create the Twitter mojits that get Twitter data for us.

   ``$ mojito create mojit twitterMojit``

#. Change to the models directory of ``twitterMojit``. We’re going to deal with getting Twitter 
   data first.
#. Rename the file ``foo.server.js`` to ``twitter.server.js`` and then change the registered 
   module name to ‘TwitterSearchModel’.
#. Open twitter.server.js in an editor, and modify the method getData, so that it looks 
   like the snippet below. As you can see, we pass the URL to the Twitter Search API, the 
   search query, and we configure the call to have a timeout and force the cache to be cleared.

   .. code-block:: javascript

      getData: function(count, cb) {

        var url = 'http://search.twitter.com/search.json';
        var params = {
          q:"@yuilibrary",
          rpp: "6"
        };
        var config = {
          timeout: 5000,
          headers: {
            'Cache-Control': 'max-age=0'
          }
        };
        Y.mojito.lib.REST.GET(url, params, config, function(err, response) {
          if (err) {
            return cb(err);
          }
          var resp = Y.JSON.parse(response._resp.responseText).results;
          cb(null, resp);
        });
      }

#. We also need to add the dependencies to use the REST and JSON modules:

   .. code-block:: javascript

        ...
      }, '0.0.1', {requires: ['mojito', 'mojito-rest-lib','json']});

#. We need to modify the controller to use the TwitterSearchModel. Open 
   ``controller.server.js`` in an editor, add the Models addon, and modify the ``index`` 
   method so that it’s the same as that shown below. The models addon allows you to access 
   our model and call the model function getData.

   .. code-block:: javascript

      ...
        index: function(ac) {
          ac.models.get('TwitterSearchModel').getData({},function(err, data) {
            if (err) {
              ac.error(err);
              return;
            }
            // Add mojit specific css
            ac.assets.addCss('./index.css');
            ac.done({
              title: 'YUI Twitter mentions',
              results: data
            });
          });
        }
      };
    }, '0.0.1', {requires: ['mojito', 'mojito-assets-addon', 'mojito-models-addon']});


#. Let’s replace the content of index.hb.html with the following while we’re here:

   .. code-block:: html
   
      <div id="{{mojit_view_id}}" class="mojit">
        <div class="mod" id="twittermojit">
          <h3>
            <strong>{{title}}</strong>
            <a title="minimize module" class="min" href="#">-</a>
            <a title="close module" class="close" href="#">x</a>
          </h3>
          <div class="inner">
            <ul>
            {{#results}}
              <li>User: {{from_user}} - <span>{{text}}</span></li>
            {{/results}}
            </ul>
          </div>
        </div>
      </div>

#. Let’s turn our attention to the githubMojit. We have been waiting long enough to 
   get GitHub data, but before we change any code, let’s rename the model file to 
   ``yql.server.js``.
#. Now we can edit the file yql.server.js. Open the file in an editor, change the 
   module name to StatsModelYQL, and update the getData function with the code below. 
   Notice that we are using the YQL Open Data Table github.xml, which the YQL module 
   let’s you specify as a query parameter.

   .. code-block:: javascript 

      ...
        getData: function(params, callback) {
          var yqlTable = 'https://raw.github.com/triptych/trib/master/src/yql/github.xml',
          query = "use '{table}' as yahoo.awooldri.github.repo; select watchers,forks from yahoo.awooldri.github.repo where id='yql' and repo='yql-tables'",
          queryParams = {
            table: yqlTable
          },
          cookedQuery = Y.substitute(query, queryParams);
          Y.YQL(cookedQuery, Y.bind(this.onDataReturn, this, callback));
        },
        onDataReturn: function (cb, result) {
          if (typeof result.error === 'undefined') {
            var results = result.query.results.json;
            cb(results);
          } else {
            cb(result.error);
          }
        }
      ...

#. Besides the YQL module, we also used the Substitute module, so make sure to add 
   both of those modules to the requires array:

   .. code-block:: javascript

      }, '0.0.1', {requires: ['yql', 'substitute']});

#. The githubMojit controller needs to get the correct model. We’re also going to 
   simplify the ``index`` function to only use the default template. Modify the 
   ``index`` function so that it’s the same as that below.

   .. code-block:: javascript

      ...
        index: function(ac) {
          var model = ac.models.get('StatsModelYQL');
          Y.log(model);
          model.getData({}, function(data){
            Y.log("githubmojit -index - model.getData:");
            Y.log(data);
            ac.assets.addCss('./index.css');
            ac.done({
              title: "YUI GitHub Stats",
              watchers: data.watchers,
              forks: data.forks
            });
          });
        }
      ...

#. We’re going to update our template to look more like the Twitter template. 
   So, go ahead and replace the content of index.hb.html with the following:

   .. code-block:: html

      <div id="{{mojit_view_id}}" class="mojit">
        <div class="mod" id="githubmojit">
          <h3>
            <strong>{{title}}</strong>
            <a title="minimize module" class="min" href="#">-</a>
            <a title="close module" class="close" href="#">x</a>
          </h3>
          <div class="inner">
            <div>Github watchers: <span>{{watchers}}</span></div>
            <div>Github forks: <span>{{forks}}</span></div>
          </div>
        </div>
      </div>

#. Okay, we have ``githubMojit`` getting real data and even have a mojit for getting 
   Twitter data. Did we forget anything? Yeah, we need to plug our ``twitterMojit`` 
   into the body by making it a child of the ``body`` instance. Let’s update the ``body``
   instance in ``application.json``:
  
   .. code-block:: javascript 

      ...
        "body": {
          "type": "BodyMojit",
          "config": {
            "children": {
              "github": {
                "type":"githubMojit"
              },
              "twitter": {
                "type": "twitterMojit"
              }
            }
          }
        },
      ...

#. You can go ahead and start the application. You’ll see both real-time data 
   for GitHub and Twitter. We’ll be adding more mojits with more data in the 
   coming modules, so you may want to review the sections on YQL.


Troubleshooting
===============

Problem One
-----------

Nulla pharetra aliquam neque sed tincidunt. Donec nisi eros, sagittis vitae lobortis 
nec, interdum sed ipsum. Quisque congue tempor odio, a volutpat eros hendrerit nec. 

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

- How do you access models from a controller?
- What are the four arguments passed to the methods of the REST module?
- What is the recommended way for getting data in Mojito applications?

Terms
=====

- 

Source Code
===========

[app_part{x}](http://github.com/yahoo/mojito/examples/quickstart_guide/app_part{x})

Further Reading
===============

[Mojito Doc](http://developer.yahoo.com/cocktails/mojito/docs/)

- 


