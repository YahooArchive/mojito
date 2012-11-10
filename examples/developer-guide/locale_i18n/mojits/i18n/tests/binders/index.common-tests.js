/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('i18nBinderIndex-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        binder,
        A = YUITest.Assert;

    suite.add(new YUITest.TestCase({

        name: 'i18n index binder tests',

        setUp: function() {
            binder = Y.mojito.binders.i18nBinderIndex;
        },
        tearDown: function() {
            binder = null;
        },

        'TODO: test update id': function() {
            var node = Y.Node.create("<div id='guid123'></div>");
            binder.init({
                _guid: 'guid123'
            });
            binder.bind(node);

            A.skip();

        }

    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: ['mojito-test', 'node', 'i18nBinderIndex']});
