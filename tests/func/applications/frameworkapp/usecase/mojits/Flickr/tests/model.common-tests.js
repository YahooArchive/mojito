YUI.add('FlickrModel-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        model = null,
		A = YUITest.Assert;
	
	suite.add(new YUITest.TestCase({
		
		name: 'Flickr model user tests',
		
		setUp: function() {
		    model = new Y.mojit.test.Flickr.model();
		},
		tearDown: function() {
		    model = null;
		},
		
		'test flickr results format': function() {
		    var callbackCalled = false;
		    model.getFlickrImages('mojito', function(photos) {
		        var image;
		        Y.log(photos);
		        A.isNotUndefined(photos, 'no photos object in result');
		        A.isArray(photos);
		        A.isTrue(photos.length > 0, 'empty list of photos');
		        // test out one image
		        image = photos[0];
		        A.isObject(image);
		        A.isString(image.url, 'bad image url');
		        A.isString(image.title, 'bad image title');
		        callbackCalled = true;
		    });

		    this.wait(function() {
		        A.isTrue(callbackCalled, 'the model callback was never executed');
		    }, 1000);
		}
		
	}));
	
	YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['FlickrModel']});