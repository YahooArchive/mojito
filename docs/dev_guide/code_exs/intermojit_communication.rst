

==================================
Allowing Inter-Mojit Communication
==================================

**Time Estimate:** 15 minutes

**Difficulty Level:** Intermediate

Summary
#######

This example shows how to configure mojits to communicate with each other through event binding.

The following topics will be covered:

- structuring your mojits for intercommunication
- implementing binders for each mojit to listen to and trigger events
- using the `Composite addon <../../api/classes/Composite.common.html>`_ to execute code in child mojits

Implementation Notes
####################

.. _impl_notes-app_config:

Application Configuration
=========================

The ``application.json`` for this example defines the hierarchy and relationship between the mojits of this application and configures the application to run on the client. 
In the ``application.json`` below, the ``HTMLFrameMojit`` is the parent of the ``MasterMojit``, which, in turn, is the parent of the ``SenderMojit`` and ``ReceiverMojit``.  
The ``"deploy"`` property of the ``"frame"`` object is assigned the value ``"true"`` to configure Mojito to send code to the client for execution.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         "frame": {
           "type": "HTMLFrameMojit",
           "config": {
             "deploy": true,
             "child": {
               "type": "MasterMojit",
               "config":{
                 "children": {
                   "sender": {
                     "type": "SenderMojit"
                   },
                   "receiver": {
                     "type": "ReceiverMojit"
                   }
                 }
               }
             },
             "assets": {
               "top": {
                 "css":[
                   "/static/MasterMojit/assets/css/style.css",
                   "/static/SenderMojit/assets/css/style.css",
                   "/static/ReceiverMojit/assets/css/style.css"
                 ]
               }
             }
           }
         }
       }
     }
   ]
 
Routing Configuration
=====================

In the ``routes.json`` below, two route paths are defined . The route configuration for the root path specifies that the ``index`` method of the ``frame`` instance of ``HTMLFrameMojit`` be 
called when HTTP GET calls are received. Recall that the ``HTMLFrameMojit`` is the parent of the other mojits. Because the ``HTMLFrameMojit`` has no ``index`` function,  the ``index`` function 
in the controller of the child mojit ``MasterMojit`` is called instead.

.. code-block:: javascript

   [
     {
       "settings": ["master"],
       "root": {
         "verbs": ["get"],
         "path": "/",
         "call": "frame.index"
       },
       "receiver": {
         "verbs": ["get"],
         "path": "/receiver/show",
         "call": "receiver.show"
       }
     }
   ]

Master Mojit
============

The ``MasterMojit`` performs three major functions, each handled by a different file. The controller executes the ``index`` methods of the children mojits. The binder listens for events and then 
broadcasts those events to its children. Lastly, the ``index`` view template displays the content created by the child mojits. We'll now take a look at each of the files to understand how they perform 
these three functions.

The ``controller.server.js`` below is very simple because the main purpose is to execute the ``index`` functions of the child mojits. The Action Context object ``actionContext`` is vital because 
it gives the ``MasterMojit`` access to the child mojits through addons. The ``MasterMojit`` can execute the ``index`` functions of the child mojits by calling the ``done`` method from the ``Composite`` addon.

.. code-block:: javascript

   YUI.add('MasterMojit', function(Y,NAME) {
     Y.mojito.controllers[NAME] = {
       init: function(config) {
         this.config = config;
       },
       "index": function(actionContext) {
         actionContext.composite.done();
       }
     };
   }, '0.0.1', {requires: ['mojito']});

The binder for the ``MasterMojit`` listens for events from the ``SenderMojit``. Once an event is received, the ``MasterMojit`` then broadcasts that event to its child mojits. The child mojit ``ReceiverMojit`` will 
then intercept the broadcasted events, which we look at later in :ref:`impl_notes-receiver_mojit`.

So, how do mojits listen to events from other mojits or broadcast events? On the client, each mojit binder can use the ``mojitProxy`` object to interact with other mojits on the page. 
In the ``binders/index.js`` of the ``MasterMojit`` below, the ``mojitProxy`` object is used to listen to hyperlink events and then to broadcast an event to the child mojits. The first arguments 
passed to the ``listen`` and ``fire`` methods are the event types.

