/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-intl-addon-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        Assert = YUITest.Assert,
        Mock = YUITest.Mock;
    
    suite.add(new YUITest.TestCase({
    
        name: 'intl tests',

        'lang() gets translation from Y.Intl': function() {
            var command = {},
                adapter = null,
                ac = {
                    type: 'acType',
                    context: { lang: 'foo' }
                };

            var mockYIntl = Mock();
            Mock.expect(mockYIntl, {
                method: 'setLang',
                args: [ac.type, 'foo'],
                returns: 'true'
            });
            Mock.expect(mockYIntl, {
                method: 'get',
                args: [ac.type, 'key'],
                returns: 'translation'
            });

            var yIntl = Y.Intl;
            Y.Intl = mockYIntl;

            var addon = new Y.mojito.addons.ac.intl(command, adapter, ac);
            var value = addon.lang('key');

            Y.Intl = yIntl;

            Assert.areEqual('translation', value, 'The return value of Y.Intl.get() was not used');
            Mock.verify(mockYIntl);
        },

        'lang() formats translation from Y.Intl': function() {
            var command = {},
                adapter = null,
                ac = {
                    type: 'acType',
                    context: { lang: 'foo' }
                };

            var mockYIntl = Mock();
            Mock.expect(mockYIntl, {
                method: 'setLang',
                args: [ac.type, 'foo'],
                returns: 'true'
            });
            Mock.expect(mockYIntl, {
                method: 'get',
                args: [ac.type, 'key'],
                returns: 'translation {0} {1}'
            });

            var yIntl = Y.Intl;
            Y.Intl = mockYIntl;

            var addon = new Y.mojito.addons.ac.intl(command, adapter, ac);
            var value = addon.lang('key', ['param1', 'param2']);

            Y.Intl = yIntl;

            Assert.areEqual('translation param1 param2', value, 'The return value of Y.Intl.get() was not formatted');
            Mock.verify(mockYIntl);
        },

        'formatDate() delegates to Y.DataType.Date.format': function() {
            var command = {},
                adapter = null,
                ac = { type: 'acType' },
                argDate = new Date();

            var mockYDataTypeDate = Mock();
            Mock.expect(mockYDataTypeDate, {
                method: 'format',
                args: [argDate, Mock.Value(function(o) {
                    Assert.areSame("%x", o.format, "Unexpected date formatting specifier");
                })],
                returns: 'formattedDate'
            });

            var yDataTypeDate = Y.DataType.Date;
            Y.DataType.Date = mockYDataTypeDate;

            var addon = new Y.mojito.addons.ac.intl(command, adapter, ac);
            var value = addon.formatDate(argDate);

            Y.DataType.Date = yDataTypeDate;

            Assert.areEqual('formattedDate', value, 'The return value of Y.DataType.Date.format() was not used');
            Mock.verify(mockYDataTypeDate);
        }

    }));
    
    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: [
    'mojito-intl-addon'
]});
