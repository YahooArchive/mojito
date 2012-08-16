

===========================================
Running Dynamically Defined Mojit Instances
===========================================

Introduction
############

Mojito allows developer to statically or dynamically define child mojit instances. In the simplest case, 
your parent and its child mojit instances will be statically defined in ``application.json``.
The parent mojit will run its child mojits and then attach their rendered output to its own view template.
In more complex cases, your application may need to run a mojit instance or pass data to another mojit instance because of 
some condition, such as a user event or an environment variable. Being self-contained units of execution, mojits can only pass data
or run mojits that have been defined as children in configuration. If you have not statically defined the child instances
that you want to run or receive data, you can still dynamically define those child instances in configuration objects at runtime.

The dynamically defined child instances, however, are only useful if the parent mojit can run them.
Thus, the Mojito API provides the two methods ``ac.composite.execute`` or ``ac._dispatch`` that parent mojits can use to run 
dynamically defined child mojit instances. The parent mojit passes configuration objects that define the child mojit 
instances and any data you want to pass to one of the two methods. Although both the ``ac.composite.execute`` and ``ac._dispatch`` 
methods allow a parent mojit to run a dynamically defined child instance and pass data to that child instance, 
the two methods do have some distinct differences, which are discussed in `Should I Use ac.composite.execute or ac._dispatch?`_.


ac.composite.execute
--------------------

The `Composite addon <../../api/classes/Composite.common.html>`_ includes the ``execute`` method that allows parents to run  
one or more dynamically defined children mojits by passing the ``children`` object. The ``execute`` method is different than the ``done`` method
of the ``Composite`` addon in that the ``done`` method runs child mojit instances that are defined in ``application.json``.
See `Composite Mojits <./mojito_composite_mojits.html>`_ to learn how to use the ``done`` method of the ``Composite`` addon.


ac._dispatch
------------

Mojito also provides the ``dispatch`` method that can be called from the ``ActionContext`` object to run a dynamically defined child mojit. 
The ``dispatch`` method also allows you to define your own ``flush``, ``done``, and ``error`` functions
for the child mojit instance.

Use Cases
#########

- A mojit needs to pass data to another mojit.
- A mojit wants to attach the rendered view of the dynamically defined mojit to its view template.
- A mojit binder invokes the controller to run an instance of another mojit. The mojit renders its view, which is then returned it to the binder.

Should I Use ac.composite.execute or ac._dispatch?
#################################################

If you need fine-grained control over your child instances, you will want to use ``ac._dispatch``.
In most other cases, and particularly when dynamically defining and running more than one child instance, you will most likely want
to use ``ac.composite.execute`` because it is easier to use. Also, in the case of running multiple child instances, ``ac.composite.execute`` 
keeps track of the configuration and metadata for your child instances; whereas, your parent mojit will need to manage its children
if ``ac._dispatch`` was used.

Using the Composite Addon
#########################

For a mojit to run dynamically defined mojit instances using the ``Composite`` addon, you need to pass a configuration object to ``ac.composite.execute``. 
The next sections will look at the configuration object, the controller code, and then the view template of the parent mojit.


Configuring Child Instances
+++++++++++++++++++++++++++

The configuration object passed to ``ac.composite.execute`` must have the ``children`` object to defines one or more mojit instances.
In the ``cfg`` object below, the child mojit instances ``news`` and ``sidebar`` are defined. You can also specify the action to 
execute and pass configuration information that includes parameters and assets.

.. code-block:: javascript

   var cfg = {
     "children":
     {
       "news": {
         "type": "News",
         "action": "index"
       },
       "sidebar": {
         "type": "Sidebar",
         "action": "index",
         "params": {
           "route": {},
           "url": {},
           "body": {},
           "file": {}
         }
       }
     },
     "assets": {
       "top": [
           "/static/sidebar/assets/index.css"
       ]
     }
   }

Running Mojit Instances
+++++++++++++++++++++++

The ``ac.composite.execute`` takes two parameters. The first parameter is the configuration object
discussed in `Configuring Child Instances`_ that define the child mojit instance or instances. The second parameter is a callback 
that is returned an object containing the rendered data from the child mojit instances and an optional object containing the metadata of 
the children. The metadata contains information about the children's binders, assets, configuration, and HTTP headers
and is required for binders to execute and attach content to the DOM.

