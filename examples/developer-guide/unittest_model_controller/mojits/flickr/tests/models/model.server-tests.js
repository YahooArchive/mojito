/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('flickrModel-tests', function(Y) {
    
    var suite = new YUITest.TestSuite('flickrModel-tests'),
        model = null,
        A = YUITest.Assert;
    suite.add(new YUITest.TestCase({
        
        name: 'flickr model user tests',
        
        setUp: function() {
            model = Y.mojito.models.flickr;
        },
        tearDown: function() {
            model = null;
        },
        
        'test mojit model': function() {
            A.isNotNull(model);
            A.isFunction(model.search);
        }
        
    }));
    YUITest.TestRunner.add(suite);
}, '0.0.1', {requires: ['mojito-test', 'flickrModel']});
