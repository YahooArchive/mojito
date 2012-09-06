

====================================
Attaching Assets with HTMLFrameMojit
====================================

**Time Estimate:** 15 minutes

**Difficulty:** Intermediate

Summary
#######

This example shows how to configure an application to use the HTML Frame Mojit (``HTMLFrameMojit``) with predefined assets (CSS) that are attached to the rendered view template of a mojit.

The following topics will be covered:

- configuring the application to use the ``HTMLFrameMojit``
- configuring the ``HTMLFrameMojit`` to automatically include assets in the rendered view template

Implementation Notes
####################

This example code's ``application.json``, shown below, configures the application to use the HTML Frame Mojit and to include CSS assets. The ``HTMLFrameMojit`` creates the 
HTML skeleton and includes the CSS in the ``<head>`` tag because of the ``"top"`` property.  To configure Mojito, place the CSS at the bottom, wrap the ``css`` array in the 
"bottom" property. You can also include JavaScript by including the path to JavaScript files in a ``js`` array. If you do not use the ``HTMLFrameMojit``, 
you have to explicitly include assets as `static resources <../intro/mojito_static_resources.html>`_ in your view template. To learn more about the ``HTMLFrameMojit``, 
see the code example `Using the HTML Frame Mojit <./htmlframe_view.html>`_.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         "frame" : {
           "type" : "HTMLFrameMojit",
           "config": {
             "child" : {
               "type" : "framed"
             },
             "assets": {
               "top": {
                 "css": [
                   "/static/framed/assets/index.css"
                 ]
               }
             }
           }
         }
       }
     }
   ]

The view template ``index.hb.html`` below uses the asset ``index.css``, but you do not need to include them in the file. If you use the same name for your CSS file as the name of your view 
template and place the CSS in the mojit ``assets`` directory, ``HTMLFrameMojit`` will automatically include the assets in the ``<head>`` tag for you and then inject the rendered view template 
into the ``<body>`` tag.

For example, the ``mojits/framed/assets/index.css`` file will automatically be included in the ``<head>`` tag of the rendered ``mojits/framed/views/index.hb.html`` view template. 
When the ``index.hb.index`` view template below is rendered, it will be embedded in an HTML skeleton that includes a ``<html>``, ``<head>``, and ``<body>`` tags. If the ``/assets/index.css`` file exists, 
it will automatically be injected into the ``<head>`` tag.

.. code-block:: html

   <script type="text/javascript">
     // Changes background color of the header.
     // Note: JavaScript code should not be hard
     //coded into the view template. It's done
     // here to simplify the code example.
     function setColor(id, color) {
       document.getElementById(id).style.backgroundColor = color;
     }
   </script>
   <div id="{{mojit_view_id}}" class="mojit">
     <h2 id="header">{{title}}</h2>
     <ul class="toolbar">
       {{#colors}}
         <li><a href="#" onClick="setColor('header','{{rgb}}');">{{id}}</a></li> 
       {{/colors}}
     </ul>
   </div>

.. note:: If you do not use the ``HTMLFrameMojit`` or use CSS with a different name than the view template, you will have to explicitly reference your CSS files in the ``assets`` directory. For example, if you have ``/mojits/{mojit_name}/assets/simple.css``, you can use the HTML ``<link>`` tag to reference the 
    CSS at the following location: ``/static/{mojit_name}/assets/simple.css``

Setting Up this Example
#######################

To create and run ``framed_assets``:

#. Create your application.

   ``$ mojito create app framed_assets``

#. Change to the application directory.

#. Create your mojit.

   ``$ mojito create mojit framed``

#. To configure your application to have assets, replace the code in ``application.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": [ "master" ],
          "specs": {
            "frame" : {
              "type" : "HTMLFrameMojit",
              "config": {
                "child" : {
                  "type" : "framed"
                },
                "assets": {
                  "top": {
                    "css": [
                      "/static/framed/assets/index.css"
                    ]
                  }
                }
              }
            }
          }
        }
      ]

#. To configure routing, create the file ``routes.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": [ "master" ],
          "_framed_view": {
            "verbs": ["get"],
            "path": "/",
            "call": "frame.index"
          }
        }
      ]

#. Change to ``mojits/framed``.

#. Modify your controller to pass an array of objects to the view template by replacing the code in ``controller.server.js`` with the following:

   .. code-block:: javascript

      YUI.add('framed', function(Y,NAME) {
        Y.mojito.controllers[NAME] = {
          init: function(config) {
            this.config = config;
          },
          index: function(ac) {
            var data = {
              title: "Framed Assets",
              colors: [
                {id: "green", rgb: "#616536"},
                {id: "brown", rgb: "#593E1A"},
                {id: "grey",  rgb: "#777B88"},
                {id: "blue",  rgb: "#3D72A4"},
                {id: "red",  rgb: "#990033"}
              ]
            };
            ac.done(data);
          }
        };
      }, '0.0.1', {requires: []});

#. Include the assets in your view template by replacing the code in ``views/index.hb.html`` with the following:

   .. code-block:: html

      <script type="text/javascript">
        // Changes background color of the header.
        // Note: JavaScript code should not be hard
        //coded into the view template. It's done
        // here to simplify the code example.
        function setColor(id, color) {
          document.getElementById(id).style.backgroundColor = color;
        }
      </script>
      <div id="{{mojit_view_id}}" class="mojit">
        <h2 id="header">{{title}}</h2>
        <ul class="toolbar">
        {{#colors}}
          <li><a href="#" onClick="setColor('header','{{rgb}}');">{{id}}</a></li>
        {{/colors}}
        </ul>
      </div>

#. Create the file ``assets/index.css`` for the CSS of your page with the following:

   .. code-block:: css

      .mojit {
        margin: auto;
        width: 40%;
        text-align: center;
      }
      ul.toolbar {
        display: block;
        margin: 0 auto;
        width: 17.0em;
      }
      .toolbar li { display:inline; }


#. From the application directory, run the server.

   ``$ mojito start``

#. To view your application, go to the URL:

   http://localhost:8666

Source Code
###########

- `Assets <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/framed_assets/mojits/framed/assets/>`_
- `Index View Template <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/framed_assets/mojits/framed/views/index.hb.html>`_
- `Framed Assets Application <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/framed_assets/>`_