In the example controller below, the child instances ``header``, ``body``, and ``footer`` are dynamically defined in ``cfg`` and then run with
``actionContext.composite.execute``. The rendered views of the child mojits are returned in the callback and then made available to the mojit's view template.

.. code-block:: javascript

   YUI.add('FrameMojit', function(Y) {
     Y.mojito.controller = {
       init: function(config) {
         this.config = config;
       },
       index: function(actionContext) {
         var cfg = { view: "index", children: { header: { type: "HeaderMojit", action: "index"}, body: { type: "BodyMojit", action: "index" }, footer: { type: "FooterMojit", action: "index" }}};
         // The 'meta' object containing metadata about the children's binders, assets, configuration, and HTTP header
         // info is passed to the callback. This 'meta' object is required for binders to execute and attach content to the DOM.
         actionContext.composite.execute(cfg,function(data, meta){
           actionContext.done(data, meta);
        });
       }
     }
   ;}, '0.0.1', {requires: []});




View Templates
++++++++++++++

The rendered output from each of the dynamically defined child mojit instances can be injected into
the view template of the parent mojit using Handlebars expressions. If the child mojit instances ``header``, ``footer``,
and ``body`` were defined in the configuration object passed to ``ac.composite.execute``, you
could add the rendered content from those child mojit instances to the parent mojit's view template with 
the Handlebars expressions ``{{{header}}}``, ``{{{footer}}}``, and ``{{{body}}}`` as shown in the 
example view template below. The Handlebars expressions using triple braces insert unescaped HTML into the page.

.. code-block:: html 
   
   <div id="{{mojit_view_id}}">
     {{{header}}}
     {{{body}}}
     {{{footer}}}
   </div>

Example
+++++++

Controllers
-----------

ParentMojit
^^^^^^^^^^^

.. code-block:: javascript

   YUI.add('ParentMojit', function(Y) {
      Y.mojito.controller = {
        index: function(ac) {
          var cfg = {
            "children": {
              "dynamic_child": {
                "type": "DynamicChildMojit",
                  "config": {
                    "caller": "ParentMojit"
                  }
                }
              }
            };
            ac.composite.execute(cfg,function(data, meta){
              // The 'meta' object containing metadata about the children's binders, assets, configuration, and HTTP header
              // info is passed to the callback. This 'meta' object is required for binders to execute and attach content to the DOM.
              ac.done(data, meta);
            });
          }
        };
      }, '0.0.1', {requires: ['mojito']});



DynamicChildMojit
^^^^^^^^^^^^^^^^^

.. code-block:: javascript

   YUI.add('DynamicChildMojit', function(Y) {
     Y.mojito.controller = {
       index: function(ac) {
         var caller = ac.config.get("caller");       
         if("ParentMojit"==caller){
           ac.done({ "content": "I have been dynamically defined and run by " + caller + "."});
         }
         else {
           ac.done({"content": "I was called directly and have no parent." });
         }
       }
     };
   }, '0.0.1', {requires: ['mojito']});



View Templates
--------------

DynamicChildMojit
^^^^^^^^^^^^^^^^^

.. code-block:: html

   <div id="{{mojit_view_id}}">
      {{{content}}}
   </div>


ParentMojit
^^^^^^^^^^^

.. code-block:: html

   <div id="{{mojit_view_id}}">
     {{{dynamic_child}}}
   </div>


Rendered Views
--------------

- ``localhost:8666/@ParentMojit/index``

   ::

      I have been dynamically defined and run by ParentMojit.

- ``localhost:8666/@DynamicChildMojit/index``

   ::
  
      I was called directly and have no parent.  


Using ac._dispatch
##################

Using ``ac._dispatch`` not only allows you to run a dynamically defined child mojit instance like
``ac.composite.execute``, but you also have more fine-grained control over how the child mojit instance runs.
The content from the child mojit's controller may be passed to its view template or the child mojit's rendered view template
is passed to the parent mojit. 


Configuring a Child Instance
++++++++++++++++++++++++++++

Two configuration objects are passed to ``ac._dispatch``, each having a different function. The ``command``
object defines the instance, the action to execute, the context, and any parameters. This lets the
parent mojit have greater control over its child instances. The ``adapter`` object lets you define custom ``flush``, 
``done``, and ``error`` functions for the child mojit instances. 

Although you can also pass the ``ActionContext`` object as the ``adapter`` to use the default ``flush``, ``done``, and ``error`` functions, 
it is not recommended because the ``ActionContext`` object contains both parent and child mojit metadata, which could cause unexpected results.

