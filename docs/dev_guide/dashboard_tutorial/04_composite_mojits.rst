===================
4. Composite Mojits
===================

.. _04_composite_mojits-intro:

Introduction
============

Mojito allows you to establish parent-child relationships between your mojits, 
so parent mojits can execute child mojits and attach the content to the 
parent mojit’s template. The parent mojit in this relationship is called a 
composite mojit. The frame mojit ``HTMLFrameMojit`` that we looked in the last module is 
also a composite mojit. In fact, all frame mojits 
are composite mojits, but composite mojits do not have to be frame mojits. 
A frame mojit can also have a child mojit that is a composite mojit, 
extending the parent-child relationship. 

In this module, we’re going to keep using the ``HTMLFrameMojit`` and have a child 
that is a composite mojit, which will have several children. To make it more 
interesting, one of the children is also a composite mojit that has a child. 
The composite mojits will manage the child mojits that create our content, 
while the ``HTMLFrameMojit`` will continue to put together our HTML page. Do you 
remember all those mojits that we created earlier that have been just sitting 
there unused? Well, we’re finally going to use them for the application that 
we’ll create in this module.



.. _04_intro-cover:

What We’ll Cover
----------------

- configuring the composite mojit instance
- using the Composite addon
- passing data from parent to child mojits
- attaching child mojits to templates

.. _04_intro-final:

Final Product
-------------

As you can see from the screenshot, we haven't changed much aside from adding the header
and footer to the page, but beneath the surface, we have also changed the structure of the
application, which we'll talk about shortly.

.. image:: images/04_composite_mojits.png
   :height: 634 px
   :width: 650 px
   :alt: Screenshot of 04 composite mojits application.

.. _04_intro-before_starting:

Before Starting
---------------

.. _04_before_starting-review:

Review of the Last Module
#########################

In the last module, we discussed frame mojits, and in particular, the 
HTMLFrameMojit that comes with Mojito. We also looked at adding CSS assets 
to our application using several different ways. More specifically, we 
covered the following:

- creating an instance of the HTMLFrameMojit
- configuring parent-child relationships between mojits
- adding assets with the Assets addon, with static URLs, and with the HTMLFrameMojit

.. _04_before_starting-setting_up:

Setting Up
##########


``$ cp -r 03_frame_mojit 04_composite_mojits``

.. _04_composite_mojits-lesson:

Lesson: Composite Mojits
========================

.. _04_lesson-intro:

Introduction
------------

Composite mojits are simply configuring a parent mojit to have children that 
it can execute with the Composite addon. This allows you to have central 
control over several mojits that are responsible for generating content for 
parts of a page, and it also allows you to share data and configuration with 
child mojits.

.. _04_lesson_intro-config_composite_mojits:

Configuring Composite Mojits
############################

Configuring composite mojits is very similar to configuring frame mojits, 
except composite mojits use the children object instead of the child object 
to define parent-child relationships. The composite mojit can also have many 
child mojit instances defined in the children object.


In the example ``application.json`` below, the layout instance in its config has 
defined three child mojit instances. This parent-child relationship lets the 
layout instance execute the actions of its child instances and then attach the 
content from those child instances to its template. 

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "appPort": "8666",
       "specs": {
         "layout": {
           "type": "PageLayout",
           "config": {
             "children": {
                "header": {
                  "type": "Header"
                },
                "body": {
                  "type": "Body"
                },
                "footer": {
                  "type": "Footer"
                }
              }
            }
          }
        }
      }
    }
  ]

You can imagine how our layout instance would organize the parts of the page 
such as the body, header, and footer, but we’re still going to need our ``HTMLFrameMojit`` 
to create the HTML skeleton and attached our content. To do this, we simply make our 
layout instance a child of the ``HTMLFrameMojit``. Notice though that our composite 
instance is now ``child`` and **not** ``layout``.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "appPort": "8666",
       "specs": {
         "tribframe": {
           "type": "HTMLFrameMojit",
           "config": {
             "deploy": true,
             "title": "Trib - Contribute to the Tribe",
             "child": {
               "type": "PageLayout",
               "config": {
                 "children": {
                   "header": {
                     "type": "Header"
                   },
                   "body": {
                     "type": "Body"
                   },
                   "footer": {
                     "type": "Footer"
                   }
                 }
               }
             }
           }
         }
       }
     }
   ]

