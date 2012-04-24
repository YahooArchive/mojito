/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-middleware-contextualizer-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        path = require('path'),
        contextualizer = require(path.join(__dirname, '../../../app/middleware/mojito-contextualizer')),
        handler = null,
        res = null,
        nextCalled = false,
        nextFn = function() { 
            nextCalled = true; 
        },
        A = YUITest.Assert;
    
    suite.add(new YUITest.TestCase({

        name: 'basics',

        setUp: function() {
            handler = contextualizer({
                context: {},
                logger: function() {}
            });
        },
        tearDown: function() {
            handler = null;
        },

        'request enriched': function() {
            var req = {
                url: '/amoduleid/anything',
                headers: {}
            };
            
            handler(req, res, nextFn);
            
            A.isNotNull(req.context, 'No context was found in request');
            A.areSame('server', req.context.runtime, 'runtime has wrong value');
            A.isTrue(nextCalled, 'next() was not called');
        },
        
        'request find user agent': function() {
            var req = {
                url: '/amoduleid/anything',
                headers: {
                    'user-agent': 'iphone'
                }
            };
            
            handler(req, res, nextFn);
            
            A.areSame('iphone', req.context.device);
        },

        'bug4368914 bad case in Accept-Language header': function() {
            var req = {
                url: '/amoduleid/anything',
                headers: {
                    'accept-language': 'en-us,en;q=0.7;de;q=0.3'
                }
            };
            
            handler(req, res, nextFn);
            
            A.areEqual('en-US', req.context.lang);
        }

    }));
    
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1');
