=============
MVC in Mojito
=============

The MVC architecture in Mojito incorporates a clear separation of the 
controller, model, and view. The controller retrieves data from the model 
and passes it to the view. Client requests for data are sent to the controller, 
which in turn fetches data from the model and passes the data to the client. 
The controller is pivotal in the sense that it controls all interactions in 
the MVC of Mojito.

The controller, model, and view are found in the mojit of Mojito. The mojit 
is a single unit of execution of a Mojito application. An application may 
have one or more mojits, which are physically represented by directory 
structure. The mojit has one controller, any number or no models, and one 
or more views. When Mojito receives an HTTP request, an application invokes 
a mojit controller that can then execute, pass data to the view, or get data 
from the model. Now that we have described the general characteristics and 
implementation of the MVC in Mojito, let's look at each of the components in 
more detail.

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

The name of the model files depend on the affinity, which is the location 
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
     // Models must register themselves in the
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
       get_photos: function(flickr_query){
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

.. _mvc_models-structure:


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
  onto your controller that do not accept an ActionContext object.
- ``requires`` - (optional) an array that lists any addons that are needed 
  by the controller.

The example controller below shows you how the components are used. The 
``status`` mojit is registered with ``YUI.add`` and the ``init`` function 
stores the date so it can be used by other functions, and the ``this`` 
reference allows the ``index`` function to call ``create_status``. Lastly, 
the ``requires`` array loads the addons ``Intl``, ``Params``, and ``Url``
that are needed by the controller. 

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
   }, '0.0.1', {requires: ['mojito-intl-addon', 'mojito-params-addon', mojito-url-addon']});

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
``get_data`` from the model of the ``simple`` mojit.

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
           )'
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

The controller also uses the ActionContext object to send data to the view. 
Calling the ``done`` method from the ActionContext object, you can send literal 
strings or objects, with the latter being interpolated in template tags that are 
rendered by the appropriate view engine. The ``done`` method should only be 
called once. If neither ``done`` nor ``error`` is called, your application will 
hang waiting for output.

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
object as a parameter. The ``Error`` object is just the standard JavasScript 
``Error`` object that can have a ``code`` property specifying the HTTP response 
code that will be used if the error bubbles to the top of the 
page (i.e., not caught by a parent mojit).

In the code snippet below from ``controller.server.js``, the model is asked 
to get a blog post. The ``try-catch`` clause will catch any errors made calling 
``getPost``, and the ``error`` method will display the error message.

.. code-block:: javascript

   ...
     index: function(ac) {
       try {
         var post = ac.models.get('BlogModel').getPost();
         ac.done({ "post": post });
       }catch(e) {
         console.log(e);
         ac.error(e);
       }
     }
   ...

.. _mvc-controllers-save_state:


.. _mojito_mvc-views:

Views
=====

The views are HTML files that can include templates, such as Handlebars 
expressions, and are located in the ``views`` directory. We call these 
files *templates* to differentiate them from the rendered views that 
have substituted values for the template tags.

.. _mvc-views-naming:

Naming Convention
-----------------

The naming convention of the templates is based on the controller function 
that supplies data, the engine that renders the templates, and the device 
requesting the page. If the calling device is determined not to be a portable 
device such as a cell phone, the ``{device}`` element of the syntax below 
is omitted.

**File Naming Convention for Templates:**

``{controller_function}.[{device}].{rendering_engine}.html``

For example, if the template is receiving data from the ``index`` function 
of the controller and has Handlebars expressions that need to be rendered, 
the name of the template would be ``index.hb.html``.

Here are some other example template names with descriptions:

- ``greeting.hb.html`` - This template gets data from the ``greeting`` 
  function of the controller and the calling device is determined to 
  be a Web browser.
- ``get_photos.iphone.hb.html`` - This template gets data from the 
  ``get_photos`` function 
  of the controller and the calling device is an iPhone.
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

Another interesting block helper used in this example is #with, which will 
invoke a block when given a specified context. For example, in the code 
snippet below, if the ``ul`` object is given, the property title is evaluated.

.. code-block:: html

   {{#with ul}}
     <h3>{{title}}</h3>
   {{/with}}


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