As of now, the only mojit that we have that is creating content is ``Github``. 
As you would expect, we’d want that content to be in the body of our HTML document. 
The ``Body`` mojit seems like the right mojit to handle this content. We might want 
other mojits creating content for the body as well. It does sound as if our ``Body``
should be a composite mojit as well, and there are not limitations to using composite 
mojits (aside from possible performance problems), so let’s configure the ``body`` 
instance to be a composite mojit as well:

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "appPort": "8666",
       "specs": {
         "tribframe": {
           "type": "HTMLFrameMojit",
           "config": {
             "deploy": true,
             "title": "Trib - Contribute to the Tribe",
             "child": {
               "type": "PageLayout",
               "config": {
                 "children": {
                   "header": {
                     "type": "Header"
                   },
                   "body": {
                     "type": "Body",
                     "config": {
                       "children": {
                         "github": {
                           "type":"Github"
                         }
                       }
                     }
                   },
                   "footer": {
                     "type": "Footer"
                   }
                 }
               }
             }
           }
         }
       }
     }
   ]

.. _04_lesson-composite_addon:

Executing Child Mojits With the Composite Addon
-----------------------------------------------

The controller of the parent mojit uses the ``Composite`` addon to execute 
its child mojits. Like other addons, you require the ``Composite`` addon and 
have access to it through the ``ActionContext`` object. The ``Composite`` addon 
the two methods ``done`` and ``execute`` for executing child mojit. The snippet 
from the parent controller below uses the method ``ac.composite.done``:

.. code-block:: javascript

   ...
     ...
       index: function(ac) {
         // You can pass data to the parent mojit’s template and
         // meta data, such as a template name.
         ac.composite.done({ parent_data: “I’m the parent mojit” }, ‘custom’);
       }
     };
     // Add the string ‘mojito-composite-addon’ to access 
     // the Composite addon.
   }, '0.0.1', {requires: ['mojito','mojito-composite-addon']});


The ``ac.composite.done`` method is used much like ``ac.done``. You can pass data to the 
parent template as well as meta data such as the template name.

.. code-block:: javascript

   ...
     ...
       index: function(ac) {
         ac.composite.done({ parent_data: “I’m the parent mojit” }, ‘custom’);
       }
     };
     // Add the string ‘mojito-composite-addon’ to access 
     // the Composite addon.
   }, '0.0.1', {requires: ['mojito','mojito-composite-addon']});


The method ``ac.composite.execute``, however, requires that you explicitly pass 
configuration defining child mojit instances, making it more complicated to use 
but allows for the dynamic creation of mojit instances. 

.. code-block:: javascript

   ...
     ...
       index: function(ac) {
         // To use execute, you need to create the configuration
         // that defines the child mojit instances, but this 
         // allows you to dynamically execute mojit instances.
         var cfg = {
           children: {
             body: {
               type: "Body",
               action: "index"
             },
             header: {
               type: "Header",
               action: "index",
               params: {
                 route: {},
                 url: {},
                 body: {},
                 file: {}
               }
             }
           },
           assets: {}
        };
        actionContext.composite.execute(cfg)
      }
    };
    // Add the string ‘mojito-composite-addon’ to access 
    // the Composite addon.
  }, '0.0.1', {requires: ['mojito','mojito-composite-addon']});

We’re not going to dynamically create mojit instances, so it makes more 
sense to just use ``ac.composite.done`` to execute the child mojits. Based on 
what we’ve learned, the controller for the parent mojit ``BodyMojit shown 
below should make more sense. Based on our configuration, the ``body`` instance 
will execute the ``github`` instance. We’re also passing some data to the parent 
template, but how does the parent template attach the content created by our 
``github`` instance? Well, we’re going to look at that next. 
 
.. code-block:: javascript

   YUI.add('BodyMojit', function(Y, NAME) {

     Y.namespace('mojito.controllers')[NAME] = {

       index: function(ac) {
         Y.log("BodyMojit - controller.server.js index called");
         ac.composite.done({
           title: "Statistics for YUI"
         });
       }
     };
   }, '0.0.1', {requires: ['mojito','mojito-composite-addon']});

.. _04_lesson-parent_templates:

Parent Mojit Templates
----------------------

