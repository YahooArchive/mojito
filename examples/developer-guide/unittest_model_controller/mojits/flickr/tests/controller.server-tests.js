/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('flickr-tests', function(Y) {

    var suite = new YUITest.TestSuite('flickr-tests'),
        controller = null,
        A = YUITest.Assert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'flickr user tests',
        
        setUp: function() {
            controller = Y.mojito.controllers.flickr;
        },
        tearDown: function() {
            controller = null;
        },
        
        'test mojit': function() {
            var ac, results, count;
            var photos = [];
            A.isNotNull(controller);
            A.isFunction(controller.index);
            ac = {
               params: {
               getFromUrl: function(x) {
                   if(x == 'q')
                   return 'san francisco';
                   else if(x == 'size') 
                   return 20;
                  } 
               },
               models: {
                	flickr: Y.mojito.models.flickr 
                },
               done: function(data) {
                    photos = data.photos;
                    count = data.count;
                    Y.log(['******** PHOTO INFO:', photos]);
                    Y.log(['******** Photos length:', photos.length]);
                }
            };
            controller.index(ac);
            A.isNotNull( photos); 
        }
        
    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojito-test', 'flickr','flickrModel']});
