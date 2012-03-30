# Models

Currently, a mojit may have one model object that is automatically accessible from within a controller action's Action Context. When you create a mojit using the `mojito create mojit` command, a model folder will be created for you. Within this folder is a `model.js` file.

<div style="margin:1em; padding:0.4em; border:1px solid #F86; color:#844; background-color:#EEF;">
    <h4>NOTE:</h4>
    Future versions of Mojito will allow multiple models within a mojit as well as models that can be shared between mojits. These features have not yet been implemented.
</div>

## What is a model?

A model is a YUI module that contains all the code your mojit might need to access and persist data. This is the only area of the mojit where you are allowed to write blocking code. When you call your model functions from a mojit controller, a callback function must always be provided to allow for the model code to run long-term processes for data storage and retrieval. This allows Mojito to continue servicing other requests instead of blocking the thread.

## Creating a model

All you need is a `models/model.js` file in your mojit directory. All the current scaffoldings for mojit creation will make this for you. Let's step through this...

    $ mojito create app simple simpleModel
    $ cd simpleModel
    $ mojito create mojit simple TurkeyViewer
    $ cd mojits/TurkeyViewer

Here is the default model in `models/model.js`:

    YUI.add('TurkeyViewerModel', function(Y) {

        function Model() {

        }

        Model.prototype = {

            getData: function(callback) {
                callback({some:'data'});
            }

        };

        Y.mojito.registerModel('TurkeyViewer', Model);

    }, '0.0.1', {requires: ['mojito']});

Note that there is also a default model test at `tests/model-test.js`:

    YUI.add('TurkeyViewerModel-tests', function(Y, NAME) {

        var suite = new YUITest.TestSuite(NAME),
            model = null,
    		A = YUITest.Assert;

    	suite.add(new YUITest.TestCase({

    		name: 'TurkeyViewer model user tests',

    		setUp: function() {
    		    model = new Y.mojit.test.TurkeyViewer.model();
    		},
    		tearDown: function() {
    		    model = null;
    		},

            'test mojit model': function() {
                A.isNotNull(model);
                A.isFunction(model.getData);
            }

    	}));

    	YUITest.TestRunner.add(suite);

    }, '0.0.1', {requires: ['TurkeyViewerModel']});

The test doesn't do much, but you'll have a place to define your model requirements here. For an example of how to test your model, see the [Getting Started Guide Part II](/tutorials.GettingStarted-Part2/).

