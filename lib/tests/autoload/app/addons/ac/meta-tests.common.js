/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-meta-addon-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        OA = YUITest.ObjectAssert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'meta addon tests',
        
        'stored values are retrievable': function() {
            var addon = new Y.mojito.addons.ac.meta();
            var retrieved;

            addon.store('foo', 'bar');
            addon.retrieve(function(val) {
                retrieved = val;
            });
            // faking what Mojito does when done() is called
            var meta = addon.mergeMetaInto({});

            OA.areEqual({foo:'bar'}, retrieved, 'wrong retrieved meta value');
        }
        
    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojito-meta-addon']});
