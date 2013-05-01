=============
MVC in Mojito
=============

The MVC architecture in Mojito incorporates a clear separation of the 
controller, model, and view. The controller is pivotal in the sense that it controls 
all interactions in the MVC of Mojito.The controller retrieves data from the model 
and passes it to the view. Client requests for data are sent to the controller, 
which in turn fetches data from the model and passes the data to the client. 

The controller, model, and view are found in the mojit of Mojito. The mojit 
is a single unit of execution of a Mojito application. An application may 
have one or more mojits, which are physically represented by a directory 
structure. Each mojit has one controller, any number or no models, and one 
or more views. When Mojito receives an HTTP request, an application invokes 
a mojit controller that can then execute, pass data to the view, or get data 
from the model. Let's look now at each of the MVC components in more detail.

.. _mojito_mvc-models:

Models
======

Models are intended to closely represent business logic entities and contain code that 
accesses and persists data. Mojito lets you create one or more models at the 
application and mojit level that can be accessed from controllers.

.. _mvc_models-loc:

Location
--------

Models are found in the ``models`` directory of each mojit. For the application 
``hello`` with the mojit ``HelloMojit``, the path to the models would be 
``hello/mojits/HelloMojit/models``.

.. _mvc_models-naming:

Naming Convention
-----------------

The name of the model file depend on the affinity, which is the location 
where a resource is available. Thus, the name of the model file is 
``{model_name}.{affinity}.js``, where ``{affinity}`` can be ``common``, 
``server``, or ``client``. 

When adding the model as a module with ``YUI.add``,  we suggest 
you use the following syntax: ``{mojit_name}Model{Model_name}``

For the default model ``model.server.js``, the suggested convention is 
``{mojit_name}Model`` for the module name.

Thus, the ``YUI.add`` statement in ``photos/models/flickr.server.js`` would 
be the following:

.. code-block:: javascript

   YUI.add("photosModelFlickr", function(Y, NAME) {
      ...
   }

.. _mvc_models-structure:

Basic Structure
---------------

A model should have the basic structure shown below. 

.. code-block:: javascript

   YUI.add('{mojit_name}Model{Model_name}', function(Y, NAME) {
     // Models must register themselves with YUI.add
     // Namespace for models
     Y.namespace('mojito.models')[NAME] = {
       // Optional init() method is given the
       // mojit configuration information.
       init: function(config) {
         this.config = config;
       },
       // Model methods ideally are asynchronous, and
       // thus need some way of notifying the caller
       // when the method is done.
       someMethod: function(foo, bar, callback) {
         // ... get some data ...
         callback(data);
       }
     };
     // The requires array list the YUI module dependencies
   }, '0.0.1', { requires:[] });


.. _mvc_models-objs:

Model Objects and Methods
-------------------------

The following objects and methods form the backbone of the model.

- ``YUI.add`` - (required) adds the module 
- ``Y.namespace('mojito.models')[NAME]`` - (required) registers the model 
- ``init`` - (optional) gets configuration information 


The example model below shows you how the objects and methods are used. The 
``galleryModelFlickr`` model is registered with ``YUI.add``, and the namespace 
for the model is created with ``Y.namespace('mojito.models')[NAME]``. The 
``init`` function stores the date so it can be used by other functions, and 
the ``requires`` array instructs Mojito to load the YUI module ``yql`` for 
getting data.

.. code-block:: javascript

   YUI.add('galleryModelFlickr', function(Y, NAME) {
   
     // Models must register themselves in the 
     // Namespace for model
     Y.namespace('mojito.models')[NAME] = {
       // Optional init() method is given the mojit 
       // configuration information.       
       init: function(config) {
         this.config = config;        
       },
       // Model function to get data
       get_photos: function(flickr_query, callback){
         Y.YQL (flickr_query, function(rawYql) {
           // Handle empty response.
           if (null == rawYql || 0 == rawYql.query.count) {
             callback ([]); 
           } else {
             callback(rawYql.query.results);
           }
       }
     };
   }, '0.0.1', {requires: ['yql']});

.. _mvc_models-using:    

Using Models
------------

The function of the model is to get information and send it to the controller. 
When calling model functions from a mojit controller, a callback function must 
be provided to allow for the model code to run long-term processes for data 
storage and retrieval. As a matter of best practice, the model should be a YUI 
module and not include blocking code, although blocking code can be used.

See :ref:`Calling the Model <mvc-controllers-call_model>` to learn how
to call the model from the controller.

.. _mvc_models-ex:    

Example
-------

.. code-block:: javascript

   YUI.add('weatherModelForecast', function(Y, NAME) {
     // Models must register themselves in the
     // Namespace for model
     Y.namespace('mojito.models')[NAME] = {
       // Optional init() method is given the mojit
       // configuration information.
       init: function(config) {
         this.config = config;
       },
       /**
       * Method that will be invoked by the
       * mojit controller to obtain data.
       * @param callback {Function} The callback
       * function to call when the data has been retrieved.         
       */
       forecast: function(zip_code,callback) {
         var zip = zip_code || "94040";
         var query = "select * from weather.forecast where location=" + zip;
         Y.YQL (query, function(rawYql) {
           // Handle empty response.
           if (null == rawYql || 0 == rawYql.query.count) {
             callback ([]);
           } else {
             callback({ "link": rawYql.query.results.channel.link});
           }
         });
       }
     };
   }, '0.0.1', {requires: ['yql']});


.. _mojito_mvc-controllers:

Controllers
===========

After an application has been configured to use a mojit, the mojit controller can either 
do all of the work or delegate the work to models and/or views. In the typical case, the 
mojit controller requests the model to retrieve data and then the controller serves that 
data to the views.

Location
--------

Controllers are found in the mojit directory. For the application 
``hello`` with the mojit ``HelloMojit``, the path to the controller would be 
``hello/mojits/HelloMojit/controller.server.js``.

.. _mvc_controllers-naming:

Naming Convention
-----------------

.. _controllers_naming-files:

Files
#####

A mojit can only use one controller, but may have a different controller for each 
environment (client vs server). The name of the mojit controllers uses the syntax 
``controller.{affinity}.js``, where the value can be ``common``, ``server``, or 
``client``. The affinity is simply the location of the resource, which is important 
because code can be deployed to the client.

.. _controllers_naming-yui_mod:

YUI Module
##########

When registering the controller as a module with ``YUI.add`` in the controller,  
you need to use the mojit name, which is also the same as the mojit directory 
name: ``YUI.add({mojit_name}, ...);``

Thus, the ``YUI.add`` statement in ``mojits/flickr/controller.server.js`` would 
be the following:

.. code-block:: javascript

   YUI.add("flickr", function(Y, NAME) {
      ...
   });


.. _mvc-controllers-structure:

Basic Structure
---------------

A controller should have the basic structure shown below. 

.. code-block:: javascript

   YUI.add('{mojit_name}', function(Y, NAME)
     // Module name is {mojit-name}
     // Constructor for the Controller class.
     Y.namespace('mojito.controllers')[NAME] = {

       /**
       * Method corresponding to the 'index' action.
       * @param ac {Object} The ActionContext object
       * that provides access to the Mojito API.
       */
       index: function(ac) {
         ac.done({data: "Here is a string"});
       },
       // Other controller functions
       someFunction: function(ac) {
         ac.done("Hello");
       },
     };
     // The requires array lists the YUI module dependencies
   }, '0.0.1', {requires: []});

.. _mvc-controllers-objs:

Controller Objects and Methods
------------------------------

Several objects and methods form the backbone of the controller.

- ``YUI.add`` - (required) registers the controller as a YUI module in the Mojito 
  framework. 
- ``Y.namespace('mojito.controllers')[NAME]`` -  (required) creates a namespace 
  that makes functions available as Mojito actions.
- ``this`` - a reference pointing to an instance of the controller that the 
  function is running within. This means that you can refer to other functions 
  described within ``Y.namespace('mojito.controllers')[NAME]`` using 
  ``this.otherFunction``. This is helpful when you've added some utility functions 
  onto your controller that do not accept an ``ActionContext`` object.
- ``requires`` - (optional) an array that lists any addons that are needed 
  by the controller.

.. _mvc_controller-ex:    

Example
-------

The example controller below shows you how the components are used. The 
``status`` mojit is registered with ``YUI.add``, and the ``index`` function 
uses the ``this`` reference to call the function ``create_status``. Lastly, the 
``requires`` array loads the addons ``Intl``, ``Params``, and ``Url`` that are 
needed by the controller. 

.. code-block:: javascript

   YUI.add('status', function(Y, NAME) {
     Y.namespace('mojito.controllers')[NAME] = {  

       index: function(ac) {
         var dateString = ac.intl.formatDate(new Date());
         var status = ac.params.getFromMerged('status');
         var user = ac.params.getFromMerged('user');
         var status = {
           greeting: ac.intl.lang("TITLE"),
           url: ac.url.make('status','index'),
           status: this.create_status(user,status, dateString)
         };
         ac.done(data);
       },
       create_status: function(user, status, time) {
         return user + ': ' +  status + ' - ' + time;
       }
     };
   }, '0.0.1', {requires: ['mojito-intl-addon', 'mojito-params-addon', 'mojito-url-addon']});

.. _mvc-controllers-actions:

Controller Functions as Mojito Actions
--------------------------------------

When mojit instances are created in the application configuration file, you 
can then call controller functions as actions that are mapped to route paths.

In the application configure file ``application.json`` below, the mojit instance 
``hello`` is created.

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

The controller for the ``HelloMojit`` mojit has an ``index`` function that we 
want to call when an HTTP GET call is made on the root path. To do this, the 
route configuration file ``routes.json`` maps the ``hello`` instance and the 
``index`` action to the root path with the ``path`` and ``call`` properties 
as seen below.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "hello index": {
         "path": "/",
         "call": "hello.index"
       }
     }
   ]

