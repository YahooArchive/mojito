

================
Composite Mojits
================

Introduction
############

A composite mojit is a parent mojit that has child mojits. This parent mojit is responsible for the execution and layout of its children. 
The child mojits as subordinates create content and provide functionality for the parent mojit. See `Using Multiple Mojits <../code_exs/multiple_mojits.html>`_ for a working example of composite mojits.


Creating Parent and Child Mojit Instances
#########################################

As with any mojit, you need to define a mojit instances in ``application.json``. The parent mojit instance defines its child mojits in the ``children`` object. 
In the example ``application.json`` below, the parent mojit instance is ``foo``, which has the child mojit instances ``nav``, ``news``, and ``footer``. 
Each mojit instance has a ``type`` that specifies the mojits that are instantiated. Because the parent mojit has children, you cannot use an anonymous 
mojit instance in ``routes.json`` to call an action. For example, in ``routes.json``, you could have ``"call": "foo.index"``, but not ``"call": "@MyComp.index"``. 

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         "foo": {
           "type": "MyComp",
           "config": {
             "children": {
               "nav": {
                 "type": "Nav"
               },
               "news": {
                 "type": "News"
               },
               "footer": {
                  "type": "Footer"
               }
             }
           }
         }
       }
     }
   ]

Executing Child Mojits
######################

The parent mojit instance defined in ``application.json`` can access the ``config`` object and execute the child mojits from the controller. 
The ``init`` function of the controller is passed ``config``, which has the ``children`` object listing the child mojits.

In the example controller of ``ParentMojit`` below, the ``init`` function saves and displays the ``children`` object that lists the child mojits.

.. code-block:: javascript

   YUI.add('ParentMojit', function(Y) {
     Y.mojito.controller = {
       init: function(config) {
         this.config = config;
         // Displays the 'children' object that is
         // defined in application.json
         Y.log(this.config);
       },
       ...
     }
   }

When the controller of the parent mojit calls ``ac.composite.done`` from the ``index`` function, the controllers of the mojit children execute ``ac.done`` 
from their ``index`` functions. The rendered views from the child mojits are then available as Handlebars expressions in the ``index`` view template of the 
parent mojit.

For example, in the example controller of the parent mojit below, the ``index`` function calls ``ac.composite.done``, which executes ``ac.done`` in the ``index`` 
functions of the child mojits. The rendered ``index`` views for each of the child mojits is then available to as a Handlebars expression, such as ``{{{child_mojit}}}``.
Notice that the ``template`` object allows the parent mojit to send data to the view template, so that ``{{title}}`` can be used in the 
view template.

.. code-block:: javascript

   YUI.add('ParentMojit', function(Y, NAME) {
     Y.mojito.controllers[NAME] = {
       init: function(config) {
         this.config = config;
       },
       index: function(ac) {
         ac.composite.done({ template: { title: 'Recent News'}});
       }
     };
   }, '0.1.0', {requires: []});

If ``ParentMojit`` above is the parent of ``ChildMojit``, the controller of ``ChildMojit`` shown below will execute ``ac.done`` in the ``index`` function.

.. code-block:: javascript

   YUI.add('ChildMojit', function(Y, NAME) {
     Y.mojito.controllers[NAME] = {
       init: function(config) {
         this.config = config;
       },
       index: function(ac) {
         ac.done({ title: 'Child Mojit'});
       }
     };
   }, '0.1.0', {requires: []});

Displaying Child Mojits in View
###############################

After the controller of the parent mojit calls ``ac.composite.done``, its view template then has access to the content created by the child mojits. 
The view template of the parent mojit can use Handlebars expressions to embed the output from the child mojits. For example, if the child mojit instance 
``footer`` was defined in ``application.json``, the view template of the parent mojit could use  ``{{{footer}}}`` to embed the content created 
by ``footer``.

In the example ``index`` view template of the parent mojit below, the rendered ``index`` view templates of the child mojits  ``nav``,  ``body``, ``footer`` are embedded using Handlebars expressions.


.. code-block:: html

   <div id="{{mojit_view_id}}" class="mojit" style="border: dashed black 1px;">
   <h1>{{title}}</h1>
   <div class="nav" style="border: dashed black 1px; margin: 10px 10px 10px 10px;">{{{nav}}}</div>
   <div class="body" style="border: dashed black 1px; margin: 10px 10px 10px 10px;">{{{body}}}</div>
   <div class="footer" style="border: dashed black 1px; margin: 10px 10px 10px 10px;">{{{footer}}}</div>
   </div>
   

Dynamically Defining Child Mojits
#################################

In some cases, the parent mojit won't know the children specs until runtime. For example, the specs of the children might depend on the results of a 
Web service call. In such cases, your controller can generate the equivalent of the ``config`` object and a callback, which are then passed 
to ``ac.composite.execute``. Using ``ac.composite.execute`` lets you run dynamically defined child mojits. 
See `Running Dynamically Defined Mojit Instances <./mojito_run_dyn_defined_mojits.html>`_ for more information.