.. code-block:: javascript

   YUI.add('MasterMojitBinderIndex', function(Y, NAME) {
     Y.namespace("mojito.binders")[NAME]= {
       init: function(mojitProxy) {
         var mp = this.mp = this.mojitProxy = mojitProxy;             
         Y.log("mojitProxy.getChildren(): ");
         Y.log("Entering MasterMojitBinderIndex");
         this.mojitProxy.listen('fire-link', function(payload) {
           var c = mp.getChildren();
           var receiverID = c["receiver"].viewId;
           Y.log('intercepted fire-link event: ' + payload.data.url, 'info', NAME);
           mojitProxy.broadcast('broadcast-link', {url: payload.data.url},{ target: {viewId:receiverID }});
           Y.log('broadcasted event to child mojit: ' + payload.data.url, 'info', NAME);
         });
       },
       /**
       * The binder method, invoked to allow the
       * mojit to attach DOM event handlers.
       * @param node {Node} The DOM node to which
       * this mojit is attached.
       */
       bind: function(node) {
         this.node = node;
       }
     };
   }, '0.0.1', {requires: ['mojito-client']});

In the ``application.json`` file discussed in :ref:`impl_notes-app_config`, four mojit instances were declared: ``frame``, ``child``, ``sender``, and ``receiver``. Because the ``child`` instance 
of ``MasterMojit`` is the parent of the ``sender`` and ``receiver`` mojit instances, the controller can execute the code in the child mojit instances by calling ``actionContext.composite.done()`` 
in the controller. As you can see below, the output from the ``sender`` and ``receiver`` instances can be inserted into the view template through Handlebars expressions.

.. code-block:: html

   <div id="{{mojit_view_id}}" class="mojit">
     <div id="header">
     This example demonstrates inter mojit communication on a page. The mojit on the left side contains a list of image links. The mojit on the right side will display the image whenever a link in the left mojit is clicked on.
     </div>
     <table>
       <tr>
         <td class="left">{{{sender}}}</td>
         <td class="right">{{{receiver}}}</td>
       </tr>
     </table>
   </div>

Sender Mojit
============

The ``SenderMojit`` listens for click events and then forwards them and an associated URL to the ``MasterMojit``. Because the controller for the ``SenderMojit`` does little but send some text, 
we will only examine the binder and index view template.

The binder for the ``SenderMojit`` binds and attaches event handlers to the DOM. In the ``binders/index.js`` below, the handler for click events uses the ``mojitProxy`` object to fire the event to the binder for the ``MasterMojit``. The URL of the clicked link is passed to the ``MasterMojit``.


