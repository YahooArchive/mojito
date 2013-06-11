=======================
5. Getting Data (Draft)
=======================

Introduction
============

As with other MVC-based frameworks, you use models to get data although Mojito allows 
controllers to directly fetch content as well. Thus far, our applications have been 
just getting static data from the model, but in this module we’re going to learn how 
to get data in a couple of different ways. The recommended way is to use YQL, an 
SQL-like language and Web Service that allows you to make queries on Web data. You can 
also use the REST module that comes with Mojito to make HTTP calls to Web services.

We’re going to use both methods to get some data into our application. Our githubMojit 
will finally fetch live data, and we’re going to add another mojit to get Twitter data 
with the REST module.

Estimated Time
--------------

15 minutes

What We’ll Cover
----------------

- mojit models 
- YQL and how to use it get data
- accessing and calling model methods from the controller
- using the Http class to make REST calls
- using other forms of data such as cookies and parameters.

Final Product
-------------

In the screenshot, you can see we’ve added a mojit for Twitter data 
and that we finally have live data for our GitHub statistics.


Before Starting
---------------

Review of the Last Module
#########################

In the last module, we discussed composite mojits, showing how to 
configure the parent-child relationship between mojits and then use 
the Composite addon to execute child mojits. Using composite mojits, 
we were able to create a page layout and add content to the body of 
the HTML page. We also kept our frame mojit to create the HTML page 
for use. In summary, we covered the following:

- configuring composite mojits
- using the Composite addon
- ac.composite.done versus ac.composite execute
- parent mojit templates

Setting Up
##########

``$ cp -r 04_composite_mojits 05_getting_data``

Source Code for Example
#######################

