=========================================
Tutorial: Creating Your First Application
=========================================

In this tutorial, you create a simple application that serves a single page and uses a controller to generate output. 

You will learn how to do the following:

- create an application
- create a mojit
- configure a mojit
- run an action (method) on the controller
- run unit tests for your application


Make the Application
####################

#. Create a directory for your app and change to it.

   ``$ mkdir mojito_apps``

   ``$ cd mojito_apps``

#. Create the Mojito application  ``minty_app``.

   ``$ mojito create app minty_app``

#. Change to your application directory.

   ``$ cd minty_app``

Make the Sample Mojit
#####################

The name *mojit* is a fusion of the words module and widget. The mojit, however, is neither a module nor a widget. Instead, it is best understood as 
a unit of execution used to generate output. Mojits have an MVC structure and consist of two parts: the definition and the instance configuration.

The definition contains the controller and model code for the mojit, along with the views (and assets) used to render the output. The definition also 
contains unit tests for the code.

The instance configuration is what configures each instance of your mojit. For example, you might have an ``RSSMojit`` which is used to display an 
RSS feed. The mojit definition would have the code and views for fetching and rendering a feed, and the instance configuration would have the RSS URL 
to fetch, how many items to show, and whether to show thumbnails, etc.

Let's now begin by creating your mojit, but note that you won't be working with models or views in this tutorial.

#. Create the mojit for your ``minty_app`` application.

   ``$ mojito create mojit HelloMojit``

   The `Mojito command-line tool <../reference/mojito_cmdline.html>`_ creates a canned mojit definition named ``HelloMojit``.

#. To configure your application to use ``HelloMojit``, replace the code in ``application.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": [ "master" ],
          "appPort": 8666,
          "specs": {
            "hello": {
              "type": "HelloMojit"
            }
          }
        }
      ]

   Here you have defined the instance ``hello`` of the ``HelloMojit`` mojit, which will allow you to call the functions in the mojit controller.

#. To set up a new route for executing your mojit, create the routing configuration file ``routes.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": [ "master" ],
          "hello index": {
            "verbs": ["get"],
            "path": "/",
            "call": "hello.index"
          }
        }
      ]

   This ``routes.json`` file defines the routing paths, the accepted HTTP methods, and what action to take. 
   The action is what method to call from the mojit instance when a call is made on the defined path. 
   The ``routes.json`` above configures Mojito to execute the ``index`` method from the ``hello`` 
   instance (defined in ``application.json``) when receiving HTTP GET calls on the root path.

#. From the application directory, test your application. You will notice that some tests are deferred.

   ``$ mojito test app .``

Start the Server
################

#. Start the server.

   ``$ mojito start``

#. Open http://localhost:8666/ in a browser.

#. The Web page should display "Mojito is working.". The text was served by the controller, the ``controller.server.js`` file in the ``minty_app/mojits/HelloMojit`` directory. You will learn more about the controller in `Modify the Sample Mojit`_.

#. Stop the server by going back to your terminal pressing **^C**.


.. _first_app-modify_mojit:

Modify the Sample Mojit
#######################

You will now modify the controller, so that the ``index`` function called in the controller outputs different results.

#. Change to ``mojits/HelloMojit``.

#. Edit ``controller.server.js`` and replace the string 'Just a simple mojit.' in the code with 'Hello World!'. Your ``controller.server.js`` should look similar to the following code:

   .. code-block:: javascript

      YUI.add('HelloMojit', function(Y, NAME) {

        /**
        * The HelloMojit module.
        *
        * @module HelloMojit
        **/

       /**
        * Constructor for the Controller class.
        *
        * @class Controller
        * @constructor
        */
        Y.mojito.controllers[NAME] = {

          init: function(config) {
            this.config = config;
          },

          /**
          * Method corresponding to the 'index' action.
          *
          * @param ac {Object} The ActionContext that provides access
          *        to the Mojito API.
          **/
          index: function(ac) {
            ac.models.HelloMojitModelFoo.getData(function(err, data) {
              if (err) {
                ac.error(err);
                return;
              }
              ac.assets.addCss('./index.css');
              ac.done({
                status: 'Hello World!',
                data: data
              });
            });
          }
        };
      }, '0.0.1', {requires: ['mojito', 'HelloMojitModelFoo']});


   As you can see the "controllers" are just an array of JavaScript objects, and the "action" is just a method called on the controller object. 
   The result of the method are communicated back to Mojito through the ``actionContext`` object. 

#. Change to the ``tests`` directory.

#. Edit ``controller.server-tests.js`` and replace the string 'Mojito is working.' in the code with 'Hello World!'. Your ``controller.server-tests.js`` should look similar to the  following code:

   .. code-block:: javascript

      YUI.add('HelloMojit-tests', function(Y) {

        var suite = new YUITest.TestSuite('HelloMojit-tests'),
           controller = null,
           A = YUITest.Assert;

        suite.add(new YUITest.TestCase({

          name: 'HelloMojit user tests',

          setUp: function() {
             controller = Y.mojito.controllers.HelloMojit;
          },
          tearDown: function() {
             controller = null;
          },

          'test mojit': function() {
            var ac, modelData, assetsResults, doneResults;
            modelData = { x:'y' };
            ac = {
              assets: {
                addCss: function(css) {
                  assetsResults = css;
                }
              },
              models: {
                HelloMojitModelFoo: {
                  getData: function(cb) {
                    cb(null, modelData);
                  }
                }
              },
              done: function(data) {
                doneResults = data;
              }
            };
            A.isNotNull(controller);
            A.isFunction(controller.index);
            controller.index(ac);
            A.areSame('./index.css', assetsResults);
            A.isObject(doneResults);
            A.areSame('Hello World!', doneResults.status);
            A.areSame('{"x":"y"}', doneResults.data);
          }

        }));

        YUITest.TestRunner.add(suite);

      }, '0.0.1', {requires: ['mojito-test', 'HelloMojit']});

   Mojito has the unit test given in ``controller.server-tests.js`` confirms that the output from the action index is the same as the 
   string given in the assert statement.

#. From the application directory, run the application test.

   ``$ mojito test app .``

#. Restart the server and reopen http://localhost:8666/ in a browser to see the text "Hello World!"

#. Congratulations, now go try our `code examples <../code_exs/>`_ or check out the `Mojito Documentation <../>`_.