Let's start by finding a few images of turkeys on the interwebs.
*   [http://c1.planetsave.com/files/2009/11/turkey.jpg](http://c1.planetsave.com/files/2009/11/turkey.jpg)
*   [http://www.robert-harrington.com/byspecies/witu/witu_9502.jpg](http://www.robert-harrington.com/byspecies/witu/witu_9502.jpg)
*   [http://www.mangoverde.com/birdsound/images/00000015397.jpg](http://www.mangoverde.com/birdsound/images/00000015397.jpg)

Those are some beautiful [turkeys](http://www.fi.edu/franklin/birthday/faq.html#21).

Now that we have some image data we might like to display in a web page, we can update our model with a `getTurkeyImages` function that passes these values into a callback function:

    YUI.add('TurkeyViewerModel', function(Y) {

        function Model() {

        }

        Model.prototype = {

            getTurkeyImages: function(cb) {

                var turkeys = [
                    'http://c1.planetsave.com/files/2009/11/turkey.jpg',
                    'http://www.robert-harrington.com/byspecies/witu/witu_9502.jpg',
                    'http://www.mangoverde.com/birdsound/images/00000015397.jpg'
                ];

                cb(turkeys);
            }

        };

        Y.mojito.registerModel('TurkeyViewer', Model);

    }, '0.0.1', {requires: ['mojito']});

Now we can call this function from our controller, getting access to the model instance from the Action Context:

    YUI.add('TurkeyViewer', function(Y) {

        function Controller() {}

        Controller.prototype = {

            index: function(actionContext) {
                var model = actionContext.get('model');
                model.getTurkeyImages(function(turkeys) {
                    actionContext.done('Turkey images: ' + turkeys.join(', '));
                });
            }

        };

        Y.mojito.registerController('TurkeyViewer', Controller);

    }, '0.0.1', {requires: ['mojito']});

Notice that I've moved the `actionContext.done()` call into the model's callback function, assuring that it will not be called until the model has returned data. In this case, the model returns data right away, because there is no actual IO going on behind the scenes, but as we'll see later, this is very important when the model starts longer processes to retrieve data.

So once the model returns the turkey images to the callback, I'm simply joining them into a string so they can be given back to the Action Context for processing by Mojito. Let's edit the application's `server.js` file so we can see this in action:

    #!/usr/bin/env node

    // server for app: simpleModel

    var YUI = require('mojito').YUI;

    YUI().use('mojito-server', function(Y) {

        Y.mojito.server.get('/', {type: 'TurkeyViewer'});

        Y.mojito.server.start();

    });

All I've done above is set up a simple route for '/' that executes a TurkeyViewer mojit. Now we can go to [http://localhost:8666](http://localhost:8666) and see the output for ourselves:

    Turkey images: http://c1.planetsave.com/files/2009/11/turkey.jpg, http://www.robert-harrington.com/byspecies/witu/witu_9502.jpg, http://www.mangoverde.com/birdsound/images/00000015397.jpg

Now let's do some read IO by using YQL and a Flickr search. We can easily query YQL by requiring the 'yql' YUI module within our `model.js` requires array at the bottom of the file. Then we can execute a YQL query instead of just using a local array of image paths.

    YUI.add('TurkeyViewerModel', function(Y) {

        function Model() {

        }

        Model.prototype = {

            getTurkeyImages: function(cb) {
                var q = 'select * from flickr.photos.search where text="turkey"';
                Y.YQL(q, function(rawYqlData) {
                    cb(rawYqlData);
                });
            }

        };

        Y.mojito.registerModel('TurkeyViewer', Model);

    }, '0.0.1', {requires: ['mojito', 'yql']});

At this point, we're just returning the raw Flickr data into the controller, and I'm having it stringify the results back into the response output from the controller:

    YUI.add('TurkeyViewer', function(Y) {

        function Controller() {}

        Controller.prototype = {

            index: function(actionContext) {
                var model = actionContext.get('model');
                model.getTurkeyImages(function(turkeys) {
                    actionContext.done(JSON.stringify(turkeys));
                });
            }

        };

        Y.mojito.registerController('TurkeyViewer', Controller);

    }, '0.0.1', {requires: ['mojito']});

So now when you bounce Mojito and hit [http://localhost:8666](http://localhost:8666), you'll see something like this:

    {"query":{"count":10,"created":"2011-02-09T16:43:43Z","lang":"en-US","results":{"photo":[{"farm":"6","id":"5430773831","isfamily":"0","isfriend":"0","ispublic":"1","owner":"8819719@N02","secret":"9208b1e798","server":"5014","title":"More Lights_7611"},{"farm":"6","id":"5430774075","isfamily":"0","isfriend":"0","ispublic":"1","owner":"8819719@N02","secret":"8044513333","server":"5054","title":"Light_7612"},{"farm":"6","id":"5431382574","isfamily":"0","isfriend":"0","ispublic":"1","owner":"8819719@N02","secret":"b0656199e3","server":"5300","title":"Doorways of the Hagia Sophia_7621"},{"farm":"6","id":"5431397016","isfamily":"0","isfriend":"0","ispublic":"1","owner":"68387408@N00","secret":"7bb3afa1fa","server":"5256","title":"if wishes were horses"},{"farm":"6","id":"5431382936","isfamily":"0","isfriend":"0","ispublic":"1","owner":"8819719@N02","secret":"1be71d12a6","server":"5214","title":"Hagia Sophia Mosaic_7627"},{"farm":"6","id":"5430773241","isfamily":"0","isfriend":"0","ispublic":"1","owner":"8819719@N02","secret":"3cd4c60084","server":"5054","title":"Hagia Sophia Interior_7599"},{"farm":"6","id":"5430774525","isfamily":"0","isfriend":"0","ispublic":"1","owner":"8819719@N02","secret":"4f3867eb0b","server":"5096","title":"Crowd under Lights_7620"},{"farm":"6","id":"5430772703","isfamily":"0","isfriend":"0","ispublic":"1","owner":"8819719@N02","secret":"352f732838","server":"5139","title":"The Virgin and Child_7583"},{"farm":"6","id":"5431397006","isfamily":"0","isfriend":"0","ispublic":"1","owner":"68387408@N00","secret":"1c11fd6b69","server":"5056","title":"house for sale"},{"farm":"6","id":"5431383648","isfamily":"0","isfriend":"0","ispublic":"1","owner":"8819719@N02","secret":"b73bb4a67b","server":"5054","title":"Roman Distance Marker_7643"}]}}}

That is a decent example of how to use a model, but before we end this short tutorial, here is the model, controller, and view template to make this example actually display these images in the browser:

model.js:

    YUI.add('TurkeyViewerModel', function(Y) {

        function Model() {

        }

        Model.prototype = {

            getTurkeyImages: function(callback) {
                var q = 'select * from flickr.photos.search where text="wild turkey"';
                Y.YQL(q, function(rawYqlData) {
                    Y.log(rawYqlData);
                    var rawPhotos = rawYqlData.query.results.photo,
                        rawPhoto = null
                        photos = [],
                        photo = null,
                        i = 0;

                    for (; i<rawPhotos.length; i++) {
                        rawPhoto = rawPhotos[i];
                        photo = {
                            title: rawPhoto.title,
                            url: buildFlickrUrlFromRecord(rawPhoto)
                        };
                        // some flickr photos don't have titles, so force them
                        if (!photo.title) {
                            photo.title = "[" + queryString + "]";
                        }
                        photos.push(photo);
                    }
                    Y.log('calling callback with photos');
                    Y.log(photos);
                    callback(photos);

                });
            }

        };

        function buildFlickrUrlFromRecord(record) {
            return 'http://farm' + record.farm 
                + '.static.flickr.com/' + record.server 
                + '/' + record.id + '_' + record.secret + '.jpg';
        }

        Y.mojito.registerModel('TurkeyViewer', Model);

    }, '0.0.1', {requires: ['mojito', 'yql']});

controller.js:

    YUI.add('TurkeyViewer', function(Y) {

        function Controller() {}

        Controller.prototype = {

            index: function(actionContext) {
                var model = actionContext.get('model');
                model.getTurkeyImages(function(turkeys) {
                    actionContext.done({turkeys: turkeys});
                });
            }

        };

        Y.mojito.registerController('TurkeyViewer', Controller);

    }, '0.0.1', {requires: ['mojito']});

index.html:

    <h1>Turkey Viewer 1.0</h1>

    <ul>
        {{#turkeys}}
            <li><a href="{{url}}"><img src="{{url}}" alt="{{title}}" height="200px"></a></li>
        {{/turkeys}}
    </ul>