In the controller, any function that is defined in the 
``Y.namespace('mojito.controllers')[NAME]`` is available as a Mojito action. 
These functions can only accept the ``ActionContext`` object as an argument. 
In the example controller below, the ``index`` and ``greeting`` functions 
are available as Mojito actions.

.. code-block:: javascript

   YUI.add('Stateful', function(Y, NAME) {
     Y.namespace('mojito.controllers')[NAME] = {  

       index: function(ac) {
         ac.done({id: this.config.id});
       },
       greeting: function(ac) {
         ac.done("Hello");
       },
     };
     // The requires array list the YUI module dependencies
   }, '0.0.1', {requires: []});



.. _mvc-controllers-call_model:

Calling the Model
-----------------

The mojit controller communicates with the model through the 
`ActionContext object <../api_overview/mojito_action_context.html>`_ and a 
syntax convention. The ``ActionContext`` object allows controller functions 
to access framework features such as API methods and addons that extend 
functionality. To access the model from the ActionContext object ``ac``, 
you use the following syntax: ``ac.models.get('{model_name}').{model_function}``
You also need to require the ``Models`` addon by adding the string 
``"mojito-models-addon"`` to the ``requires`` array.

The ``{model_name}`` is the YUI module name that is passed to ``YUI.add`` of the 
model file, not the model file name. The example controller below shows the 
syntax for calling the model from a controller. 

.. code-block:: javascript

   YUI.add('{mojit_name}', function(Y, NAME) {
     Y.namespace('mojito.controllers')[NAME] = { 
       index: function(ac) {
         var model = ac.models.get('{model_name}');
       }
     };
   }, '0.0.1', { requires:[
     'mojito-models-addon',
     '{model_name}'
   ]});

For example, if you wanted to use the ``photo_search`` function in the model for the 
``flickr`` mojit, you would use the following: ``ac.models.get('flickr').photo_search(args, callback);``

The ``controller.server.js`` below shows a simple example of calling 
``get_data`` from the model ``simpleModel``.

.. code-block:: javascript

   YUI.add('simple', function(Y, NAME) {
     Y.namespace('mojito.controllers')[NAME] = {  

       index: function(ac) {
         var model = ac.models.get('simpleModel');
         model.get_data (function(data) {
           ac.done (
             {
               simple_data: data
             }
           )
         });
       }
     };
   }, '0.0.1', {requires: [
     'mojito-models-addon',
     'simpleModel'
   ]});

For a more detailed example, see `Calling the Model`_ and 
`Calling YQL from a Mojit <../code_exs/calling_yql.html>`_.

.. _mvc-controllers-pass_data:

Passing Data to the View
------------------------

The controller also uses the ``ActionContext`` object to send data to the view. 
Calling the ``done`` method from the ``ActionContext`` object, you can send literal 
strings or objects, with the latter being interpolated in template tags that are 
rendered by the appropriate view engine. The ``done`` method should only be 
called once. If neither ``done`` nor ``error`` is called within 60 seconds, Mojito 
will log a warning and invoke ``error`` with a Timeout error.  
You can change the default timeout value of 60000ms (60 seconds) by setting the 
``actionTimeout`` property of your application configuration.

In the example ``controller.server.js`` below, the ``index`` function sends the ``user`` 
object to the ``index`` template.

.. code-block:: javascript

   YUI.add('UserMojit', function(Y, NAME) {
     /**
     * The HelloMojit module.
     * @module HelloMojit
     */
     /**
     * Constructor for the Controller class.
     * @class Controller
     * @constructor
     */
     Y.namespace('mojito.controllers')[NAME] = {  

       /**
       * Method corresponding to the 'index' action.
       * @param ac {Object} The action context that
       * provides access to the Mojito API.
       */
       index: function(ac) {
         var user = { "name": "John Doe", "age": 34 }
         ac.done(user);
       }
     };
   }, '0.0.1', {requires: []});