[app_part{x}](http://github.com/yahoo/mojito/examples/quickstart_guide/app_part{x})

Lesson: Getting Data
====================

Introduction
------------

Mojito separates the data layer with models that can use the Mojito REST library or YQL. 
In most cases, we recommend YQL because you can have a consistent API to get data from 
different sources and can filter results with YQL statements. The response that is 
returned from YQL is also more consistent regardless of the data sources,  making it 
easier to parse. The YQL Web Service is also optimized to get data to you faster, and 
YUI has a handy YQL module that makes using YQL even easier. We’re going to provide an 
overview of YQL, show you how to form YQL statements, and finally how to use YUI’s 
YQL module.

Models
------

We briefly went over the structure of models in the Mojits module when we discussed mojit MVC. 
Let’s just summarize some of the important points about mojit models.

Location
--------

The location of models are in the models directory under the mojit directory. So, if your 
mojit is myMojit, the models would be found in myMojit/models. 

File Naming Convention
----------------------

The file name of a model has two parts. The model name and the affinity. The model name 
is an arbitrary string, and the affinity as we have said before indicates where the code 
is running. The affinity may be server, client, or common, where common indicates the 
code can run on either the server or client. Thus, the syntax of the model file name is 
the following: {model_name}.{affinity}.js

Models as YUI Modules
---------------------

Models like controllers are registered with YUI as modul
es with YUI.add, have their own namespace, and list dependencies 
in the requires array.  

Below is the skeleton of the model. Notice that we have required the ‘yql’ module. 
This is the main way for getting data. If you haven’t heard of or used YQL before, 
don’t worry, we’ll give you a little primer before writing code to get data with 
YQL in the next section.

.. code-block:: javascript

   YUI.add('githubModel', function(Y, NAME) {

     // The namespace for the model that passes the
     // name 
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


YQL Primer
----------

What is YQL?
############

If you know SQL, then think of YQL as SQL for the Internet, with the Internet 
representing a MySQL database. In reality, Internet data can only be fetched 
by the YQL Web Service if there is a table that defines how data is accessed. 
YQL comes with many wide range of tables, and the developer community has 
contributed YQL Open Data Tables (ODT) as well. The table tells YQL how to 
get the Web data, and the YQL statement (like an SQL query) tells YQL what 
data to get from that table and how to filter that data.

YQL Statements
##############

The YQL language like SQL has many verbs for reading and writing data. For 
our application, we’ll be just reading data with the SELECT verb. To filter data, 
like SQL, you use the key word WHERE. YQL also includes operators such as LIKE 
for filtering, the key word LIMIT to limit the number of results, and the 
pipe (|) to filter results through a function such as SORT. We can’t possibly 
cover all of the features of YQL here, but an example YQL statement can 
certainly show you many of the features that we’ve just discussed: 

``select Title, Rating.AverageRating from local.search(20) where query="pizza" and city="New York" and state="NY" | sort(field="Rating.AverageRating") | reverse()``

YQL Web Service
###############

To use YQL, you make an HTTP request to the YQL Web Service. You use one of 
the YQL Web Service URLs and append the YQL statement to the query parameter ``q``. 
The YQL Web Service has a couple URLs for getting public and authorized data:

- Public Data: http://query.yahooapis.com/v1/public/yql
- Public/Private (OAuth authorized): http://query.yahooapis.com/v1/yql

So, if you wanted to make the query select * from local.search where query=”pizza”, 
you would make an HTTP GET call to the following URL: 
``http://query.yahooapis.com/v1/public/yql?q=select * from local.search where query=”pizza”``

Fortunately, YUI’s YQL module forms the URL and makes the call for you, so you 
just need to form the YQL statement. With that, let’s look at the YQL module.

YQL Query Module
################

To use the YQL Query module in a mojit model, you simply add the string ‘yql’ 
to the requires array as shown below:

.. code-block:: javascript

   }, '0.0.1', {requires: ['yql']});

   getData: function(params, callback) {
            Y.log("getData called");
            var
                feedURL = "http://www.yuiblog.com/blog/feed/";
                query = "select title,link,pubDate, description from feed where url='{feed}' limit 5",
                queryParams = {
                    feed: feedURL
                },
                cookedQuery = Y.substitute(query,queryParams);

                Y.log("blog cookedQuery: " + cookedQuery);

                if(Y.blogData){
                    Y.log("blogData! skip YQL");
                    callback(Y.blogData);
                }else {
                    Y.namespace("blogData");
                    Y.log("blogmodel calling YQL");
                    Y.YQL(cookedQuery, Y.bind(this.onDataReturn, this, callback));
                }

        },


  getData: function(params, callback) {
            /**
            // need to update for rate limiting

            var //yqlTable = 'store://kIfKmDunyT35ymUmFHJw0M',

                yqlTable = 'https://raw.github.com/triptych/trib/master/src/yql/github.xml',
                query = "use '{table}' as yahoo.awooldri.github.repo; select watchers,forks from yahoo.awooldri.github.repo where id='yql' and repo='yql-tables'",
                queryParams = {
                    table: yqlTable
                },
                cookedQuery = Y.substitute(query, queryParams);
                Y.log("getData called");
                Y.log("cookedQuery:" + cookedQuery);
                Y.YQL(cookedQuery, Y.bind(this.onDataReturn, this, callback));

               **/

               callback({});
        },

 
Using the Mojito REST Module
----------------------------

The REST module for Mojito provides an easy make HTTP calls to URLs. To use the 
module, you add the string ‘mojito-rest-lib’ to the requires array as shown below.

.. code-block:: javascript

   YUI.add('TwitterSearchModel', function(Y, NAME) {
  

   }, '0.0.1', {requires: [ 'mojito-rest-lib']});

The REST module allows you to make HTTP GET, HEAD, PUT, POST, and DELETE calls. 
The methods of the module all take the following parameters:

- ``url`` - The URL to make the HTTP call to.
- ``params`` - The parameters to add to the request.
- ``config`` - Configurations for the call, such as headers or timeout values.
- ``callback`` - The function that receives the response or error.

For the application that we’re creating in this module, we are going to get 
data from the Twitter Search API. In the getData method below, we pass our 
parameters to make the call and return the JSON parsed results back with the callback. 

.. code-block:: javascript

   ... 
     ...
       getData: function(count, cb) {

         // The Twitter Search API URL
         var url = 'http://search.twitter.com/search.json';

         // q = search query
         // rpp = the number of tweets to return per page
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
     ...
   ...


Calling Model Methods From Controller
#####################################

The controller brokers all requests, calling the model, and passing data back 
to the client or rendering templates with the data. The controller uses 
model much like it uses addons. 

The controller needs to require the Models addon and use the method get from 
that addon to access a model.  For example, for the controller shown below to 
get the model registered with the name TwitterSearchModel, the Models addon 
is required and then used to access and use the the model.

.. code-block:: javascript

   ...
     ...
       index: function(ac) {
         // The Models addon method ‘get’ is used to access the
         // model registered as ‘TwitterSearchMojito’.
         ac.models.get('TwitterSearchModel').getData({},function(err, data) {
       
         });
       }
     ...
     // The Models addon is included with ‘mojito-models-addon’.
   }, '0.0.1', {requires: ['mojito', 'mojito-models-addon']});


