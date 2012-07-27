/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-glob-tests', function(Y, NAME) {

    var path = require('path'),
        glob = require('glob'),
        suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        AA = YUITest.ArrayAssert,
        baseDir = path.join(__dirname, '../fixtures/glob/');

    function prefixList(prefix, list) {
        var i, out = [];
        for (i=0; i<list.length; i++) {
            out.push(prefix + list[i]);
        }
        return out;
    }

    suite.add(new YUITest.TestCase({

        name: 'sync()',

        'with non-glob': function() {
            var got,
                want = [ 'm1.json' ];
            got = glob.sync(baseDir + 'm1.json', {cwd: __dirname});
            AA.itemsAreEqual(prefixList(baseDir,want), got);
        },

        'simple glob at end': function() {
            var got,
                want = [ 
                    'a1/a2',
                    'a1/b2',
                    'a1/c2',
                    'a1/m2.json'
                ];
            got = glob.sync(baseDir + 'a1/*', {});
            AA.itemsAreEqual(prefixList(baseDir,want).sort(), got.sort());
        },

        'multiple levels': function() {
            var got,
                want = [ 
                    'a1/a2/a3',
                    'a1/a2/b3',
                    'a1/a2/m3.json',
                    'b1/a2/a3',
                    'b1/a2/m3.json',
                    'c1/a2/a3',
                    'c1/a2/m3.json'
                ];
            got = glob.sync(baseDir + '*/a2/*', {});
            AA.itemsAreEqual(prefixList(baseDir,want).sort(), got.sort());
        },

        'multiple concurrent levels': function() {
            var got,
                want = [ 
                    'a1/a2/a3/m4.json',
                    'a1/a2/b3/m4.json',
                    'a1/b2/a3/m4.json',
                    'a1/b2/b3/m4.json',
                    'a1/c2/a3/m4.json',
                    'a1/c2/b3/m4.json'
                ];
            got = glob.sync(baseDir + 'a1/*/*/m4.json', {});
            AA.itemsAreEqual(prefixList(baseDir,want).sort(), got.sort());
        },

        'glob in middle only matches directory': function() {
            var got,
                want = [ 
                    'a1/a2/m3.json',
                    'a1/b2/m3.json'
                ];
            got = glob.sync(baseDir + 'a1/*/m3.json', {});
            AA.itemsAreEqual(prefixList(baseDir,want).sort(), got.sort());
        },

        'no matches': function() {
            var got,
                want = [];
            got = glob.sync(baseDir + 'does/*/not/*/exist.json', {});
            AA.itemsAreEqual(prefixList(baseDir,want).sort(), got.sort());
        },

        'double-star is supported': function() {
            var got,
                want = ['a1/a2/a3/m4.json',
                    'a1/a2/b3/m4.json',
                    'a1/b2/a3/m4.json',
                    'a1/b2/b3/m4.json',
                    'a1/c2/a3/m4.json',
                    'a1/c2/b3/m4.json'];
            got = glob.sync(baseDir + 'a1/**/m4.json', {});
            AA.itemsAreEqual(prefixList(baseDir,want.sort()), got.sort());
        }

    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1');