Command Object
--------------

In the ``command`` object below, a mojit instance of type ``MessengerMojit`` and the action to execute are
specified. The new mojit instance is also passed parameters.

.. code-block:: javascript

   var command = {
     "instance" : {
       "type": "MessengerMojit"
     },
     "action": "index",
     "context": ac.context,
     "params": {
       "route": { "path": "/message" },
       "url": { "message_type": "email" },
       "body": { "content": "Dispatch a mojit" }

     }
   };
   
Adapter Object
--------------

In the ``adapter`` object below, the ``ac.done``, ``ac.flush``, or ``ac.error`` are
defined and will override those functions in the child mojit instance. See `Adapter Functions`_
for more information.

.. code-block:: javascript
  
   var adapter = {
      flush: function(data, meta){...},
      done: function(data, meta){
        var body = ac.params.body();
        var output = { "data": data, "body": body };
        ac.done(output);
      },
      error: function(err){ Y.log(err); }
   }; 
   

Adapter Functions
-----------------
   
The functions ``ac.done``, ``ac.flush``, and ``ac.error`` defined in the ``adapter``
object are actually implemented by the Mojito framework. For example, before ``adapter.done``
is executed, Mojito runs the ``done`` function defined in 
`output-adapter.common.js <http://github.com/yahoo/mojito/source/lib/app/addons/ac/output-adapter.common.js>`_,
which collects metadata and configuration. 


Controller
++++++++++

The controller of the mojit that is dynamically creating mojit instances defines the mojit
instance and passes custom versions of ``done``, ``flush``, and ``error``. 

.. code-block:: javascript

   YUI.add('MotherlodeMojit', function(Y) {

     Y.mojito.controller = {

       index: function(ac) {
         var adapter = {
           done: function(data, meta){
             var body = ac.params.body();
             var output = { "data": data, body };
             ac.done(output);
           },
           error: function(err){ Y.log(err); }
         }; 
         var command = {
           "instance" : {
             "type": "MessengerMojit",
             "action": "index"
           },
           "context": ac.context,
           "params": {
             "route": { "path": "/message" },
             "url": { "message_type": "email" },
             "body": { "content": "Dispatch a mojit" }
           }
         };
         ac._dispatch(command,adapter);
      }
    };
  }, '0.0.1', {requires: ['mojito']});


View Templates
++++++++++++++

The view template that is rendered depends on the ``adapter`` object passed to ``ac._dispatch``.
If you pass the ``ac`` object as the ``adapter`` parameter, as in ``ac._dispatch(command,ac)``,
the ``ac.done`` in the dynamically defined mojit will execute and its view template will be
rendered. If you pass a custom ``adapter`` object defining ``done``, you can call ``ac.done``
inside your defined ``done`` method to pass data to the parent mojit and render its view template.

Examples
++++++++ 

Example One
-----------

In this example, the mojit ``CreatorMojit`` dynamically creates the child mojit instance of
type ``SpawnedMojit``. The child mojit instance gets data from its parent mojit and then renders its view template.
The rendered view template is returned to the parent mojit, which inserts the content into its
own view template.

Application Configuration
^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: javascript
  
   [
     {
       "settings": [ "master" ],
       "specs": {
         "creator": {
           "type":"CreatorMojit"
         }
       }
     }
   ]


Controllers  
^^^^^^^^^^^  

CreatorMojit
************

.. code-block:: javascript 

   YUI.add('CreatorMojit', function(Y) {
   
      Y.mojito.controller = {

        index: function(ac) {
          var buffer = '';
          var command = {
            "instance" : {
              "type": "SpawnedMojit",
              "action": "index"
            },
            "context": ac.context,
            "params": {
              "route": { "name":"creator" },
              "url": { "path":"/creator" },
              "body": { "message":"I have been defined and run by CreatorMojit." }
            }
          };
          var adapter = {
            "error": function(childErr) {
              Y.log('-- child error');
              ac.error(childErr);
            },
            "flush": function(childData, childMeta) {
              Y.log('-- child flush');
              buffer += childData;
            },
            "done": function(childData, childMeta) {
              console.log('-- child done');
              var meta = {};
              buffer += childData;
              Y.mojito.util.metaMerge(meta, childMeta);
              ac.done({ "child_slot": buffer }, meta);
            }
          };
          ac._dispatch(command,adapter);
        }
     };
   }, '0.0.1', {requires: ['mojito']});


