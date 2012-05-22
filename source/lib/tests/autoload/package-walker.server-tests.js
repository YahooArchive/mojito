/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-package-walker-server-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        libpath = require('path'),
        fixtures = libpath.join(__dirname, '../fixtures/packages'),
        mojitoRoot = libpath.join(__dirname, '../..'),
        libwalker = require(libpath.join(__dirname, '../../package-walker.server')),
        Mock = YUITest.Mock,
        A = YUITest.Assert,
        AA = YUITest.ArrayAssert;

    suite.add(new YUITest.TestCase({

        name: 'package-walker tests',

        'breadth first basics': function() {
            var order = [];
            var walker = new libwalker.BreadthFirst(fixtures);
            walker.walk(function(err, info) {
                order.push(info.pkg.name + '@' + info.pkg.version);
                switch(info.pkg.name) {
                    case 'root':
                        A.areSame(0, info.depth);
                        A.areSame('666.0.0', info.pkg.version);
                        AA.itemsAreSame([], info.parents);
                        A.areSame(fixtures, info.dir);
                        break;

                    case 'a':
                        A.areSame(1, info.depth);
                        A.areSame('666.1.0', info.pkg.version);
                        AA.itemsAreSame(['root'], info.parents);
                        A.areSame(libpath.join(fixtures,'node_modules/a'), info.dir);
                        break;
                    case 'aa':
                        A.areSame(2, info.depth);
                        A.areSame('666.1.1', info.pkg.version);
                        AA.itemsAreSame(['a','root'], info.parents);
                        A.areSame(libpath.join(fixtures,'node_modules/a/node_modules/aa'), info.dir);
                        break;
                    case 'ab':
                        A.areSame(2, info.depth);
                        A.areSame('666.1.2', info.pkg.version);
                        AA.itemsAreSame(['a','root'], info.parents);
                        A.areSame(libpath.join(fixtures,'node_modules/a/node_modules/ab'), info.dir);
                        break;

                    case 'b':
                        A.areSame(1, info.depth);
                        A.areSame('666.2.0', info.pkg.version);
                        AA.itemsAreSame(['root'], info.parents);
                        A.areSame(libpath.join(fixtures,'node_modules/b'), info.dir);
                        break;
                    case 'ba':
                        A.areSame(2, info.depth);
                        A.areSame('666.2.1', info.pkg.version);
                        AA.itemsAreSame(['b','root'], info.parents);
                        A.areSame(libpath.join(fixtures,'node_modules/b/node_modules/ba'), info.dir);
                        break;
                    case 'bb':
                        A.areSame(2, info.depth);
                        A.areSame('666.2.2', info.pkg.version);
                        AA.itemsAreSame(['b','root'], info.parents);
                        A.areSame(libpath.join(fixtures,'node_modules/b/node_modules/bb'), info.dir);
                        break;

                    case 'c':
                        A.areSame(1, info.depth);
                        A.areSame('999.999.999', info.pkg.version);
                        AA.itemsAreSame(['root'], info.parents);
                        A.areSame(libpath.join(fixtures,'node_modules/c'), info.dir);
                        break;
                    case 'ca':
                        A.areSame(2, info.depth);
                        A.areSame('999.999.999', info.pkg.version);
                        AA.itemsAreSame(['c','root'], info.parents);
                        A.areSame(libpath.join(fixtures,'node_modules/c/node_modules/ca'), info.dir);
                        break;
                    case 'cb':
                        A.areSame(2, info.depth);
                        A.areSame('666.3.2', info.pkg.version);
                        AA.itemsAreSame(['c','root'], info.parents);
                        A.areSame(libpath.join(fixtures,'node_modules/c/node_modules/cb'), info.dir);
                        break;

                }
            });
            AA.itemsAreSame([
                'root@666.0.0',
                'a@666.1.0',
                'b@666.2.0',
                'c@999.999.999',
                'aa@666.1.1',
                'ab@666.1.2',
                'ba@666.2.1',
                'bb@666.2.2',
                //'ca@999.999.999',
                'cb@666.3.2'
                ], order);
        },

        'TODO: breadth first inheritance': function() {
            A.skip();
        }

    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: ['oop']});