.. code-block:: javascript

   YUI.add('SenderMojitBinderIndex', function(Y, NAME) {
     Y.namespace('mojito.binders')[NAME] = {
       init: function(mojitProxy) {
         this.mp = mojitProxy;
       },
       bind: function(node) {
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
     };
   }, '0.0.1', {requires: ['node','mojito-client']});

The ``index`` view template for the ``SenderMojit`` has an unordered list of links to Flickr photos. As we saw in the binder, the handler for click events passes the event and the link URL 
to the ``MasterMojit``.

.. code-block:: html

   <div id="{{mojit_view_id}}" class="mojit">
     <h3>{{title}}</h3>
     <ul>
       <li><a href="http://farm6.static.flickr.com/5064/5632737098_f064e4193c.jpg">Image 1</a></li>
       <li><a href="http://farm6.static.flickr.com/5061/5632537388_ff1763af69.jpg">Image 2</a></li>
       <li><a href="http://farm6.static.flickr.com/5061/5631063565_bc0d4d6fa4.jpg">Image 3</a></li>
       <li><a href="http://farm6.static.flickr.com/5265/5630493861_508fd54a3f.jpg">Image 4</a></li>
       <li><a href="http://farm6.static.flickr.com/5187/5631076804_65eccc0ec0.jpg">Image 5</a></li>
       <li><a href="http://farm6.static.flickr.com/5303/5630492129_1a8cb2e35e.jpg">Image 6</a></li>
       <li><a href="http://farm6.static.flickr.com/5025/5631077466_f088b79d8e.jpg">Image 7</a></li>
       <li><a href="http://farm6.static.flickr.com/5104/5630493353_9b4aba1468.jpg">Image 8</a></li>
       <li><a href="http://farm6.static.flickr.com/5109/5630710610_cc076791cc.jpg">Image 9</a></li>
     </ul>
   </div>

.. _impl_notes-receiver_mojit:

Receiver Mojit
==============

The ``ReceiverMojit`` is responsible for capturing events that were broadcasted by ``MasterMojit`` and then displaying the photo associated with the link that was clicked.

In the controller for ``ReceiverMojit``, the additional function ``show`` displays a photo based on the query string parameter ``url`` or a default photo. The ``show`` function gets invoked from the binder, 
which we'll look at next.

.. code-block:: javascript

   YUI.add('ReceiverMojit', function(Y,NAME) {
     Y.mojito.controllers[NAME] = {
       init: function(config) {
         this.config = config;
       },
       index: function(actionContext) {
         actionContext.done({title: 'This is the receiver mojit'});
       },
       show: function(actionContext) {
         var url = actionContext.params.getFromMerged('url') || "http://farm1.static.flickr.com/21/35282840_8155ba1a22_o.jpg";
         actionContext.done({title: 'Image matching the link clicked on the left.', url: url});
       }
     };
   }, '0.0.1', {requires: []});

The binder for the ``ReceiverMojit`` listens for broadcasted link events. In the ``binders/index.js`` below, those broadcasted link events, which are the event type "broadcast-link", will come from 
the ``MasterMojit``. When the event is captured, the ``mojitProxy`` object is used to invoke the ``show`` function and pass the photo URI.

.. code-block:: javascript

   YUI.add('ReceiverMojitBinderIndex', function(Y,NAME) {
     Y.namespace('mojito.binders')[NAME] = {
       init: function(mojitProxy) {
         var self = this;
         this.mojitProxy = mojitProxy;
         this.mojitProxy.listen('broadcast-link', function(payload) {
           Y.log('Intercepted broadcast-link event: ' + payload.data.url, 'info', NAME);
           // Fire an event to the mojit to reload
           // with the correct URL
           var params = {
             url: {
               url: payload.data.url
             }
           };
           mojitProxy.invoke('show', { params: params }, function(err, markup) {
             self.node.setContent(markup);
           });
         });
       },
       /**
       * The binder method, invoked to allow the
       * mojit to attach DOM event handlers.
       * @param node {Node} The DOM node to which
       * this mojit is attached.
       */
       bind: function(node) {
         this.node = node;
       }
     };
   }, '0.0.1', {requires: ['mojito-client']});

Setting Up this Example
#######################

To set up and run ``inter-mojit``:

#. Create your application.

   ``$ mojito create app inter-mojit``

#. Change to the application directory.

#. Create the mojits for the application.

   ``$ mojito create mojit MasterMojit``

   ``$ mojito create mojit SenderMojit``

   ``$ mojito create mojit ReceiverMojit``

#. To configure your application to use the mojits you created, replace the code in ``application.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": [ "master" ],
          "specs": {
            "frame": {
              "type": "HTMLFrameMojit",
              "config": {
                "deploy": true,
                "child": {
                  "type": "MasterMojit",
                  "config":{
                    "children": {
                      "sender": {
                        "type": "SenderMojit"
                      },
                      "receiver": {
                        "type": "ReceiverMojit"
                      }
                    }
                  }
                },
                "assets": {
                  "top": {
                    "css":[
                      "/static/MasterMojit/assets/css/style.css",
                      "/static/SenderMojit/assets/css/style.css",
                      "/static/ReceiverMojit/assets/css/style.css"
                    ]
                  }
                }
              }
            }
          }
        }
      ]

#. To configure routing for the root path and the path ``/receiver/show``, create the file ``routes.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": ["master"],
          "root": {
            "verbs": ["get"],
            "path": "/",
            "call": "frame.index"
          },
          "receiver": {
            "verbs": ["get"],
            "path": "/receiver/show",
            "call": "receiver.show"
          }
        }
      ]

