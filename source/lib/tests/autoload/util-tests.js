/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-util-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        AA = YUITest.ArrayAssert,
        OA = YUITest.ObjectAssert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'others',

        'htmlEntitiesToUnicode cleanses a string': function() {
            A.areSame(
                '\\u003Cscript\\u003Ealert(\\u0022hi, i\\u0027m a squid \\u0026 a happy one!\\u0022)\\u003C/script\\u003E',
                Y.mojito.util.cleanse(
                    '<script>alert("hi, i\'m a squid & a happy one!")</script>'));
        },

        'cleanse cleanses a string': function() {
            A.areSame(
                '\\u003Cscript\\u003Ealert(\\u0022hi, i\\u0027m a squid \\u0026 a happy one!\\u0022)\\u003C/script\\u003E',
                Y.mojito.util.cleanse(
                    '<script>alert("hi, i\'m a squid & a happy one!")</script>'));
        },

        'cleanse cleanses an empty array': function() {
            var a = [];
            AA.itemsAreEqual(a, Y.mojito.util.cleanse(a),
                'Empty array should cleanse properly as empty array.');
        },
        
        'cleanse cleanses an array with single array child': function() {
            var a = [[]];
            // AA.itemsAreEqual is brain-damaged and doesn't maintain Array
            // semantics for content checks so we hack around it with JSON.
            A.areSame(Y.JSON.stringify(a),
                Y.JSON.stringify(Y.mojito.util.cleanse(a)),
                'Array with single (empty) array child should cleanse properly.');
        },

        'cleanse cleanses an array': function() {
            var a1, 
                a2;

            a1 = ['<script>I\'m a hack attempt</script>'];
            a2 = ['\\u003Cscript\\u003EI\\u0027m a hack attempt\\u003C/script\\u003E'];
            AA.itemsAreEqual(a2, Y.mojito.util.cleanse(a1),
                'array cleanse should work');
        },

        'cleanse cleanses an object': function() {
            var o1, 
                o2;

            o1 = {'key': '<script>I\'m a hack attempt</script>'};
            o2 = {'key': 
                '\\u003Cscript\\u003EI\\u0027m a hack attempt\\u003C/script\\u003E'};

            OA.areEqual(o2, Y.mojito.util.cleanse(o1),
                'object cleanse should work');
        },

        'cleanse cleanses a nested array': function() {
            var a1, 
                a2;

            a1 = [['<script>I\'m a hack attempt</script>']];
            a2 = [['\\u003Cscript\\u003EI\\u0027m a hack attempt\\u003C/script\\u003E']];
            AA.itemsAreEqual(a2[0], Y.mojito.util.cleanse(a1)[0],
                'nested array cleanse should work');
        },

        'cleanse cleanses a nested object': function() {
            var a1, 
                a2;

            a1 = [{'key': '<script>I\'m a hack attempt</script>'}];
            a2 = [{'key': 
                '\\u003Cscript\\u003EI\\u0027m a hack attempt\\u003C/script\\u003E'}];

            OA.areEqual(a2[0], Y.mojito.util.cleanse(a1)[0],
                'object cleanse should work');
        },

        'cleanse ignores numbers, booleans, etc.': function() {
            var a1, 
                a2;
       
            a1 = [1, true, 'blah']; 
            a2 = [1, true, 'blah'];

            AA.itemsAreEqual(a2, Y.mojito.util.cleanse(a1));
        },
        
        'unicodeToHtmlEntities uncleanses a string': function() {
            A.areSame(
                '<script>alert("hi, i\'m a squid & a happy one!")</script>',
                Y.mojito.util.cleanse(
                    '\\u003Cscript\\u003Ealert(\\u0022hi, i\\u0027m a squid \\u0026 a happy one!\\u0022)\\u003C/script\\u003E',
                    Y.mojito.util.unicodeToHtmlEntities));
        },

        'uncleanse uncleanses a string': function() {
            A.areSame(
                '<script>alert("hi, i\'m a squid & a happy one!")</script>',
                Y.mojito.util.uncleanse(
                    '\\u003Cscript\\u003Ealert(\\u0022hi, i\\u0027m a squid \\u0026 a happy one!\\u0022)\\u003C/script\\u003E'));
        },

        'uncleanse uncleanses an empty array': function() {
            var a = [];
            AA.itemsAreEqual(a, Y.mojito.util.uncleanse(a),
                'Empty array should cleanse properly as empty array.');
        },
        
        'uncleanse cleanses an array with single array child': function() {
            var a = [[]];
            // AA.itemsAreEqual is brain-damaged and doesn't maintain Array
            // semantics for content checks so we hack around it with JSON.
            A.areSame(Y.JSON.stringify(a),
                Y.JSON.stringify(Y.mojito.util.uncleanse(a)),
                'Array with single (empty) array child should uncleanse properly.');
        },

        'uncleanse uncleanses an array': function() {
            var a1, 
                a2;

            a1 = ['<script>I\'m a hack attempt</script>'];
            a2 = ['\\u003Cscript\\u003EI\\u0027m a hack attempt\\u003C/script\\u003E'];
            AA.itemsAreEqual(a1, Y.mojito.util.uncleanse(a2),
                'array uncleanse should work');
        },

        'uncleanse uncleanses an object': function() {
            var o1, 
                o2;

            o1 = {'key': '<script>I\'m a hack attempt</script>'};
            o2 = {'key': 
                '\\u003Cscript\\u003EI\\u0027m a hack attempt\\u003C/script\\u003E'};

            OA.areEqual(o1, Y.mojito.util.uncleanse(o2),
                'object uncleanse should work');
        },

        'uncleanse uncleanses a nested array': function() {
            var a1, 
                a2;

            a1 = [['<script>I\'m a hack attempt</script>']];
            a2 = [['\\u003Cscript\\u003EI\\u0027m a hack attempt\\u003C/script\\u003E']];
            AA.itemsAreEqual(a1[0], Y.mojito.util.uncleanse(a2)[0],
                'nested array uncleanse should work');
        },

        'uncleanse uncleanses a nested object': function() {
            var a1, 
                a2;

            a1 = [{'key': '<script>I\'m a hack attempt</script>'}];
            a2 = [{'key': 
                '\\u003Cscript\\u003EI\\u0027m a hack attempt\\u003C/script\\u003E'}];

            OA.areEqual(a1[0], Y.mojito.util.uncleanse(a2)[0],
                'object uncleanse should work');
        },

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
            AA.itemsAreEqual(from.arr, result.arr,
                "result array items should equal from array items");
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
            OA.areEqual(expected.a, result.a,
                "result should have objects merged");
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
            AA.itemsAreEqual(expected.arr, result.arr,
                "result array should have added elements");
        },

        'metaMerge uniques arrays': function() {
            var to = {
                arr: [1, 2, 3, 'hello']
            };
            var from = {
                arr: ['hello', 'world']
            };
            var expected = {
                arr: [1,2,3,'hello', 'world']
            };
            var result = Y.mojito.util.metaMerge(to, from);
            AA.itemsAreEqual(expected.arr, result.arr,
                "result array should have merged and uniqued array elements");
        },

        'metaMerge uniques nested arrays': function() {
            var to = {
                arrContainer: {
                    arr: [1, 2, 3, 'hello']
                }
            };
            var from = {
                arrContainer: {
                    arr: ['hello', 'world']
                }
            };
            var expected = {
                arrContainer: {
                    arr: [1,2,3,'hello', 'world']
                }
            };
            var result = Y.mojito.util.metaMerge(to, from);
            AA.itemsAreEqual(expected.arrContainer.arr, result.arrContainer.arr,
                "result array should have merged and uniqued nested array elements");
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
            AA.itemsAreEqual(expected['content-type'], result['content-type'], "result array should have been overridden");
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
    
}, '0.0.1', {requires: ['mojito-util','json']});