.. _mvc-controllers-specify_view:

Specifying the View
-------------------

The default behavior when you pass data from the controller to the view is for 
the data to be passed to the view that has the same name as the controller 
function. For example, if ``ac.done({ "title": "Default View" })`` is invoked 
in the controller ``index`` function, the data is sent by default to the 
``index`` template. The ``index`` template could be ``index.hb.html``, 
``index.iphone.hb.html``, etc., depending on the calling device and 
rendering engine.

To specify the view that receives the data, the controller function passes two 
parameters to ``ac.done``: The first parameter is the data, and the second 
parameter specifies the view name. In the example controller below, the 
``user`` function passes the ``data`` object to the ``profile`` template 
instead of the default ``user`` template.

.. code-block:: javascript

   YUI.add('UserMojit', function(Y, NAME) {
     /**
     * The HelloMojit module.
     * @module HelloMojit
     */
     /**
     * Constructor for the Controller class.
     * @class Controller
     * @constructor
     */
     Y.namespace('mojito.controllers')[NAME] = {  

       /**
       * Method corresponding to the 'index' action.
       * @param ac {Object} The action context that
       * provides access to the Mojito API.
       */
       index: function(ac) {
         var data = { "title": "Going to default template." }
         ac.done(data);
       },
       user: function(ac) {
         var data = { "title": "Going to profile template." }
         ac.done(data, "profile");
       }
     };
   }, '0.0.1', {requires: []});

.. _mvc-controllers-report_error:

Reporting Errors
----------------

The ``ActionContext`` object has an ``error`` method for reporting errors. 
Like the ``done`` method, ``error`` should only be called once. Also, you 
cannot call both ``done`` and ``error``. The error requires an ``Error`` 
object as a parameter. The ``Error`` object is just the standard JavaScript 
``Error`` object that can have a ``code`` property specifying the HTTP response 
code that will be used if the error bubbles to the top of the 
page (i.e., not caught by a parent mojit).

In the code snippet below from ``controller.server.js``, the ``index``
method uses the query string parameter ``company`` to fetch company information
stored in a configuration file. The ``if-else`` clause either sends
the company information to the ``index`` template or reports 
an error that information for the specified company could not be found.

.. code-block:: javascript

   ...
     index: function(ac) {
       var company  = ac.params.url('company'),
           company_info = ac.config.get(company);
       if (company_info) {
         ac.done({ "company_info": company_info });
       } else {
         ac.error("Could not find info for " + company);
       }
     }
   ...
   }, '0.0.1', {requires: ['mojito-params-addon', 'mojito-config-addon']});

.. _mvc-controllers-save_state:


.. _mojito_mvc-views:

Views
=====

The views are HTML files that can include templates, such as Handlebars 
expressions, and are located in the ``views`` directory. We call these 
files *templates* to differentiate them from the rendered views that 
have substituted values for the template tags. Mojito uses 
`Handlebars <http://handlebarsjs.com/>`_ as the default rendering engine 
for templates. 

.. _mvc-views-naming:

Naming Convention
-----------------

Template files have the following naming convention:

``{controller_function}.[{selector}].{rendering_engine}.html``

The following list describes the elements of the template file name:

- ``{controller_function}`` - the controller function (action)
  that supplies data. Controller functions can also specify different
  templates.
- ``{selector}`` - an arbitrary  string used to select
  a specific template. For example, you could use the selector
  ``iphone`` for the iPhone template. 
- ``{rendering_engine}`` - the engine that renders the templates.


For example, if the template is receiving data from the ``index`` function 
of the controller and has Handlebars expressions that need to be rendered, 
the name of the template would be ``index.hb.html``.

Here are some other example template names with descriptions:

- ``greeting.hb.html`` - This template gets data from the ``greeting`` 
  function of the controller and the calling device is determined to 
  be a Web browser.
- ``get_photos.iphone.hb.html`` - This template gets data from the 
  ``get_photos`` function of the controller and the calling device is an iPhone.
- ``find_friend.android.hb.html`` - This template gets data from the 
  ``find_friend`` function of the controller and the calling device is Android 
  based.

