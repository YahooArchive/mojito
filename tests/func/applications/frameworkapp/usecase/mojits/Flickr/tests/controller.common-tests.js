YUI.add('Flickr-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        controller = null,
		A = YUITest.Assert;
	
	suite.add(new YUITest.TestCase({
		
		name: 'Flickr user tests',
		
		setUp: function() {
		    controller = new Y.mojit.test.Flickr.controller();
		},
		tearDown: function() {
		    controller = null;
		},
		
        'test mojit': function() {
            A.isNotNull(controller);
            A.isFunction(controller.index);
        },
        
        'test model data is passed into action context done': function() {
            var doneCalled = false,
                expectedData = {my: 'data'},
                ac = Y.mojit.test.MockActionContext({
                model: {
                    getFlickrImages: ['mojito', expectedData]
                }
            });
            ac.done = function(data) {
                A.areSame(expectedData, data.images);
                doneCalled = true;
            };
            controller.index(ac);
            A.isTrue(doneCalled, 'ac.done never called');
        }
		
	}));
	
	YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojit-test', 'Flickr']});