SpawnedMojit
************

.. code-block:: javascript 

   YUI.add('SpawnedMojit', function(Y) {
   
      Y.mojito.controller = {

        "index": function(ac) {
          ac.done({ "route": ac.params.route('name'), "url": ac.params.url('path'), "body": ac.params.body("message") });
        }
     };
   }, '0.0.1', {requires: ['mojito']});


View Templates
^^^^^^^^^^^^^^ 

SpawnedMojit
************

.. code-block:: html 

   <div id="{{mojit_view_id}}">
     <h3>Child Mojit Instance</h3>
     <ul>
       <li>Route: {{route}}</li> 
       <li>Path: {{url}}</li> 
       <li>Message: {{body}}</li>
     </ul>
   </div>


CreatorMojit
************
   
.. code-block:: html

   <div id="{{mojit_view_id}}">
   <h3>Parent Mojit</h3>
     {{{child_slot}}}
   </div>



Example Two
-----------

In this example, the binder invokes its controller to dynamically define an instance of another mojit. 
The dynamically defined mojit instance renders its view, which is then sent to the binder to
be attached to the DOM.


Application Configuration
^^^^^^^^^^^^^^^^^^^^^^^^^

``application.json``

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         "frame" : {
           "type" : "HTMLFrameMojit",
           "config" : {            
             "title" : "Fun with Dispatch",
             "deploy" : true,              
             "child" : {                   
               "type" : "ParentMojit"                   
             }                             
           }                       
         }                 
       }           
     }
   ]
   
``routes.json``

.. code-block:: javascript

   [
     {  
       "settings" : [ "master" ],
       "framed" : {
         "verbs" : [ "get" ],
         "path" : "/",  
         "call" : "frame.index"
       }        
     }  
   ]


Controllers  
^^^^^^^^^^^  

ParentMojit
***********

.. code-block:: javascript

   YUI.add('ParentMojit', function(Y) {
     Y.mojito.controller = {
       index: function(ac) {
         ac.assets.addCss("/static/parent/assets/index.css", "top");
         ac.done();
       },
       dispatch: function(ac) { 
         var command = {
           "instance" : {
             "type" : "ChildMojit",
           },
           "context" : ac.context,
           "params" : {}
         };
         ac._dispatch(command, ac);
       }
     };
   }, '0.0.1', {requires: ['mojito']});


ChildMojit
**********

.. code-block:: javascript

   YUI.add('ChildMojit', function(Y) {
     Y.mojito.controller = {
       index: function(ac) {
         ac.assets.addCss("/static/child/assets/index.css", "top");
         var content = Math.floor(Math.random()*10001);
         ac.done({ "random_content" : content });
       }
     };
   }, '0.0.1', {requires: ['mojito']});
   
   
Binders
^^^^^^^

ParentMojit
***********

.. code-block:: javascript

   YUI.add('ParentMojitBinderIndex', function(Y, NAME) {
     Y.namespace('mojito.binders')[NAME] = {
       init: function(mojitProxy) {
         this.mojitProxy = mojitProxy;
       },
       bind: function(node) {
         this.node = node;
         Y.one("#btndispatch").on("click", function (e) {
           this.mojitProxy.invoke("dispatch", {}, this.dispatchCallback);
         }, this);
       },
       dispatchCallback: function(error, data, meta) {
         if (error) {
           alert("error dispatching mojit :: " + Y.JSON.stringify(error));
         } else {
           Y.one("#output").append(data);
         }
       }
     };
   }, '0.0.1', {requires: ['mojito-client']});


ChildMojit
***********

.. code-block:: javascript

   YUI.add('ChildMojitBinderIndex', function(Y, NAME) {
     Y.namespace('mojito.binders')[NAME] = {
       init: function(mojitProxy) {
         this.mojitProxy = mojitProxy;
       },
       bind: function(node) {
         this.node = node;
         var btn = node.all("#btn_remove");
         btn.on("click", function (e) {
           this.mojitProxy.destroySelf(false);
         }, this);      
         btn = null;    
       }
     };
   }, '0.0.1', {requires: ['mojito-client']});
   
   
View Templates
^^^^^^^^^^^^^^

ParentMojit
***********

.. code-block:: html

   <div id="{{mojit_view_id}}">
     <div>
       <button id="btndispatch">Dispatch a child</button>
     </div>
     <div id="output"></div>
   </div>


