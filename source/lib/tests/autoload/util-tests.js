/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-util-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        OA = YUITest.ObjectAssert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'others',

        'copy() deep copies an object': function() {
            var obj = {
                    inner: {
                        string: "value",
                        number: 1,
                        fn: function() {}
                    }
                },
                copy = Y.mojito.util.copy(obj);

            A.areNotSame(obj, copy);

            A.areNotSame(obj.inner, copy.inner);
            OA.areEqual(obj.inner, copy.inner);

            A.areSame(obj.inner.string, copy.inner.string);
            A.areSame(obj.inner.number, copy.inner.number);
            A.areSame(obj.inner.fn, copy.inner.fn);
        },

        'metaMerge empty to empty': function() {
            var to = {};
            var from = {};
            var result = Y.mojito.util.metaMerge(to, from);
            OA.areEqual({}, result, "result should be empty");
        },
        
        'metaMerge full to empty': function() {
            var to = {};
            var from = {
                stuff: 'here'
            };
            var result = Y.mojito.util.metaMerge(to, from);
            OA.areEqual(from, result, "result should be same as from");
        },

        'metaMerge empty to full': function() {
            var to = {
                stuff: 'here'
            };
            var from = {};
            var result = Y.mojito.util.metaMerge(to, from);
            OA.areEqual(to, result, "result should be same as to");
        },

        'metaMerge copies objects': function() {
            var to = {};
            var from = {
                obj: {hello: 'world'}
            };
            var result = Y.mojito.util.metaMerge(to, from);
            OA.areEqual(from, result, "result should be same as from");
        },

        'TODO: metaMerge copies objects lower cases all keys': function() {
            A.skip();
            return;
            var to = {};
            var from = {
                OBJ: {hello: 'world'}
            };
            var expected = {
                obj: {hello: 'world'}
            };
            var result = Y.mojito.util.metaMerge(to, from);
            A.areSame(expected.obj.hello, result.obj.hello, "result should have lower-cased all keys");
        },

        'metaMerge copies arrays': function() {
            var to = {};
            var from = {
                arr: ['hello', 'world']
            };
            var result = Y.mojito.util.metaMerge(to, from);
            OA.areEqual(from, result, "result should be same as from");
        },

        'metaMerge copies "from" properties into "to" objects': function() {
            var to = {
                a: { one: 1 }
            };
            var from = {
                a: { two: 2 }
            };
            var expected = {
                a: { one: 1, two: 2 }
            };
            var result = Y.mojito.util.metaMerge(to, from);
            OA.areEqual(expected.a, result.a, "result should have objects merged");
        },

        'metaMerge copies "from" properties into "to" objects (DEEP)': function() {
            var to = {
                a: {
                    b: {
                        one: 1
                    }
                }
            };
            var from = {
                a: {
                    b: {
                        two: 2
                    },
                    c: 'hello'
                }
            };
            var expected = {
                a: {
                    b: {
                        one: 1,
                        two: 2
                    },
                    c: 'hello'
                }
            };
            var result = Y.mojito.util.metaMerge(to, from);
            console.log(result);
            OA.areEqual(expected.a.b, result.a.b, "result should have objects merged (a.b)");
            A.areSame(expected.a.c, result.a.c, "result should have objects merged (a.c)");
        },

        'metaMerge does not overwrite "from" properties into "to" objects (DEEP)': function() {
            var to = {
                a: {
                    b: 'hello'
                }
            };
            var from = {
                a: {
                    b: 'goodbye'
                }
            };
            var expected = {
                a: {
                    b: 'hello'
                }
            };
            var result = Y.mojito.util.metaMerge(to, from);
            A.areEqual(expected.a.b, result.a.b, "result should have objects merged (a.b)");
        },

        'metaMerge adds elements to existing arrays': function() {
            var to = {
                arr: [1, 2, 3]
            };
            var from = {
                arr: ['hello', 'world']
            };
            var expected = {
                arr: [1,2,3,'hello', 'world']
            };
            var result = Y.mojito.util.metaMerge(to, from);
            OA.areEqual(expected.arr, result.arr, "result array should have added elements");
        },

        'metaMerge overwrites content-type values': function() {
            var to = {
                'content-type': ['foo']
            };
            var from = {
                'content-type': ['bar']
            };
            var expected = {
                'content-type': ['bar']
            };
            var result = Y.mojito.util.metaMerge(to, from);
            OA.areEqual(expected['content-type'], result['content-type'], "result array should have been overridden");
        },

        'metaMerge only uses the last content-type value': function() {
            var to = {
                'content-type': ['foo']
            };
            var from = {
                'content-type': ['bar', 'baz']
            };
            var expected = {
                'content-type': ['baz']
            };
            var result = Y.mojito.util.metaMerge(to, from);
            OA.areEqual(expected['content-type'], result['content-type'], "result array should only have last content-type value");
        },

        'metaMerge does not merge view data': function() {
            var to = {
                view: 'foo'
            };
            var from = {
                view: 'bar'
            };
            var expected = {
                view: 'foo'
            };
            var result = Y.mojito.util.metaMerge(to, from);
            A.areSame(expected.view, result.view, "meta view data should be retained");
        },

        'TODO: metaMerge sees content-type as case insensitive': function() {
            A.skip();
            return;
            var to = {
                'Content-Type': ['foo']
            };
            var from = {
                'content-TYPE': ['bar', 'baz']
            };
            var expected = {
                'content-type': ['baz']
            };
            var result = Y.mojito.util.metaMerge(to, from);
            console.log(result);
            OA.areEqual(expected['content-type'], result['content-type'], "result array should only have last content-type value");
        }

    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojito-util']});
