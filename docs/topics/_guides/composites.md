# Composite Mojits

Your mojits can have children. This allows you to create mojits that are responsible for the execution and layout of child mojits. 

## Explicit Child Declaration

When you know all your mojit specifications up-front (at design time), this is probably the type of composite mojit you want to create. I'll guide you through the construction of a composite mojit now.

    $> mojito create app full comp-demo
    $> cd comp-demo
    $> mojito create mojit full MyLayout
    $> mojito create mojit full Nav
    $> mojito create mojit full News
    $> mojito create mojit full Footer

Now we have a new Mojito application with four mojits. Now we will update the `application.json` file to properly layout our mojits:

    [
        {
            "settings": [ "master" ],
            "specs": {
                "frame": {
                    "type": "HTMLFrameMojit",
                    "config": {
                        "child": {
                            "type": "MyLayout",
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
            }
        }
    ]

Now we have the outermost mojit as the `HTMLFrameMojit`, and the one child being our `MyLayout` mojit. It has defined three children: `nav`, `news`, and `footer`.

Before going to far, let's look into the `routes.json` file and set up a path to `/` that will execute the `index` action of our `frame` mojit:

    [
        {
            "settings": [ "master" ],

            "root": {
                "verb": ["get", "post", "put"],
                "path": "/",
                "call": "frame.index"
            },

            "_any_mojit_action": {
                "verb": ["get", "post", "put"],
                "path": "/:mojit-base/:mojit-action",
                "call": "@_any_.@_any_"
            }
        }
    ]
    

Now let's update each of the child mojits so their views display information about them, initially. This way we can tell that our layout will place things appropriately.

mojits/Nav/controller.js:

    YUI.add('Nav', function(Y, NAME) {

        function Controller() {
            Y.log('Controller()', 'debug', NAME);
        }

        Controller.prototype = {

            index: function(ac) {
                Y.log('index()', 'debug', NAME);
                ac.done({title: 'Navigation'});
            }

        };

        Y.mojito.registerController('Nav', Controller);

    }, '0.0.1', {requires: ['mojito']});

mojits/Nav/views/index.html:

    <div id="{{mojit_uuid}}" class="mojit">
    <h3>{{title}}</h3>
    </div>

Now when this mojit is executed, it will simply send a message about its function to the view template, which will be rendered into the parent. I'm going to do this to each of the rest of the child mojits, but I won't paste the code here. It's simple repeating this process for the `News` and `Footer` mojits.

Now that all our child mojits display some information about what they do, we should focus on the `MyLayout` mojit. We've already configured the Mojito application so this mojit has three predefined children, and now we need to look into the view for this mojit and decide were we want to put them. 

mojits/MyLayout/views/index.html

    <div id="{{mojit_uuid}}" class="mojit">
    	<h1>{{title}}</h2>

    	<div class="nav">
    		{{{nav}}}
    	</div>

    	<div class="content">
    		{{{news}}}
    	</div>

    	<div class="footer">
    		{{{footer}}}
    	</div>

    </div>

Now we have a place for each child mojit to be rendered within our composite mojit view. We might want to also include a CSS file to help with styling and layout of these mojits. So let's add a CSS file our composite mojit's `assets` directory:

mojits/MyLayout/assets/style.css

    .nav {
    	background-color: pink;
    }
    .nav li {
    	list-style: none;
    }
    .mojit {
        border: dotted black 1px;
    }

In order for Mojito to know how to load this, we must update our `application.json` file and add it as an asset of the `frame` mojit:

    [
        {
            "settings": [ "master" ],
            "specs": {
                "frame": {
                    "type": "HTMLFrameMojit",
                    "config": {
                        "child": {
                            "type": "MyLayout",
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
                        },
                        "assets": [
                            "/mojits/MyLayout/assets/style.css"
                        ]
                    }
                }
            }
        }
    ]

Next stop is the controller! All we have to do to tell Mojito that we want to execute all the child mojits in our composite is to run one function on the ActionContext:

/mojits/MyLayout/controller.js

    YUI.add('MyLayout', function(Y, NAME) {

        function Controller() {
            Y.log('Controller()', 'debug', NAME);
        }

        Controller.prototype = {

            index: function(ac) {
                Y.log('index()', 'debug', NAME);
    			ac.composite.run({ template: { title: 'Recent News' } });
            }

        };

        Y.mojito.registerController('MyLayout', Controller);

    }, '0.0.1', {requires: ['mojito']});

Running `ac.composite.run()` tells Mojito that you want to execute all your child mojits as you defined them in `application.json`, and you expect Mojito to inject their rendered views into your composite template (in this case: `views/index.html`) by the id of the child. So because you've give the `Nav` module an id of `nav`, and the template (`/mojits/MyLayout/views/index.html`) has a slot called `nav`, that is where Mojito will index the rendered `nav` view.

Test it out! Run the server and you should see the layout in your browser when you go to [http://localhost:8666](http://localhost:8666).

## Dynamic Child Creation

So, our example above doesn't do anything useful. It should be a news page, but it displays no news! Now we want to focus on the `News` mojit and have it list some news given some search terms.

First, let's create another mojit, which will be displayed within the `news` mojit:

    $> mojito create mojit full NewsItem

We're going to make the `news` mojit into a composite mojit that displays N number of `NewsItem` mojits inside of it.

Before we go into the mechanics of how to do this, let's focus on getting a `NewsItem` mojit displaying some news. We'll start with the controller, and assume we'll be able to get a search term as a parameter.

/mojits/NewsItem/controller.js

    YUI.add('NewsItem', function(Y, NAME) {

        function Controller() {
            Y.log('Controller()', 'debug', NAME);
        }

        Controller.prototype = {

            index: function(ac) {
                Y.log('index()', 'debug', NAME);

                var searchTerm = ac.params.getFromMerged('term') || 'us'; // default to US news

                ac.get('model').getNews(searchTerm, function(news) {

                    ac.done({news: news, search: searchTerm});

                });

            }

        };

        Y.mojito.registerController('NewsItem', Controller);

    }, '0.0.1', {requires: ['mojito']});

As you can see above, we are depending on a `getNews` function to be in our model, so let's fill that out as well with some simple YQL:

/mojits/NewsItem/models/model.js

    YUI.add('NewsItemModel', function(Y, NAME) {

        function Model() {
            Y.log('Model()', 'debug', NAME);
        }

        Model.prototype = {

            getNews: function(term, callback) {
                Y.log('getNews(' + term + ')', 'debug', NAME);
                var q = 'select title, abstract from search.news where query="' + term + '"';
                Y.YQL(q, function(rawYqlData) {
                    if (!rawYqlData.query.results) {
                        callback([]);
                    } else {
                        callback(rawYqlData.query.results.result);
                    }
                });
            }

        };

        Y.mojito.registerModel('NewsItem', Model);

    }, '0.0.1', {requires: ['mojito', 'yql']});

Last thing it so update the view for our news item so that it receives and displays `news` and the `search` data that the controller is passing:

    <div id="{{mojit_uuid}}" class="mojit newsitem">

        <h3>{{search}} News</h3>

        <ul>
            {{#news}}
            <li>
                <h6>{{title}}</h6>
                <p>{{abstract}}</p>
            </li>
            {{/news}}
        </ul>

    </div>
    
The YQL query returns an array of "news" items, each with a "title" and "abstract" field.

Now just to test this out, we can create a single mojit spec in `application.json` that lives outside of the `HTMLFrameMojit`, so we can see our mojit and ensure it works:

application.json

    [
        {
            "settings": [ "master" ],
            "specs": {
                "frame": {
                    "type": "HTMLFrameMojit",
                    "config": {
                        "child": {
                            "type": "MyLayout",
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
                        },
                        "assets": [
                            "/mojits/MyLayout/assets/style.css"
                        ]
                    }
                },
                "test-item": {
                    "type": "NewsItem"
                }
            }
        }
    ]

Now we can start the server and to go [http://localhost:8666/test-item/index](http://localhost:8666/test-item/index) to see our `NewsItem` mojit in action. If you want to see news about anything specific, you can enter it in the querystring as a `term`: [http://localhost:8666/test-item/index?term=insects](http://localhost:8666/test-item/index?term=insects)

OK! So we know our `NewsItem` mojit works. So how can we create a bunch of them as children of our `News` mojit? Let's start with our configuration, where we're going to add a default mojit spec for all children of `News`:

application.json:

    [
        {
            "settings": [ "master" ],
            "specs": {
                "frame": {
                    "type": "HTMLFrameMojit",
                    "config": {
                        "child": {
                            "type": "MyLayout",
                            "config": {
                                "children": {
                                    "nav": {
                                        "type": "Nav"
                                    },
                                    "news": {
                                        "type": "News",
                                        "config": {
                                            "children": {
                                                "type": "NewsItem"
                                            }
                                        }
                                    },
                                    "footer": {
                                        "type": "Footer"
                                    }
                                }
                            }
                        },
                        "assets": [
                            "/mojits/MyLayout/assets/style.css"
                        ]
                    }
                },
                "test-item": {
                    "type": "NewsItem"
                }
            }
        }
    ]

Above, you'll see that we've added `"children": { "type": "NewsItem" ]` to our `news` mojit specification. This is different that the _explicit_ example because we are telling Mojito that *all* mojits created as children of this composite mojit will start with this configuration. All child mojits of `news` will be `NewsItem` mojits. We can add more default configuration options as well, but for now let's leave it as that.

Moving on to the `News` controller, we need to set up how we'll be creating our children. Because our `NewsItem` mojits all expect to be passed a search term as a parameter, we need to set up some parameter objects before we can interact with Mojito and tell it to run the children. Let's look at the `News` controller now and I'll explain what is happening.

/mojit/News/controller.js

    YUI.add('News', function(Y) {

        function Controller() {}

        Controller.prototype = {

            index: function(ac) {
                // allow search terms to come from parameters, otherwise set up defaults
                var params = ac.params.getFromMerged('search') || 'mojito,grasshopper,manhattan';
                var terms = params.split(',');

                // This array is for each child mojit we want to execute. For each 
                // query parameter we received, we'll be creating a params object
                // and storing it here, then passing it into the framework to run.
                var childParams = [];

                // for each search term, we'll push it onto the childParams array as an
                // attribute of an object (this object will be the params object
                // that is passed to the child mojit)
                Y.Array.each(terms, function(t) {
                    childParams.push({term: t});
                });

                // send the array of parameters into mojito, and it knows what to do!
                ac.composite.run({ 
                    template: { title: 'News up in here'},
                    params: childParams 
                });

            }

        };

        Y.mojito.registerController('News', Controller);

    }, '0.0.1', {requires: ['mojito']});

As the comments in the code above explain, we are really just building an array of different parameters, one for each child mojit we want to execute. Mojito will dynamically create and execute a mojit instance for each parameters object it gets, using the default configuration you supplied as the `children` element of the `News` mojit as the default values for the child mojit specifications.

But we still need to update the `News` mojit view before these children will be properly injected into our `News` mojit.

/mojits/News/views/index.html

    <div id="{{mojit_uuid}}" class="mojit">
        <h3>{{title}}</h3>
        <ul>
            {{#children}}
                {{{child}}}
            {{/children}}
        </ul>
    </div>

As Mojito executes and renders the children for this mojit, it will build a template for the composite mojit view. It expects there to be an array of `children`, and each item it adds to the array will have a `child` property that contains the full markup of the rendered child.

Now we are ready! Run the server and point to [http://localhost:8666/](http://localhost:8666/) to see the action! 

Fancy defining your own search terms? Define as many as you like!

[http://localhost:8666/?search=libya,egypt,lebanon,jordan,iraq](http://localhost:8666/?search=libya,egypt,lebanon,jordan,iraq)

##### Update the default child mojit config

Let's quickly put a cap on our search results by providing a default "max" value within our `application.json` file:

    [
        {
            "settings": [ "master" ],
            "specs": {
                "frame": {
                    "type": "HTMLFrameMojit",
                    "config": {
                        "child": {
                            "type": "MyLayout",
                            "config": {
                                "children": {
                                    "nav": {
                                        "type": "Nav"
                                    },
                                    "news": {
                                        "type": "News",
                                        "config": {
                                            "children": {
                                                "type": "NewsItem",
                                                "config": {
                                                    "maxResults": "2"
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
                        "assets": [
                            "/mojits/MyLayout/assets/style.css"
                        ]
                    }
                },
                "test-item": {
                    "type": "NewsItem"
                }
            }
        }
    ]

Now we'll edit our NewsItem mojit files to use this new configuration option:

/mojits/NewsItem/controller.js

    YUI.add('NewsItem', function(Y, NAME) {

        function Controller() {
            Y.log('Controller()', 'debug', NAME);
        }

        Controller.prototype = {

            index: function(ac) {
                Y.log('index()', 'debug', NAME);

                var searchTerm = ac.params.getFromMerged('term') || 'us'; // default to US news
                // grab max results value from config or make it 5
                var max = ac.get('config').maxResults || 5;

                ac.get('model').getNews(searchTerm, max, function(news) {

                    ac.done({news: news, search: searchTerm});

                });

            }

        };

        Y.mojito.registerController('NewsItem', Controller);

    }, '0.0.1', {requires: ['mojito']});

/mojits/NewsItem/models/model.js

    YUI.add('NewsItemModel', function(Y, NAME) {

        function Model() {
            Y.log('Model()', 'debug', NAME);
        }

        Model.prototype = {

            getNews: function(term, max, callback) {
                Y.log('getNews(' + term + ')', 'debug', NAME);
                var q = 'select title, abstract from search.news where query="' + term + '" limit ' + max;
                Y.YQL(q, function(rawYqlData) {
                    if (!rawYqlData.query.results) {
                        callback([]);
                    } else {
                        callback(rawYqlData.query.results.result);
                    }
                });
            }

        };

        Y.mojito.registerModel('NewsItem', Model);

    }, '0.0.1', {requires: ['mojito', 'yql']});
    
Looks better now, doesn't it?