We’ve already seen how data from the controller is captured in templates 
by Handlebars expressions. Attaching the content from child mojits to 
parent templates is done in the same way. In the parent template, you 
use the Handlebars expressions and the mojit instance name to attach the 
content. In our configuration, the ``body`` instance has the one child ``github``, 
so in the template of the BodyMojit, you use the Handlebars expression 
``{{github}}`` to get the content from the ``github`` instance:

.. code-block:: html

   <div id="{{mojit_view_id}}" class="mojit">
     <h4 class="bodytext">{{title}}</h4>
     <div class="bodyMojitStuff">
       {{{github}}}
     </div>
   </div>

.. _04_lesson-yui:

YUI CSS
-------

In this module, we use YUI CSS to style our application. We’re 
going to look at the YUI CSS files and discuss what they do
for the application.

.. _04_lesson_yui-normalize:

Normalize
#########

File: "http://necolas.github.com/normalize.css/1.0.2/normalize.css",

.. _04_lesson_yui-normalize:

Forms
#####

File: "https://rawgithub.com/tilomitra/cssforms/master/css/forms.css",

.. _04_lesson_yui-response_grid:

Response Grid          
#############
                     
Files
*****

- "https://rawgithub.com/tilomitra/cssforms/master/css/forms-responsive.css",
- "https://rawgithub.com/tilomitra/csslist/master/css/list-responsive.css",
- "http://yui.yahooapis.com/3.9.0pr3/build/cssgrids-responsive/cssgrids-responsive-min.css",

.. _04_lesson_yui-buttons:

Buttons
#######

- "http://yui.yahooapis.com/3.8.0/build/cssbutton/cssbutton-min.css",

.. _04_lesson_yui-lists:

Lists
#####

- "https://rawgithub.com/tilomitra/csslist/master/css/list-core.css",
- "https://rawgithub.com/tilomitra/csslist/master/css/list.css",
- "https://rawgithub.com/tilomitra/csslist/master/css/list-paginator.css",

.. _04_lesson_yui-lists:             

UI                                
##

- "https://rawgithub.com/tilomitra/yuicss-common/master/ui.css",

.. _04_lesson_yui-custom:

Custom
######

-  "/static/04_composite_mojits/assets/trib.css"

.. tip:: Nulla mattis volutpat justo, et elementum quam condimentum vel. 

.. _04_composite_mojits-create:

Creating the Application
========================

#. Change to the ``04_composite_mojits`` application.
#. Although we’re still using the ``HTMLFrameMojit`` to create the Web page, we are also 
   going to create the mojit ``PageLayout`` to handle the layout of the Web page.
  
   ``$ mojito create mojit PageLayout``

#. For ``PageLayout`` to control the layout of the content of the other mojits, 
   it will have to be a composite mojit. As we’ve seen in our lesson, to create a 
   composite mojit instance, you give it a ``config.children`` object where its child 
   mojit instances are defined. The hierarchy should be frame mojit -> composite mojit -> child mojit. 
   This structure will be reflected in the configuration, so the ``HTMLFrameMojit`` 
   will be the top-level mojit (this is required for frame mojits), its child 
   will be the composite mojit, and the composite mojit will have children. Let’s 
   create this mojit structure by replacing the content of your ``application.json``
   with the following:

   .. code-block:: javascript

      [
        {
          "settings": [ "master" ],
          "appPort": "8666",
          "specs": {
            "tribframe": {
              "type": "HTMLFrameMojit",
              "config": {
                "deploy": true,
                "title": "Trib - Contribute to the Tribe",
                "child": {
                  "type": "PageLayout",
                  "config": {
                    "children": {
                      "header": {
                        "type": "Header"
                      },
                      "body": {
                        "type": "Body",
                        "config": {
                          "children": {
                            "github": {
                              "type":"Github"
                            }
                          }
                        }
                      },
                      "footer": {
                        "type": "Footer"
                      }
                    }
                  }
                },
                "assets": {
                  "top": {
                    "css": [
                      "http://yui.yahooapis.com/3.9.0/build/cssnormalize/cssnormalize-min.css",
                      "http://yui.yahooapis.com/gallery-2013.03.13-20-05/build/gallerycss-cssform/gallerycss-cssform-min.css",
                      "http://yui.yahooapis.com/3.9.0/build/cssgrids-responsive/cssgrids-responsive-min.css",
                      "http://yui.yahooapis.com/3.9.0/build/cssbutton/cssbutton-min.css",
                      "http://yui.yahooapis.com/gallery-2013.03.13-20-05/build/gallerycss-csslist/gallerycss-csslist-min.css",
                      "https://rawgithub.com/tilomitra/yuicss-common/master/ui.css",
                      "/static/04_composite_mojits/assets/trib.css"
                    ]
                  }
                }
              }
            }
          }
        },
        {
          "settings": [ "environment:development" ],
          "staticHandling": {
            "forceUpdate": true
          }
        }
      ]