ChildMojit
**********

.. code-block:: html

   <div id="{{mojit_view_id}}" class="child">
     <button id="btn_remove">Remove</button>
     {{random_content}}
   </div>


Using ac._dispatch with ac.composite.execute
############################################

You can combine both methods to dynamically define and run a more complex set of mojits. The mojit that initiates the process
uses ``ac._dispatch`` to define and run a parent mojit instance that uses ``ac.composite.execute`` in its controller to define and run child mojit
instances. This chain of running dynamically defined mojit instances can be extended even further if one or more of the child mojit instances
is using ``ac._dispatch`` or ``ac.composite.execute``. When running a set of dynamically defined mojits, you should be aware that
you may run into memory issues.

Because the configuration, controllers, and view templates are the same when using ``ac._dispatch`` and ``ac.composite.execute`` 
independently or together, please see `Using the Composite Addon`_ and `Using ac._dispatch`_
for implementation details. 

Example
+++++++

In this example, the ``GrandparentMojit`` uses ``ac._dispatch`` to create a child mojit instance of type ``ParentMojit``, which in
turn creates a child mojit instance of type ``GrandchildMojit``. The child instance of type ``GrandchildMojit`` is executed and its
rendered view is returned to its parent mojit instance of type ``ParentMojit``. The content is then attached
to the parent mojit instance's view template, which gets rendered and returned as the response.

Application Configuration
-------------------------

``application.json``

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         "frame" : {
           "type" : "HTMLFrameMojit",
           "config" : {
             "title" : "Fun with Dispatch and Execute",
             "deploy" : true,
             "child" : {
               "type" : "GrandparentMojit"
             }
           }
         }
       },
       "assets": {
             "css": [
               "assets/css/defaults.css"
             ]
        }
     }
   ]


``routes.json``

.. code-block:: javascript

   [
    {   
      "settings" : [ "master" ],
      "framed" : {
        "verbs" : [ "get" ],
        "path" : "/",   
        "call" : "frame.index"
      }         
    }   
   ]


Controllers  
-----------   

GrandparentMojit
^^^^^^^^^^^^^^^^

.. code-block:: javascript

   YUI.add('GrandparentMojit', function(Y) {
     Y.mojito.controller = {
       index: function(ac) {
         var command = {
           "instance": {
             "type" : "ParentMojit",
             "action": "index"
           },
           "context" : ac.context,
           "params" : {
             "body": {
               "whoami": "ParentMojit",
               "creator": "GrandparentMojit"
             }
           }
         };
         ac._dispatch(command, ac);
       }
     };
   }, '0.0.1', {requires: ['mojito']});
   


ParentMojit
^^^^^^^^^^^

.. code-block:: javascript

   YUI.add('ParentMojit', function(Y) {
     Y.mojito.controller = {
       index: function(ac) {
         var params = ac.params.body();
         var cfg = {
           "view": "index",
           "children": {
             "child": {
               "type": "GrandchildMojit",
               "action": "index",
               "config": {
                 "creator": "ParentMojit",
                 "whoami": "GrandchildMojit"
               }
             }
           }
         };
         ac.composite.execute(cfg,function(data, meta){
           ac.done(Y.merge(params, data), meta);
         });
       }
     };
   }, '0.0.1', {requires: ['mojito']});


GrandchildMojit
^^^^^^^^^^^^^^^

.. code-block:: javascript

   YUI.add('GrandchildMojit', function(Y) {
     Y.mojito.controller = {
       index: function(ac) {
         var data = { "creator": ac.config.get("creator"), "whoami": ac.config.get("whoami") };
         ac.done(data);
       }
     };
   }, '0.0.1', {requires: ['mojito']});





View Templates
--------------

GrandchildMojit
^^^^^^^^^^^^^^^

.. code-block:: html

   <div id="{{mojit_view_id}}">
     <h3>I am the {{whoami}} dynamically defined and run by {{creator}}.</h3>
   </div>


ParentMojit
^^^^^^^^^^^

.. code-block:: html

   <link rel="stylesheet" type="text/css" href="/static/multiple_dynamic_mojits/assets/css/index.css"/>
   <div id="{{mojit_view_id}}">
     <h2>I am the {{whoami}} dynamically defined and run by {{creator}}.</h2>
     {{{child}}}
   </div>


