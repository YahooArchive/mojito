/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('scroll-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        controller = null,
		A = YUITest.Assert;
	
	suite.add(new YUITest.TestCase({
		
		name: 'scroll user tests',
		
		setUp: function() {
		    controller = new Y.mojit.test.scroll.controller();
		},
		tearDown: function() {
		    controller = null;
		},
		
        'test mojit': function() {
            var ac, actual, expect = {title: 'Scroll View'};
            A.isNotNull(controller);
            A.isFunction(controller.index);
            ac = {
                done: function(data) {
                    actual = data;
                }
            };
            controller.index(ac);
            A.isObject(actual);
            A.areSame(expect.title, actual.title);
        }
		
	}));
	
	YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojit-test', 'scroll']});