#. Change to ``mojits/MasterMojit``.

#. To allow the ``MasterMojit`` to execute its children mojits, replace the code in ``controller.server.js`` with the following:

   .. code-block:: javascript

      YUI.add('MasterMojit', function(Y,NAME) {
        Y.mojito.controllers[NAME] = {
          init: function(spec) {
            this.spec=spec;
          },
          "index": function(actionContext) {
            actionContext.composite.done();
          }
        };
      }, '0.0.1', {requires: []});

#. To allow the ``MasterMojit`` to capture events and refire them to its children mojits, replace the code in ``binders/index.js`` with the following:

   .. code-block:: javascript

      YUI.add('MasterMojitBinderIndex', function(Y, NAME) {
        Y.namespace("mojito.binders")[NAME]= {
          init: function(mojitProxy) {
            var mp = this.mp = this.mojitProxy = mojitProxy;
            Y.log("mojitProxy.getChildren(): ");
            Y.log("Entering MasterMojitBinderIndex");
            this.mojitProxy.listen('fire-link', function(payload) {
              var c = mp.getChildren();
              var receiverID = c["receiver"].viewId;
              Y.log('intercepted fire-link event: ' + payload.data.url, 'info', NAME);
              mojitProxy.broadcast('broadcast-link', {url: payload.data.url},{ target: {viewId:receiverID }});
              Y.log('broadcasted event to child mojit: ' + payload.data.url, 'info', NAME);
            });
          },
          /**
          * The binder method, invoked to allow the
          * mojit to attach DOM event handlers.
          * @param node {Node} The DOM node to which
          * this mojit is attached.
          */
          bind: function(node) {
            this.node = node;
          }
        };
      }, '0.0.1', {requires: ['mojito-client']});

#. Modify the ``index`` view template to include output from the ``SenderMojit`` and ``ReceiverMojit`` by replacing the code in ``views/index.hb.html`` with the following:

   .. code-block:: html

      <div id="{{mojit_view_id}}" class="mojit">
        <div id="header">
        This example demonstrates inter mojit communication on a page.
        The mojit on the left side contains a list of image links.
        The mojit on the right side will display the image whenever a link in the left mojit is clicked on.</div>
        <table>
          <tr>
            <td class="left">{{{sender}}}</td>
            <td class="right">{{{receiver}}}</td>
          </tr>
        </table>
      </div>

#. Change to the ``SenderMojit`` directory.

   ``$ cd ../SenderMojit``

#. Replace the code in ``controller.server.js`` with the following:

   .. code-block:: javascript

      YUI.add('SenderMojit', function(Y,NAME) {
         Y.mojito.controllers[NAME] = {
          init: function(config) {
            this.config = config;
          },
          index: function(actionContext) {
            actionContext.done({title: 'List of images for testing'});
          }
        };
      }, '0.0.1', {requires: []});

