

==============
Action Context
==============

The Action Context is an essential element of the Mojito framework that gives you access to the frameworks features from within a controller function. To use the Action Context, 
you create an instance of the ``ActionContext`` class, which we will call ``ac`` for short. From ``ac``, you can call methods to execute mojit actions within either a server or 
client context. See the `ActionContext Class <../../api/classes/ActionContext.html>`_ for the methods available from ``ac``.

One of the most common methods used from an instance of the ``ActionContext`` class is ``done``, which lets you pass data from the controller to a view. In the example ``controller.server.js`` below, 
the ``done`` method sends the ``data`` object to the ``index`` view template.

.. code-block:: javascript

   YUI.add('HelloMojit', function(Y) {
     /**
     * The HelloMojit module.
     *
     * @module HelloMojit
     */
     /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
     Y.mojito.controller = {
       init: function(config) {
         this.config = config;
       },
       /**
       * Method corresponding to the 'index' action.
       *
       * @param ac {Object} The action context that
       * provides access to the Mojito API.
       */
       index: function(ac) {
         var data = { "data":"data passed to the index view template" };
         ac.done(data);
       }
     };
   }, '0.0.1', {requires: []});


