/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-management-utils-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        libpath = require('path'),
        libutils = require(libpath.join(__dirname, '../../../management/utils.js')),
        A = YUITest.Assert,
        AA = YUITest.ArrayAssert;


    function cmp(x, y, msg) {
        if (Y.Lang.isArray(x)) {
            A.isArray(x, msg || 'first arg should be an array');
            A.isArray(y, msg || 'second arg should be an array');
            A.areSame(x.length, y.length, msg || 'arrays are different lengths');
            for (var i = 0; i < x.length; i += 1) {
                cmp(x[i], y[i], msg);
            }
            return;
        }
        if (Y.Lang.isObject(x)) {
            A.isObject(x, msg || 'first arg should be an object');
            A.isObject(y, msg || 'second arg should be an object');
            A.areSame(Object.keys(x).length, Object.keys(y).length, msg || 'object keys are different lengths');
            for (var i in x) {
                if (x.hasOwnProperty(i)) {
                    cmp(x[i], y[i], msg);
                }
            }
            return;
        }
        A.areSame(x, y, msg || 'args should be the same');
    }


    suite.add(new YUITest.TestCase({

        name: 'Management Utils tests',


        'decode HTML entities': function() {
            A.isFunction(libutils.decodeHTMLEntities);
            A.areSame('', libutils.decodeHTMLEntities(''));
            A.areSame('orange & red', libutils.decodeHTMLEntities('orange &amp; red'));
            A.areSame('& red', libutils.decodeHTMLEntities('&amp; red'));
            A.areSame('orange &', libutils.decodeHTMLEntities('orange &amp;'));
            A.areSame('<orange & red>', libutils.decodeHTMLEntities('&lt;orange &amp; red&gt;'));
            A.areSame('orange &amp; red', libutils.decodeHTMLEntities('orange &amp;amp; red'));
            A.areSame('orange &copy; red', libutils.decodeHTMLEntities('orange &copy; red'));
            A.areSame('orange y red', libutils.decodeHTMLEntities('orange &#x79; red'));
        }


    }));


    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: []});