.. note:: Currently, Mojito comes with Handlebars, so the name of templates 
          always contains ``hb``. Users can use other 
          `view engines <../topics/mojito_extensions.html#view-engines>`_, 
          but the ``{rendering_engine}`` component of the template name must 
          change. An error will occur if the file names of different views 
          are the same except the ``{rendering_engine}``. For example, having 
          the two templates ``index.hb.html`` and ``index.ejs.html`` (``ejs`` 
          could be `Embedded JavaScript (EJS) <http://embeddedjs.com/>`_) would 
          cause an error.

.. _mvc-views-supported_devices:

Supported Devices
-----------------

Mojito can examine the HTTP header ``User Agent`` and detect the following 
devices/browsers: 

+-----------------+---------------------------+
| Device/Browser  | Example Template          |
+=================+===========================+
| Opera Mini      | index.opera-mini.hb.html  |
+-----------------+---------------------------+
| iPhone          | index.iphone.hb.html      |
+-----------------+---------------------------+
| iPad            | index.ipad.hb.html        |
+-----------------+---------------------------+
| Android         | index.android.hb.html     |
+-----------------+---------------------------+
| Windows Mobile  | index.iemobile.hb.html    |
+-----------------+---------------------------+
| Palm            | index.palm.hb.html        |
+-----------------+---------------------------+
| Kindle          | index.kindle.hb.html      |
+-----------------+---------------------------+
| Blackberry      | index.blackberry.hb.html  |
+-----------------+---------------------------+

.. _mvc-views-using_hb:

Using Handlebars Expressions
----------------------------

Handlebars is a superset of `Mustache <http://mustache.github.com/mustache.5.html>`_, 
thus, Handlebars expressions include Mustache tags. Handlebars, however, also 
has some additional features such as registering help function and built-in block 
helpers, iterators, and access to object properties through the dot operator 
(i.e, ``{{house.price}}``).  We're just going to look at a few 
Handlebars expressions as an introduction. See the
`Handlebars documentation <http://handlebarsjs.com/>`_ for more information 
examples.

One of the things that we mentioned already is block helpers, which help you 
iterate through arrays. You could use the block helper ``#each`` shown below 
to iterate through an array of strings:

.. code-block:: html

   <ul>
     {{#each view_engines}}
     <li>{{this}}</li>
     {{/each}}
   </ul>

Another interesting block helper used in this example is ``#with``, which will 
invoke a block when given a specified context. For example, in the code 
snippet below, if the ``ul`` object is given, the property title is evaluated.

.. code-block:: html

   {{#with ul}}
     <h3>{{title}}</h3>
   {{/with}}

.. _using_hb-partials:

Partials
########

Handlebars partials are simply templates using Handlebars expressions that other
templates can include. Mojito allows you to have both global (shared by all mojits) or 
local (available only to one mojit) partials depending on the context. Global and local 
partials are used the same way in templates, but the location of the partials is 
different. Data that is available to templates is also available to partials. 

Now let's look at the file naming convention, location, and usage of partials
before finishing up with a simple example.

.. _hb_partials-file_naming:

File Naming Convention
**********************

The file name for partials is similar to templates using Handlebars except 
``{partial_name}`` replaces ``{controller_function}``:
``{partial_name}.[{selector}].hb.html``

.. _hb_partials-location:

Location of Partials
********************

.. _partials_location-global:

Global Partials
^^^^^^^^^^^^^^^
 
``{app_dir}/views/partials`` 

Thus, the global partial ``foo.hb.html`` in the application ``bar_app`` would be located at
``bar_app/views/partials/foo.hb.html``.

.. _partials_location-local:

Local Partials
^^^^^^^^^^^^^^

``{app_dir}/mojits/{mojit_name}/views/partials`` 

Thus, the local partial ``foo.hb.html`` in the mojit ``bar_mojit`` would be located at
``mojits/bar_mojit/views/partials/foo.hb.html``.

.. _hb_partials-use:

Using Partials in Templates
***************************

To use a partial, the template uses the following syntax: ``{{> partial_name}}``

To use the partial ``status.hb.html``, you would included the following
in a template: ``{{> status }}``

.. _hb_partials-example:

Example
*******

**/my_news_app/views/partials/global_news.hb.html**

.. code-block:: html

   <div>
      <h3>Global News</h3>
      {{global_news_stories}}
   </div>

**/my_news_app/mojits/newsMojit/views/partials/local_news.hb.html**

.. code-block:: html

   <div>
      <h3>Local News</h3>
      {{local_news_stories}}
   </div>

**/my_news_app/mojits/newsMojit/views/index.hb.html**

.. code-block:: html

   <div id="{{mojit_view_id}}">
     <h2>Today's News Stories</h2>
     {{> global_news}}
     {{> local_news}}
   </div>

.. _using_hb-helpers:

Helpers
#######

Handlebars comes with a set of simple monadic functions called 
`helpers <http://handlebarsjs.com/expressions.html#helpers>`_ that
you can call in Handlebars expressions. Some helpers are called 
`block helpers <http://handlebarsjs.com/block_helpers.html>`_ because
they are iterators. You can also create new helpers and register them
using the `Helpers addon <http://developer.yahoo.com/cocktails/mojito/api/classes/Helpers.common.html>`_. 
We'll take a look how in Mojito application to use both simple helper and block helpers
and then show you how to create and register your own helpers.

.. _hb-using_helpers:

Using Helpers
-------------

.. _using_helpers-basic:

Basic Helpers
#############

We are calling helpers that don't iterate *basic* helpers to distinguish them
from block helpers that do iterate. An example of a basic helper would be
``link``, which takes two arguments and outputs an HTML ``a`` tag.

To use the ``link`` helper in a Mojito application, your controller passes
data to the template that uses the ``link`` helper in a Handlebars expression.
In the example controller below, the method ``ac.done`` passes the object
``yahoo_link`` to the template:

.. code-block:: javascript

   ...
   index: function(ac) {
     var yahoo_link = { name: "Yahoo!", url: "http://www.yahoo.com" };
     ac.done(yahoo_link);
   }
   ...

In the ``index.hb.html`` template, the ``link`` method can create an HTML ``a``
tag with the ``name`` and ``url`` properties:

.. code-block:: javascript

    {{link yahoo_link.name yahoo_link.url}}

This creates the following link: ``<a href="http://www.yahoo.com">Yahoo!</a>``


Block Helpers
#############

As we've mentioned earlier, block helpers allow you to iterate through the properties
of an object or through items in an array. The syntax for using block helpers is 
different that using basic helpers. The pound sign "#" is prepended to the 
helper name and the helper must have a closing Handlebars expression.
Within the opening and closing Handlebars expressions for iterators, you can access
items of the list that you are iterating over.

Let's use of the block helper ``each`` to iterate over an array of objects 
and then use the properties of the objects with the ``link`` helper to create
a list of links.

In this example controller, we pass an array of objects with links and names of
Yahoo! pages to ``ac.done``:

.. code-block:: javascript
   ...
   index: function(ac) {
     var yahoo_links = [
       { name: "Yahoo!", url: "http://www.yahoo.com" },
       { name: "Yahoo! Finance", url: "http://finance.yahoo.com" },
       { name: "Yahoo! News", url: "http://news.yahoo.com" },
       { name: "Yahoo! Movies", url: "http://movies.yahoo.com" }
      ];
      ac.done(yahoo_links);
    }
    ...

In the template, we can now use the block helper ``each`` to
create links with the objects and their properties ``name`` and ``url``:

.. code-block: html

   <ul>
   {{#each yahoo_links}}
     <li><a href="{{url}}">{{name}}</a></li>
   {{/each}}
   </ul>

.. _hb-creating_helpers:

Creating Custom Helpers
-----------------------

As an aid to those used Handlebars helpers, we'll first look at 
how Handlebars helpers are used in Node.js applications and then
contrast that with how they are used in Mojito applications.

.. _creating_helpers-node:

Node.js Applications
####################

To create custom Handlebars helpers in a Node.js application, you use the 
Handlebars method ``registerHelper`` to register your helper so that
it can be used in Handlebars expressions.

In the example Node.js script below, the ``makeLink`` 

.. code-block:: javascript

   #!/usr/local/bin/node

   var Handlebars = require('handlebars');
   var context = { title: "My New Post", url: "http://mywebsite.com/new-post" };
   var source = "<div>{{makeLink title url}}</div>";
   // Registering a Handlebars helper that can be used
   // in the Handlebars expression in the HTML (`source`).
   Handlebars.registerHelper('makeLink', function(text, url) {
     text = Handlebars.Utils.escapeExpression(text);
     url  = Handlebars.Utils.escapeExpression(url);
     var result = '<a href="' + url + '">' + text + '</a>';
     return new Handlebars.SafeString(result);
   });
   var template = Handlebars.compile(source);
   var html = template(context);
   // Output: <div><a href="http://mywebsite.com/new-post">My New Post</a></div>
   console.log(html); 

.. _creating_helpers-mojito:

Mojito Applications
####################

To use custom Handlebars helpers in a Mojito application, you also need to register
your helper, but instead of using ``registerHelper``, you use the 
`Helpers addon <http://developer.yahoo.com/cocktails/mojito/api/classes/Helpers.common.html>`_.
The ``Helpers`` addon has several methods for getting helpers, setting mojit-level
helpers, or exposing helpers so that they can shared with other mojits.

Let's take a quick look at the ``Helper`` addon, show how to use the addon methods
to register helpers, and finally provide you with an example that includes both the
controller and corresponding template.

.. _mojito-helpers_addon:

Helpers Addon
*************

As with other addons, you need to require the ``Helpers`` addon by adding the string
``mojito-helpers-addon`` in the ``requires`` array of your controller. You also access the
addon and its methods through the ``ActionContext`` object.

The ``Helper`` addon has the following three methods:

- ``expose`` - Exposes a parent mojit's helper function so that on the server side any 
  child mojit instance under a particular request can use the helper. On the client, any 
  child mojit instance on the page can use the helper. 
- ``get`` - Allows you to get a specify helper (if given an argument) or all the helpers
  if not given any arguments.
- ``set`` - Sets a helper function for a mojit instance. Other mojit instances will not
  have access to this helper function.

.. _helpers_addon-set_mojit:

Setting Helpers for a Mojit Instance
************************************

To register a helper for a mojit instance, you use the ``set`` method of the ``Helpers``
addon. In the example controller below, the ``set`` method registers the helper
``highlightModuleHelper`` that uses the YUI ``Highlight`` class to highlight strings.
The reason for setting the helper for this mojit instance is that it depends on 
a specific data structure passed to it.

.. code-block:: javascript

   ...
     function highlightModuleHelper(mods, highlighted_module) {
       var mod_names = [];
       for (var i = 0, l=mods.length; i<l; i++){
         mod_names.push(mods[i].name);
       }
       mod_names = mod_names.join(', ');
       return Y.Highlight.words(mod_names, highlighted_module, {
        caseSensitive:false
       }); 
     }
     index: function(ac) {
       var data = {
             modules: [
               {name: "event", user_guide: "http://yuilibrary.com/yui/docs/event/", title: "Event Utility"},
               {name: "node", user_guide: "http://yuilibrary.com/yui/docs/node/",  title: "Node Utility"},
               {name: "base", user_guide: "http://yuilibrary.com/yui/docs/base/", title: "Base" },
               {name: "test", user_guide: "http://yuilibrary.com/yui/docs/test/", title: "YUI Test"}, 
               {name: "cookie", user_guide: "http://yuilibrary.com/yui/docs/cookie/",  title: "Cookie Utility"},
               {name: "yql", user_guide: "http://yuilibrary.com/yui/docs/yql/", title: "YQL Query"} 
             ]
           };
       ac.helpers.set('highlightModule', highlightModuleHelper);
       ac.done({ yui_info: data, highlighted_module: ac.params.url('module') || "event"});
     }
   ...

In the ``index.hb.html`` template, the helper ``highlightModule`` highlights
takes as the arguments passed to it by ``ac.done`` and highlights the strings matching
the values assigned to ``highlighted_module``:

.. code-block:: html

   <div id="{{mojit_view_id}}">
     <h3>Highlighted Products:</h3>
     {{{highlightModule yui_info.modules highlighted_module }}
   </div>


.. _helpers_addon-set_global:

Exposing Helpers for Global Use
*******************************

To register a helper so that parent mojits can share them with their children, you use the 
``expose`` method of the ``Helpers`` addon. In the example controller below, the 
``expose`` method registers the helper ``toLinkHelper`` that creates links. It makes sense 
to expose this helper so that its child mojit instances can also use the helper to create 
links.

.. code-block:: javascript

   ...
     function toLinkHelper(title, url) {
        return "<a href='" + url + "'>" + title + "</a>";
     }
     index: function(ac) {
       var data = {
             modules: [
               {name: "event", user_guide: "http://yuilibrary.com/yui/docs/event/", title: "Event Utility"},
               {name: "node", user_guide: "http://yuilibrary.com/yui/docs/node/",  title: "Node Utility"},
               {name: "base", user_guide: "http://yuilibrary.com/yui/docs/base/", title: "Base" },
               {name: "test", user_guide: "http://yuilibrary.com/yui/docs/test/", title: "YUI Test"}, 
               {name: "cookie", user_guide: "http://yuilibrary.com/yui/docs/cookie/",  title: "Cookie Utility"},
               {name: "yql", user_guide: "http://yuilibrary.com/yui/docs/yql/", title: "YQL Query"} 
             ]
           };
       ac.helpers.expose('toLink',toLinkHelper);
       ac.done({ yui_info: data });
     }
   ...

In the template ``index.hb.html`` below, the Handlebars block helper ``each``
iterates through the objects contained in the array ``yui_info.modules``, and
then the custom helper ``toLink`` creates links with the values of the properties
``title`` and ``user_guide``:

.. code-block:: html

   <div id="{{mojit_view_id}}">
     <h3>YUI Modules</h3>
     <ul>
     {{#each yui_info.modules}}
       <li>{{{toLink title user_guide }}}</li>
     {{/each}}
     </ul>
   </div>


.. _helpers_addon-ex:

Example
*******

.. _helpers_ex-controller:

controller.server.js
^^^^^^^^^^^^^^^^^^^^

.. code-block:: javascript

   YUI.add('helperMojit', function(Y, NAME) {

     function toLinkHelper(title, url) {
       return "<a href='" + url + "'>" + title + "</a>";
     }
     function highlightModuleHelper(mods, highlighted_module) {
       var mod_names = [];
       for (var i = 0, l=mods.length; i<l; i++){
         mod_names.push(mods[i].name);
       }
       mod_names = mod_names.join(', ');
       return Y.Highlight.words(mod_names, highlighted_module, {
         caseSensitive:false
       }); 
     }
     Y.namespace('mojito.controllers')[NAME] = {
       index: function(ac) {
         ac.helpers.set('toLink', toLinkHelper);
         ac.helpers.expose('highlightModule', highlightModuleHelper);
         var data = {
           modules: [
             {name: "event", user_guide: "http://yuilibrary.com/yui/docs/event/", title: "Event Utility"},
             {name: "node", user_guide: "http://yuilibrary.com/yui/docs/node/",  title: "Node Utility"},
             {name: "base", user_guide: "http://yuilibrary.com/yui/docs/base/", title: "Base" },
             {name: "test", user_guide: "http://yuilibrary.com/yui/docs/test/", title: "YUI Test"}, 
             {name: "cookie", user_guide: "http://yuilibrary.com/yui/docs/cookie/",  title: "Cookie Utility"},
             {name: "yql", user_guide: "http://yuilibrary.com/yui/docs/yql/", title: "YQL Query"} 
           ]
         };
         ac.done({ yui_info: data, highlighted_module: ac.params.url('module') || "event"});
       }
     };
   }, '0.0.1', {requires: ['mojito', 'mojito-helpers-addon', 'mojito-params-addon', 'highlight']});

.. _helpers_ex-template:

index.hb.html
^^^^^^^^^^^^^

.. code-block:: html

   <div id="{{mojit_view_id}}">
     <h3>YUI Modules</h3>
     <ul>
     {{#each yui_info.modules}}
       <li>{{{toLink title user_guide }}}</li>
     {{/each}}
     </ul>
     <h3>Highlighted Products:</h3>
     {{{highlightModule yui_info.modules highlighted_module }}
   </div>


.. _mvc-views-using_mustache:

Using Mustache Tags
-------------------

Mojito uses Handlebars to render Mustache tags, so if you are creating
templates using Mustache tags and specify ``mu`` in the file name, such as
the template ``index.mu.html``, the template will be rendered by Handlebars.

.. note:: If a controller has added logic to ensure the safe encoding of Mustache 
          tags, you may need to remove that logic from the controller and rename your 
          template to specify Handlebars (i.e., ``{controller_function}.hb.html``),
          or you can use triple brackets ``{{{}}}`` instead to avoid the default 
          encoding done by Handlebars.



.. _mvc-views-supplied_data:

Mojito-Supplied Data
--------------------

Mojito supplies the following data that can be accessed as template tags in the 
template:

- ``{{mojit_view_id}}`` - a unique ID for the view being rendered. We recommend 
  that this tag be used as the value for the ``id`` attribute of the a top-level 
  element (i.e., ``<div>``) of your template because it is used to bind the 
  binders to the DOM of the view.
- ``{{mojit_assets}}`` - the partial URL to the ``assets`` directory of your 
  mojit. You can use the value of this tag to point to specific assets. For 
  example, if your mojit has the image ``assets/spinner.gif``, then you can 
  point to this image in your template with the following: 
  ``<img src="{{mojit_assets}}/spinner.gif">``

.. note:: The prefix ``mojit_`` is reserved for use by Mojito, and thus, 
          user-defined variables cannot use this prefix in their names.


.. _mvc-views-exs:

Examples
--------

See `Code Examples: Views <../code_exs/#views>`_ for annotated code examples, 
steps to run code, and source code for Mojito applications.


