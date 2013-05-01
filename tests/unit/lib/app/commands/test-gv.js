/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, stupid:true, plusplus:true */
/*globals YUI*/

YUI().use('mojito-test-extra', 'test', 'json-parse', 'json-stringify', function(Y) {

    var suite = new Y.Test.Suite('test gv'),
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,
        libfs = require('fs'),
        libunits,

        libpath = require('path'),
        existsSync = libfs.existsSync || libpath.existsSync,
        cmdpath = libpath.join(__dirname, '../../../../../lib/app/commands/gv.js'),
        utilspath = libpath.join(__dirname, '../../../../../lib/management/utils.js'),
        mojitoVersion = require(libpath.join(__dirname, '/../../../../../package.json')).version,
        mockery = require('mockery'),
        libutils,
        gvcmd,
        mockFs;

    mockFs = {
        _log: [],

        RESET_MOCK: function() {
            this._log = [];
        },

        existsSync: function(file) {
            return existsSync(file);
        },

        readFileSync: function(file, encoding) {
            return libfs.readFileSync(file, encoding);
        },

        statSync: function(file) {
            return libfs.statSync(file);
        },

        readdirSync: function(file) {
            return libfs.readdirSync(file);
        },

        realpathSync: function(file) {
            return libfs.realpathSync(file);
        },

        writeFileSync: function(file, content, encoding) {
            this._log.push(['writeFileSync', file, content, encoding]);
        },

        mkdirSync: function(path, mode) {
            this._log.push(['mkdirSync', path, mode]);
        },

        rmdirSync: function(file) {
            this._log.push(['rmdirSync', file]);
        }
    };

    mockery.registerAllowable(cmdpath);
    mockery.registerMock('fs', mockFs);
    mockery.enable({
        'useCleanCache': true,
        'warnOnUnregistered': false,
        'warnOnReplace': false
    });

    suite.add(new Y.Test.Case({

        name: 'test gv cases basic',

        setUp: function() {
            gvcmd = require(cmdpath);
            libutils = require(utilspath);
        },


        'test require': function() {
            A.isObject(gvcmd);
            A.isFunction(gvcmd.run, 'No run function exported');
            A.isString(gvcmd.usage, 'No usage string exported');
            A.isArray(gvcmd.options, 'No options array exported');
        },


        'test run basics': function() {
            var options = {},
                fixtures = libpath.join(__dirname, '../../../../fixtures/store'),
                mockConsole;

            mockConsole = {
                _log: [],
                log: function(txt) {
                    this._log.push(txt);
                }
            };
            libutils.test.setConsole(mockConsole);

            var callbackCalled = false;
            mockFs.RESET_MOCK();
            A.isObject(gvcmd);
            gvcmd.test.appRoot = fixtures;
            gvcmd.run([], options, function() {
                callbackCalled = true;
            });
            A.areSame(3, mockFs._log.length);
            Y.TEST_CMP(['mkdirSync', fixtures + '/artifacts', 511], mockFs._log[0]);
            Y.TEST_CMP(['mkdirSync', fixtures + '/artifacts/gv', 511], mockFs._log[1]);
            Y.TEST_CMP('writeFileSync', mockFs._log[2][0]);
            Y.TEST_CMP(fixtures + '/artifacts/gv/yui.server.dot', mockFs._log[2][1]);

            A.isTrue(callbackCalled, 'callback called');
            A.areSame(2, mockConsole._log.length, 'right number of log messages');
            A.areSame('Dotfile generated. To turn it into a graph, run the following:', mockConsole._log[0]);
            A.areSame('$ dot -Tgif artifacts/gv/yui.server.dot > artifacts/gv/yui.server.gif', mockConsole._log[1]);

            var graph = gvcmd.test.graph;
            var want = [
                // we don't actually care about the order
                'jsonp-url',
                'yql'
            ];
            Y.TEST_CMP(want, Object.keys(graph._nodes).sort(), 'nodes');

            want = [
                // we don't actually care about the order
                'ModelFlickr,true,jsonp-url',
                'ModelFlickr,true,yql',
                'page,true,mojito',
                'page,true,mojito-composite-addon',
                'page,true,mojito-config-addon',
                'page,true,mojito-params-addon',
                'rollupsModelServer,true,mojito',
                'soloMojit,true,mojito',
                'test_applevelModel,true,mojito',
                'test_mojit_1_actions_test_1,true,mojito',
                'test_mojit_1_actions_test_2,true,mojito',
                'test_mojit_1_model_test_1,true,mojito',
                'test_mojit_1_model_test_2,true,mojito',
                'test_mojit_2,true,mojito'
            ];
            Y.TEST_CMP(want, Object.keys(graph._edges).sort(), 'edges');

            want = [
                // we don't actually care about the order
                'mojit HTMLFrameMojit',
                'mojit LazyLoad',
                'mojit TestMojit2',
                'mojit TunnelProxy',
                'mojit page',
                'mojit rollups',
                'mojit soloMojit',
                'mojit test_mojit_1',
                'package mojito@' + mojitoVersion,
                'package store@999.999.999'
            ];
            Y.TEST_CMP(want, Object.keys(graph._subgraphs).sort(), 'subgraphs');

            want = [];
            Y.TEST_CMP(want, Object.keys(graph._subgraphs['mojit LazyLoad']._nodes).sort(), 'subgraph mojit LazyLoad');
            Y.TEST_CMP(want, Object.keys(graph._subgraphs['mojit TunnelProxy']._nodes).sort(), 'subgraph mojit TunnelProxy');
            Y.TEST_CMP(want, Object.keys(graph._subgraphs['mojit HTMLFrameMojit']._nodes).sort(), 'subgraph mojit HTMLFrameMojit');

            want = [
                'test_mojit_2'
            ];
            Y.TEST_CMP(want, Object.keys(graph._subgraphs['mojit TestMojit2']._nodes).sort(), 'subgraph mojit TestMojit2');

            want = [
                'page'
            ];
            Y.TEST_CMP(want, Object.keys(graph._subgraphs['mojit page']._nodes).sort(), 'subgraph mojit page');

            want = [
                'rollups',
                'rollupsModelServer'
            ];
            Y.TEST_CMP(want, Object.keys(graph._subgraphs['mojit rollups']._nodes).sort(), 'subgraph mojit rollups');

            want = [
                'soloMojit'
            ];
            Y.TEST_CMP(want, Object.keys(graph._subgraphs['mojit soloMojit']._nodes).sort(), 'subgraph mojit soloMojit');

            want = [
                'test_mojit_1_actions_test_1',
                'test_mojit_1_actions_test_2',
                'test_mojit_1_model_test_1',
                'test_mojit_1_model_test_2'
            ];
            Y.TEST_CMP(want, Object.keys(graph._subgraphs['mojit test_mojit_1']._nodes).sort(), 'subgraph mojit test_mojit_1');

            want = [
                'mojito',
                'mojito-composite-addon',
                'mojito-config-addon',
                'mojito-params-addon'
            ];
            Y.TEST_CMP(want, Object.keys(graph._subgraphs['package mojito@' + mojitoVersion]._nodes).sort(), 'subgraph package mojito@this');

            want = [
                'ModelFlickr',
                'test_applevelModel'
            ];
            Y.TEST_CMP(want, Object.keys(graph._subgraphs['package store@999.999.999']._nodes).sort(), 'subgraph package store@999.999.999');
        },


        'test parseResources basics': function() {
            var env = 'server';
            var graph = {
                _subgraphs: {},
                _nodes: {},
                _edges: {},
                getSubgraph: function(name) {
                    if (!this._subgraphs[name]) {
                        this._subgraphs[name] = {
                            _nodes: [],
                            style: {}
                        };
                    }
                    return this._subgraphs[name];
                },
                getNode: function(name) {
                    if (!this._nodes[name]) {
                        this._nodes[name] = {
                            attrs: {}
                        };
                    }
                    return this._nodes[name];
                },
                getEdge: function(tailName, headName, directed) {
                    var name = [tailName, headName].join(',');
                    if (!this._edges[name]) {
                        this._edges[name] = {
                            attrs: {}
                        };
                    }
                    return this._edges[name];
                },
                moveNodeToSubgraph: function(nodeName, subgraphName) {
                    var subgraph = this.getSubgraph(subgraphName);
                    subgraph._nodes.push(nodeName);
                }
            };
            var ress = [
                {
                    type: 'whatever',
                    mojit: 'MojitA',
                    affinity: { affinity: 'server' },
                    source: { pkg: { name: 'pkgA', version: 'eleven' } },
                    yui: { name: 'a', meta: { requires: ['b', 'c'] } }
                },
                {
                    type: 'whatever',
                    mojit: 'MojitB',
                    affinity: { affinity: 'server' },
                    source: { pkg: { name: 'pkgB', version: 'eleven' } },
                    yui: { name: 'b', meta: {} }
                }
            ];
            var options = {};
            mockFs.RESET_MOCK();
            A.isFunction(gvcmd.test.parseResources);
            gvcmd.test.parseResources(env, graph, ress, options);
            var want = {
                "_subgraphs": {
                    "mojit MojitA": {
                        "_nodes": [ "a" ],
                        "style": { "label": "mojit MojitA" },
                        "type": "cluster"
                    },
                    "mojit MojitB": {
                        "_nodes": [ "b" ],
                        "style": { "label": "mojit MojitB" },
                        "type": "cluster"
                    }
                },
                "_nodes": {
                    "a": {
                        "attrs": {
                            "pkg": { "name": "pkgA", "version": "eleven" },
                            "hasEdge": true
                        }
                    },
                    "b": {
                        "attrs": {
                            "hasEdge": true,
                            "pkg": { "name": "pkgB", "version": "eleven" }
                        }
                    },
                    "c": {
                        "attrs": { "hasEdge": true }
                    }
                },
                "_edges": {
                    "a,b": { "attrs": {} },
                    "a,c": { "attrs": {} }
                },
                getSubgraph: function() {},
                getNode: function() {},
                getEdge: function() {},
                moveNodeToSubgraph: function() {}
            };
            Y.TEST_CMP(want, graph);
        }


    }));


    Y.Test.Runner.add(suite);
});
