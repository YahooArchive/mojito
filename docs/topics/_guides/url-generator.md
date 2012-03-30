# Url Generation

In Mojito, Url Generation is the mapping of a specific mojit ID and mojit Action to specific URL. Currently what is done in mojito is this mapping is done at the middleware layer in the server in the routing part.

## Current Mojit Routing

Currently we create a 'routes.json' file, which will contain definitions of different routes mapped to mojit instances and actions. 
Example of a 'routes.json' file:

    [
        {
            "settings": [ "master" ],
            "root": {
                "verb": ["get"],
                "path": "/",
                "call": "@flickr.index"
            }
        }
    ]

So here the mojit-base: "@flickr" and action: "index" is mapped to the URL: "/"
And this mapping is stored in the routing table created in the routing middleware.

## URL Generator Add On

In the [router](/guides.routing/) middleware we wrap the make function (for generating url from mojit id and action) in the request context so that we can directly use it in our add-on.
 
So now in the controller.js we need to give the mojit id, mojit action and the query params to generate the url.

eg: ac.url.make(id, action,params,verb) generates a url.


Consider the Flickr mojit in the getting started guide part 3, we edit its controller.js,


    YUI.add('Flickr', function(Y) {
    
     function Controller() {}
    
     Controller.prototype = {
        
        index: function(ac) {
            ac.get('model').getFlickrImages('mojito', function(images) {
                

                 var dateString = ac.i18n.formatDate(new Date());
                    var data = {
                        images: images,
                        date: dateString,
                        greeting: ac.i18n.lang("TITLE"),
                        url: ac.url.make('@flickr','index','')
                    }
                    ac.done(data);
                    
                });
          }
        
       };
    
      Y.mojito.registerController('Flickr', Controller);
     
    }, '0.0.1', {requires: ['mojito', 'i18n-plugin'], lang: ['de', 'en-US']});

Here "url" is the namespace of the router-plugin and "make" is the function in the router-plugin which converts the mojit-base and action pair into a url.

Now using the query (mojit id,action and params) and routing table that we obtained from the context we find the corresponding url for the id-action pair.

Open up the `index.html` file, which is a [Mustache](http://mustache.github.com/) template, and let's fill it in so it generates markup.
This displays the URL that was generated

     <h2>{{ greeting }} - {{ date }} </h2>
     <h3>Requested URL: {{ url}} </h3>
     <ul>
        {{#images}}
        <li><a href="{{url}}">{{title}}</a></li>
          {{/images}}
     </ul>
	
Now start the server and hit the URL

	    $ node server.js

 [http://localhost:8666](http://localhost:8666)


We can also create your own mojit and provide an action to it. After adding the mojit ID and action to the routes.json file, we can get the URL for that id and action pair by using the ac.url.make(id,action,params,verb) instruction in the controller.js file.