#. Update the ``routes.json`` so that we have routing paths for our child mojits and
   one path to call our frame mojit:

   .. code-block:: javascript

      [
        {
          "settings": [ "master" ],
          "root": {
            "verbs": ["get"],
            "path": "/",
            "call": "tribframe.index"
          },
          "header": {
            "verbs":["get"],
            "path": "/header",
            "call": "header.index"
          },
          "body": {
            "verbs": ["get"],
            "path": "/body",
            "call": "body.index"
          },
          "footer": {
          "verbs": ["get"],
          "path": "/footer",
          "call": "footer.index"
        }
      }
    ]

#. Try running the app, and you’ll see the familiar Mojito default application again. 
   Our application works, but the composite mojit isn’t really doing much with the 
   content of its children. That’s because it hasn’t used the ``Composite`` addon to 
   execute its children and attached the content from those children to the template.
   The first step is have the controller of the LayoutMojit use the Composite addon 
   and call ``ac.composite.done``:

   .. code-block:: javascript

      YUI.add('PageLayout', function(Y, NAME) {

        /**
        * The PageLayout module.
        *
        * @module PageLayout
        */

        /**
        * Constructor for the Controller class.
        *
        * @class Controller
        * @constructor
        */
        Y.namespace('mojito.controllers')[NAME] = {

          /**
          * Method corresponding to the 'index' action.
          *
          * @param ac {Object} The ActionContext that provides access
          *        to the Mojito API.
          */
          index: function(ac) {
            ac.composite.done({
              title: "Trib - Contribute to the Tribe"
            });
          }
        };
      }, '0.0.1', {requires: ['mojito','mojito-composite-addon']});


#. In the template of the composite mojit, we can use the child instance names in 
   Handlebars expressions to attach the content of the rendered children to the 
   template:

   .. code-block:: html

      <div id="{{mojit_view_id}}" class="mojit frame" >
        <h1>{{title}}</h1>
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

#. Try running app again. It isn’t much but you can at least see the same default 
   content being rendered three times and attached to the page. The next step is 
   to modify our children so that we have more interesting content.

#. For the ``Header`` mojit, update the ``controller.server.js`` and ``index.hb.html`` with the 
   content below. Note that our controller is not contributing much because 
   the content is mostly static.

   .. code-block:: javascript

      /*jslint anon:true, sloppy:true, nomen:true*/
      YUI.add('Header', function(Y, NAME) {

        /**
        * The Header module.
        *
        * @module Header
        */

        /**
        * Constructor for the Controller class.
        *
        * @class Controller
        * @constructor
        */
        Y.namespace('mojito.controllers')[NAME] = {

          /**
          * Method corresponding to the 'index' action.
          *
          * @param ac {Object} The ActionContext that provides access
          *        to the Mojito API.
          */
          index: function(ac) {
            ac.done({
              title: ""
            });
          }
        };
      }, '0.0.1', {requires: ['mojito']});


   .. code-block:: html

      <div id="{{mojit_view_id}}" class="mojit">
        <h3>{{title}}</h3>
      </div>


#. Do the same thing for the ``Footer`` mojit. Again, mostly static content, 
   which is what you would expect from the header and footer.

   .. code-block:: javascript

      YUI.add('Footer', function(Y, NAME) {

        /**
        * The Footer module.
        *
        * @module Footer
        */
        /**
        * Constructor for the Controller class.
        *
        * @class Controller
        * @constructor
        */
        Y.namespace('mojito.controllers')[NAME] = {
          /**
          * Method corresponding to the 'index' action.
          *
          * @param ac {Object} The ActionContext that provides access
          * to the Mojito API.
          */
          index: function(ac) {
            ac.done({
              title: "Copyright 2013 Yahoo! Inc."
            });
          }
        };
      }, '0.0.1', {requires: ['mojito']});

   .. code-block:: html

      <div id="{{mojit_view_id}}" class="mojit">
        <small>{{title}}</small>
      </div>

