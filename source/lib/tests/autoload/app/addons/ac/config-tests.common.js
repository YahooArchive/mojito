/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-config-addon-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        rm,
        OA = YUITest.ObjectAssert;
    
    suite.add(new YUITest.TestCase({
    
        name: 'config tests',

        setUp: function() {

        },

        tearDown: function() {

        },
        
        'TODO Test get function': function() {

            A.skip();
        },

        'TODO Test getDefinition function': function() {

            A.skip();
        }
        
    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: [
    'mojito-config-addon'
]});