Creating the Application
========================

#. After you have copied the application that you made in the last module (see Setting Up), 
   change into the application ``05_getting_data``.

#. Let’s create the Twitter mojits that get Twitter data for us.

   ``$ mojito create mojit twitterMojit``
#. Change to the models directory of  twitterMojit. We’re going to deal with 
   getting Twitter data first.
#. Rename the file ``foo.server.js`` to ``twitter.server.js`` and then change the 
   registered module name to ``TwitterSearchModel``.
#. Open ``twitter.server.js`` in an editor, and modify the method ``getData``, so 
   that it looks like the snippet below. As you can see, we pass the URL to the 
   Twitter Search API, the search query, and we configure the call to have a 
   timeout and force the cache to be cleared. 

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

      }, '0.0.1', {requires: ['mojito', 'mojito-rest-lib','json']});

#. We need to modify the controller to use the TwitterSearchModel. 
   Open controller.server.js in an editor, add the Models addon, and 
   modify the index method so that it’s the same as that shown below. 
   The models addon allows you to access our model and call the model 
   function ``getData``.

   .. code-block:: javascript

      ...
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

#. Let’s turn our attention to the githubMojit. We have been waiting long 
   enough to get GitHub data, but before we change any code, let’s rename 
   the model file to ``yql.server.js``. Now we can edit the file ``yql.server.js``. 
   Open the file in an editor, change the module name to StatsModelYQL, and update 
   the getData function with the code below. Notice that we are using the YQL 
   Open Data Table github.xml, which the YQL module let’s you specify as a query 
   parameter. 

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

#. Besides the YQL module, we also used the Substitute module, so make 
   sure to add both of those modules to the requires array:

   .. code-block:: javascript

      }, '0.0.1', {requires: ['yql', 'substitute']});

#. The githubMojit controller needs to get the correct model. We’re also 
   going to simplify the index function to only use the default template. 
   Modify the index function so that it’s the same as that below.

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

#. We’re going to update our template to look more like the Twitter 
   template. So, go ahead and replace the content of index.hb.html 
   with the following:

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

#. Okay, we have githubMojit getting real data and even have a mojit 
   for getting Twitter data. Did we forget anything? Yeah, we need to 
   plug our twitterMojit into the body by making it a child of the 
   body instance. Let’s update the body instance in the ``application.json``:

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

#. You can go ahead and start the application. You’ll see both real-time 
   data for GitHub and Twitter. We’ll be adding more mojits with more 
   data in the coming modules, so you may want to review the sections on YQL.


Troubleshooting
===============

Problem One
-----------

Nulla pharetra aliquam neque sed tincidunt. Donec nisi eros, sagittis vitae 
lobortis nec, interdum sed ipsum. Quisque congue tempor odio, a volutpat 
eros hendrerit nec. Vestibulum ante ipsum primis in faucibus orci luctus 
et ultrices posuere cubilia Curae;

Problem Two
-----------

Nulla pharetra aliquam neque sed tincidunt. Donec nisi eros, sagittis 
vitae lobortis nec, interdum sed ipsum. Quisque congue tempor odio, a 
volutpat eros hendrerit nec. Vestibulum ante ipsum primis in faucibus 
orci luctus et ultrices posuere cubilia Curae;

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

- YQL
- YQL tables

Source Code
===========

[app_part{x}](http://github.com/yahoo/mojito/examples/quickstart_guide/app_part{x})

Further Reading
===============

- [Mojito Doc](http://developer.yahoo.com/cocktails/mojito/docs/)
- YQL Guide
- Calling YQL from a Mojit