#. In our application, the ``Body`` mojit is responsible for the dynamic content of 
   our page. Let’s update the controller and template with some 
   content, but we’re not done with this mojit yet--just look at that 
   empty ``<div>`` tag in the template.

   .. code-block:: javascript

      YUI.add('Body', function(Y, NAME) {

        /**
        * The Body module.
        *
        * @module Body
        */

        /**
        * Constructor for the Controller class.
        *
        * @class Controller
        * @constructor
        */
        Y.namespace('mojito.controllers')[NAME] = {
          /**
          * Method corresponding to the 'index' action.
          *
          * @param ac {Object} The ActionContext that provides access
          * to the Mojito API.
          */
          index: function(ac) {
            Y.log("Body - controller.server.js index called");
            ac.composite.done({
              title: "Statistics for YUI"
            });
          }
        };
      }, '0.0.1', {requires: ['mojito', 'mojito-composite-addon']});

   .. code-block:: html

      <div id="{{mojit_view_id}}" class="mojit">
        <h4 class="bodytext">{{title}}</h4>
        <div class="bodyMojitStuff">
          {{{github}}}
        </div>
      </div>

#. Let's also simplify the ``Github`` mojit, removing the ``custom`` template by replacing
   the contents with the following:

   .. code-block:: javascript

      YUI.add('Github', function(Y, NAME) {

        Y.namespace('mojito.controllers')[NAME] = {

          index: function(ac) {

            var model = ac.models.get('GithubModelFoo');
            Y.log(model);
            model.getData(function(data){
              Y.log("Github -index - model.getData:");
              Y.log(data);
              ac.done({
                title: "",
                watchers: data.watchers,
                forks: data.forks
              });
            });
          }
        };
      }, '0.0.1', {requires: ['mojito', 'mojito-models-addon']});

#. The model for the ``Github`` mojit has a slight change as well. Replace the
   ``getData`` method with the following:

   .. code-block:: javascript

      getData: function(callback) {
            callback(null, { watchers: 1, forks: 1 });
      }
#. Also, update the ``index.hb.html`` for the ``Github`` mojit
   with the following markup:

   .. code-block:: html

      <div id="{{mojit_view_id}}" class="mojit">
        <h4>{{title}}</h4>
        <div class="mymodule">
          <h3>YUI GitHub Stats</h3>
          <div>Github watchers: <span>{{watchers}}</span></div>
          <div>Github forks: <span>{{forks}}</span></div>
        </div>
      </div>

#. Before we run our application, let's do a little clean up by deleting our custom 
   template ``Github/views/custom.hb.html`` and the custom CSS (``04_composite_mojits/assets/custom.css``),
   which we will no longer be using.
#. Start your app again to see the mocked GitHub stats that is being attached to the
   template of the ``Body`` mojit. The page would be more useful with real data,
   so, that will be the topic of our next module.

.. _04_composite_mojits-ts:

Troubleshooting
===============

Problem One
-----------

Nulla pharetra aliquam neque sed tincidunt. Donec nisi eros, sagittis vitae lobortis nec, 
interdum sed ipsum. Quisque congue tempor odio, a volutpat eros hendrerit nec. 
Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae;

Problem Two
-----------

Nulla pharetra aliquam neque sed tincidunt. Donec nisi eros, sagittis vitae lobortis nec, 
interdum sed ipsum. Quisque congue tempor odio, a volutpat eros hendrerit nec. 
Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae;

.. _04_composite_mojits-summary:

Summary
=======

In this module, we covered the following:

- blah, blah
- blah, blah

.. _04_composite_mojits-qa:

Q&A
===

How do you...

.. _04_composite_mojits-test:

Test Yourself
=============

- What are the differences between configuring a frame mojit and a composite mojit?
- What Handlebars expression allows you to attach the content of a child mojit?
- What are the two Composite addon methods that allow parent mojits to execute child mojits?

.. _04_composite_mojits-terms:

Terms
=====

- composite

.. _04_composite_mojits-src:

Source Code
===========

- [app_part{x}](http://github.com/yahoo/mojito/examples/quickstart_guide/app_part{x})

.. _04_composite_mojits-reading:

Further Reading
===============

- [Mojito Doc](http://developer.yahoo.com/cocktails/mojito/docs/)
- website