#. To allow the ``SenderMojit`` to fire an event, replace the code in ``binders/index.js`` with the following:

   .. code-block:: javascript

      YUI.add('SenderMojitBinderIndex', function(Y, NAME) {
        Y.namespace('mojito.binders')[NAME] = {
          init: function(mojitProxy) {
            this.mp = mojitProxy;
          },
          bind: function(node) {
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
        };
      }, '0.0.1', {requires: ['node','mojito-client']});

#. To provide an unordered list of image links to the ``index`` view template of the ``MasterMojit``, replace the code in ``views/index..hb.html`` with the following:

   .. code-block:: html

      <div id="{{mojit_view_id}}" class="mojit">
        <h3>{{title}}</h3>
        <ul>
          <li><a href="http://farm6.static.flickr.com/5064/5632737098_f064e4193c.jpg">Image 1</a></li>
          <li><a href="http://farm6.static.flickr.com/5061/5632537388_ff1763af69.jpg">Image 2</a></li>
          <li><a href="http://farm6.static.flickr.com/5061/5631063565_bc0d4d6fa4.jpg">Image 3</a></li>
          <li><a href="http://farm6.static.flickr.com/5265/5630493861_508fd54a3f.jpg">Image 4</a></li>
          <li><a href="http://farm6.static.flickr.com/5187/5631076804_65eccc0ec0.jpg">Image 5</a></li>
          <li><a href="http://farm6.static.flickr.com/5303/5630492129_1a8cb2e35e.jpg">Image 6</a></li>
          <li><a href="http://farm6.static.flickr.com/5025/5631077466_f088b79d8e.jpg">Image 7</a></li>
          <li><a href="http://farm6.static.flickr.com/5104/5630493353_9b4aba1468.jpg">Image 8</a></li>
          <li><a href="http://farm6.static.flickr.com/5109/5630710610_cc076791cc.jpg">Image 9</a></li>
        </ul>
      </div>

#. Change to the ``ReceiverMojit`` directory.

   ``$ cd ../ReceiverMojit``

#. To display an image associated with a clicked link,  replace the code in ``controller.server.js`` with the following:

   .. code-block:: javascript

      YUI.add('ReceiverMojit', function(Y,NAME) {
        Y.mojito.controllers[NAME] = {
          init: function(spec) {
            this.spec = spec;
          },
          "index": function(actionContext) {
            actionContext.done({title: 'This is the receiver mojit'});
          },
          show: function(actionContext) {
            var url = actionContext.params.getFromMerged('url') || "http://farm1.static.flickr.com/21/35282840_8155ba1a22_o.jpg";
            actionContext.done({title: 'Image matching the link clicked on the left.', url: url});
          }
        };
      }, '0.0.1', {requires: []});

#. To allow the ``ReceiverMojit`` to capture an event and invoke the ``show`` function in the controller, replace the code in ``binders/index.js`` with the following:

   .. code-block:: javascript

      YUI.add('ReceiverMojitBinderIndex', function(Y,NAME) {
        Y.namespace('mojito.binders')[NAME] = {
          init: function(mojitProxy) {
            var self = this;
            this.mojitProxy = mojitProxy;
            this.mojitProxy.listen('broadcast-link', function(payload) {
              Y.log('Intercepted broadcast-link event: ' + payload.data.url, 'info', NAME);
              // Fire an event to the mojit to reload
              // with the correct URL
              var params = {
                url: {
                  url: payload.data.url
                }
              };
              mojitProxy.invoke('show', { params: params }, function(err, markup) {
                self.node.setContent(markup);
              });
            });
          },
          /**
          * The binder method, invoked to allow the
          * mojit to attach DOM event handlers.
          * @param node {Node} The DOM node to which
          * this mojit is attached.
          */
          bind: function(node) {
            this.node = node;
          }
        };
      }, '0.0.1', {requires: ['mojito-client']});

#. Replace the code in ``views/index.hb.html`` with the following:

   .. code-block:: html

      <div id="{{mojit_view_id}}" class="ReceiverMojit">
        <div id="view" style="margin: auto auto;"></div>
      </div>

#. To create the view template that displays the photo of the clicked link, create the file ``views/show.hb.html`` with the following:

   .. code-block:: html

      <div id="{{mojit_view_id}}" class="ReceiverMojit">
        <h3></h3>
        <div id="view">
          <img src="{{url}}" width="200px" alt="Missing Image"/>
        </div>
      </div>

#. From the application directory, start the server.

   ``$ mojito start``

#. To view your application, go to the URL:

   http://localhost:8666

Source Code
###########

- `Application Configuration <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/inter-mojit/application.json>`_
- `Master Mojit Controller <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/inter-mojit/mojits/MasterMojit/controller.server.js>`_
- `Master Mojit Binder <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/inter-mojit/mojits/MasterMojit/binders/index.js>`_
- `Master Mojit View Template <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/inter-mojit/mojits/MasterMojit/views/index.html>`_
- `Sender Mojit Controller <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/inter-mojit/mojits/SenderMojit/controller.js>`_
- `Sender Mojit Binder <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/inter-mojit/mojits/SenderMojit/binders/binder.js>`_
- `Receiver Mojit Controller <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/inter-mojit/mojits/ReceiverMojit/controller.js>`_
- `Receiver Mojit Binder <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/inter-mojit/mojits/ReceiverMojit/binders/binder.js>`_
- `Inter-Mojit Application <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/inter-mojit/>`_


