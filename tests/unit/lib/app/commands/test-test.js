/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, stupid:true, plusplus:true */
/*globals YUI*/

YUI().use('mojito-test-extra', 'test', 'json-parse', 'json-stringify', function(Y) {

    var suite = new Y.Test.Suite('test tests'),
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,
        libfs = require('fs'),
        libunits,

        libpath = require('path'),
        cmdpath = libpath.join(__dirname, '../../../../../lib/app/commands/test.js'),
        mockery = require('mockery'),
        libutils,
        testcmd,
        mockFs;

    mockFs = {
        existsSyncCalled: false,
        mkdirSyncCalled: false,
        realpathSyncCalled: false,
        rmdirSyncCalled: false,

        RESET_MOCK: function() {
            this.existsSyncCalled = false;
            this.mkdirSyncCalled = false;
            this.realpathSyncCalled = false;
            this.rmdirSyncCalled = false;
        },

        existsSync: function(file) {
            this.existsSyncCalled = true;
        },

        readFileSync: function(file, encoding) {
            return libfs.readFileSync(file, encoding);
        },

        statSync: function(file) {
            return libfs.statSync(file);
        },

        readdirSync: function(file) {
            //return libfs.readdirSync(file);
            return ["file1", "file2", "file3"];
        },

        mkdirSync: function(path, mode) {
            this.mkdirSyncCalled = true;
        },

        realpathSync: function(file) {
            return libfs.realpathSync(file);
        },

        rmdirSync: function(file) {
            return libfs.rmdirSync(file);
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

        name: 'test test cases basic',

        setUp: function() {
            testcmd = require(cmdpath);
            libutils = require(libpath.join(__dirname, '../../../../../lib/management/utils.js'));
        },

        'test require': function() {
            A.isNotNull(testcmd);
            A.isFunction(testcmd.run, 'No run function exported');
            A.isString(testcmd.usage, 'No usage string exported');
            A.isArray(testcmd.options, 'No options array exported');
        },

        'test run test': function() {
            var options = {
                    'coverage': true,
                    'verbose': true,
                    'tmpdir': 'abc',
                },
                mockConsole = Y.Mock();
            Y.Mock.expect(mockConsole, {
                method: "error",
                args: [Y.Mock.Value.Any],
                run: function (err) {
                    A.isTrue(/Please specify test type/.test(err));
                }
            });
            Y.Mock.expect(mockConsole, {
                method: "warn",
                args: [Y.Mock.Value.Any],
                run: function (message) {
                    A.isTrue(/The temporary directory you specified does not exist/.test(message));
                }
            });
            libutils.test.setConsole(mockConsole);
            testcmd.run([null], options, function() {});
            A.isTrue(mockFs.mkdirSyncCalled);
        },

        'test run test app no dir': function() {
            var mockConsole = Y.Mock();
            Y.Mock.expect(mockConsole, {
                method: "error",
                args: [Y.Mock.Value.Any],
                run: function (err) {
                    A.isTrue(/Please specify app directory to test/.test(err));
                }
            });
            libutils.test.setConsole(mockConsole);
            testcmd.run(['app'], null, function() {});
            A.isTrue(mockFs.mkdirSyncCalled);
        },

        'test run test app invalid dir': function() {
            var mockConsole = Y.Mock();
            Y.Mock.expect(mockConsole, {
                method: "error",
                args: [Y.Mock.Value.Any],
                run: function (err) {
                    A.isTrue(/Invalid directory/.test(err));
                }
            });
            libutils.test.setConsole(mockConsole);
            testcmd.run(['app', './testapp'], null, function() {});
            A.isTrue(mockFs.mkdirSyncCalled);
        },

        'test run test mojit': function() {
            var mockConsole = Y.Mock();
            Y.Mock.expect(mockConsole, {
                method: "error",
                args: [Y.Mock.Value.Any],
                run: function (err) {
                    A.isTrue(/Please specify mojit directory to test/.test(err));
                }
            });
            libutils.test.setConsole(mockConsole);
            testcmd.run(['mojit'], null, function() {});
            A.isTrue(mockFs.mkdirSyncCalled);
        }
    }));

    suite.add(new Y.Test.Case({

        name: 'test test cases more',

        setUp: function() {
            var options = {
                coverage: true,
                verbose: true
            },
                testcmd = require(cmdpath);
            testcmd.test.setForTest(options);
            libutils = require(libpath.join(__dirname, '../../../../../lib/management/utils.js'));
        },

        'test collectFailure': function() {
            var event = {
                    testCase: {
                        name: "testCaseName"
                    },
                    testName: "testName",
                    error: {
                        getMessage: function() {
                            return "Error found.";
                        }
                    }
                },
                collectedFailures;
            testcmd.test.collectFailure("red", event);
            collectedFailures = testcmd.test.getForTest().collectedFailures;
            A.areSame(1, collectedFailures.length);
            A.areSame("red", collectedFailures[0].suiteName);
            A.areSame("testCaseName", collectedFailures[0].caseName);
            A.areSame("testName", collectedFailures[0].testName);
            A.areSame("Error found.", collectedFailures[0].message);
        },

        'test collectRunResults': function() {
            var results = {
                    passed: 2,
                    name: 'testSuite',
                    type: 'report',
                    'mymojit-tests': {
                        passed: 1,
                        name: 'mymojit-tests',
                    },
                    'mymojitModelFootests': {
                        passed: 1,
                        name: 'mymojitModelFoo-tests',
                    }
                },
                collectedResults,
                collectedJUnitXML;
            testcmd.test.collectRunResults(results);
            collectedResults = testcmd.test.getForTest().collectedResults;
            A.areSame(1, collectedResults.length);
            A.areSame("testSuite", collectedResults[0].name);
            A.areSame("report", collectedResults[0].type);
            A.areSame("mymojit-tests", collectedResults[0]['mymojit-tests'].name);
            A.areSame("mymojitModelFoo-tests", collectedResults[0].mymojitModelFootests.name);
        },

        'test colorFactory': function() {
            var f = {
                    bold: testcmd.test.colorFactory(1),
                    red: testcmd.test.colorFactory(31),
                    green: testcmd.test.colorFactory(32),
                    yellow: testcmd.test.colorFactory(33),
                    blue: testcmd.test.colorFactory(34)
                },
                mystring = f.bold('WarningWarning');
            A.areSame(/WarningWarning/.mystring);
            mystring = f.red('HappyHappy');
            A.areSame(/HappyHappy/.mystring);
            mystring = f.green('GreenGrass');
            A.areSame(/GreenGrass/.mystring);
            mystring = f.yellow('YellowLight');
            A.areSame(/YellowLight/.mystring);
            mystring = f.blue('BlueSky');
            A.areSame(/BlueSky/.mystring);
        },

        'test consoleTestReport mojit': function() {
            var mojitpassresults = [ {
                name: 'testSuite_1359570991918_2',
                passed: 1,
                failed: 1,
                errors: 0,
                ignored: 0,
                total: 2,
                duration: 7,
                type: 'report',
                'mymojit-tests': {
                    name: 'mymojit-tests',
                    passed: 1,
                    failed: 0,
                    errors: 0,
                    ignored: 0,
                    total: 1,
                    duration: 2,
                    type: 'testsuite',
                    'mymojit user tests': {
                        name: 'mymojit user tests',
                        passed: 1,
                        failed: 0,
                        errors: 0,
                        ignored: 0,
                        total: 1,
                        duration: 2,
                        type: 'testcase',
                        'test mojit': {
                            result: 'pass',
                            message: 'Test passed',
                            type: 'test',
                            name: 'test mojit',
                            duration: 1
                        }
                    }
                },
                'mymojitModelFoo-tests': {
                    passed: 1,
                    name: 'mymojitModelFoo-tests',
                    failed: 0,
                    errors: 0,
                    ignored: 0,
                    total: 1,
                    duration: 0,
                    type: 'testsuite',
                    'mymojitModelFoo user tests': {
                        passed: 1,
                        name: 'mymojitModelFoo user tests',
                        failed: 0,
                        errors: 0,
                        ignored: 0,
                        total: 1,
                        duration: 0,
                        type: 'testcase',
                        'test mojit model': {
                            result: 'pass',
                            message: 'Test passed',
                            type: 'test',
                            name: 'test mojit model',
                            duration: 0
                        }
                    }
                },
                timestamp: 'Wed Jan 30 2013 10:36:31 GMT-0800 (PST)'
            } ],
                mockConsole = Y.Mock();
            Y.Mock.expect(mockConsole, {
                method: "log",
                args: [Y.Mock.Value.String],
                run: function (message) {
                    A.isTrue(/Total tests: 2/.test(message));
                    A.isTrue(/Passed: 2/.test(message));
                    A.isTrue(/Deferred: 0/.test(message));
                    A.isTrue(/Failed: 0/.test(message));
                    A.isTrue(/100% pass rate/.test(message));
                }
            });
            libutils.test.setConsole(mockConsole);
            testcmd.test.consoleTestReport(mojitpassresults, []);
        },

        'test consoleTestReport app': function() {
            var failures = [ {
                suiteName: 'mymojitModelFoo-tests',
                caseName: 'mymojitModelFoo user tests',
                testName: 'test mojit model',
                message: 'Value should be true.\nExpected: true (boolean)\nActual: null (object)',
                stack: undefined
            } ],
                appfailedresults = [
                    {   name: 'mymojitModelFoo-tests',
                        passed: 0,
                        failed: 1,
                        errors: 0,
                        ignored: 0,
                        total: 1,
                        duration: 6,
                        type: 'report',
                        'mymojitModelFoo user tests': {
                            name: 'mymojitModelFoo user tests',
                            passed: 0,
                            failed: 1,
                            errors: 0,
                            ignored: 0,
                            total: 1,
                            duration: 5,
                            type: 'testcase',
                            'test mojit model': {
                                result: 'fail',
                                message: 'Test failed',
                                type: 'test',
                                name: 'test mojit model',
                                duration: 0
                            }
                        },
                        timestamp: 'Wed Jan 30 2013 11:03:35 GMT-0800 (PST)'
                        },
                    {
                        name: 'mymojit-tests',
                        passed: 1,
                        failed: 0,
                        errors: 0,
                        ignored: 0,
                        total: 1,
                        duration: 0,
                        type: 'report',
                        'mymojit user tests': {
                            name: 'mymojit user tests',
                            passed: 1,
                            failed: 0,
                            errors: 0,
                            ignored: 0,
                            total: 1,
                            duration: 0,
                            type: 'testcase',
                            'test mojit': {
                                result: 'pass',
                                message: 'Test passed',
                                type: 'test',
                                name: 'test mojit modelTODO',
                                duration: 0
                            }
                        },
                        timestamp: 'Wed Jan 30 2013 11:03:35 GMT-0800 (PST)'
                    },
                    {
                        name: 'mymojit-tests',
                        passed: 1,
                        failed: 0,
                        errors: 0,
                        ignored: 0,
                        total: 1,
                        duration: 0,
                        type: 'report',
                        'mymojit user tests': {
                            name: 'mymojit user tests',
                            passed: 1,
                            failed: 0,
                            errors: 0,
                            ignored: 0,
                            total: 1,
                            duration: 0,
                            type: 'testcase',
                            'test mojit': {
                                result: 'pass',
                                message: 'Test passed',
                                type: 'test',
                                name: 'test mojit model',
                                duration: 0
                            }
                        },
                        timestamp: 'Wed Jan 30 2013 11:03:35 GMT-0800 (PST)'
                    },
                    {
                        name: 'mymojit-tests',
                        passed: 1,
                        failed: 0,
                        errors: 0,
                        ignored: 0,
                        total: 1,
                        duration: 0,
                        type: 'report',
                        'mymojit user tests': {
                            name: 'mymojit user tests',
                            passed: 1,
                            failed: 0,
                            errors: 0,
                            ignored: 0,
                            total: 1,
                            duration: 0,
                            type: 'testcase',
                            'test mojit': {
                                result: 'pass',
                                message: 'Test passed',
                                type: 'test',
                                name: 'test mojit model',
                                duration: 0
                            }
                        },
                        timestamp: 'Wed Jan 30 2013 11:03:35 GMT-0800 (PST)'
                    }],
                mockConsole = Y.Mock();
            Y.Mock.expect(mockConsole, {
                method: "log",
                args: [Y.Mock.Value.String],
                run: function (message) {
                    A.isTrue(/Total tests: 4/.test(message));
                    A.isTrue(/Passed: 2/.test(message));
                    A.isTrue(/Deferred: 1/.test(message));
                    A.isTrue(/Failed: 1/.test(message));
                    A.isTrue(/50% pass rate/.test(message));
                }
            });
            libutils.test.setConsole(mockConsole);
            testcmd.test.consoleTestReport(appfailedresults, failures);
        },

        'test merge': function() {
            var module1 = {
                    name: "module1",
                    color: "red"
                },
                module2 = {
                    name: "module2",
                    dimention: 3
                },
                merged = testcmd.test.merge(module1, module2);
            A.areSame("red", merged.color);
            A.areSame("module2", merged.name);
            A.areSame(3, merged.dimention);
        },

        'test preProcessor': function() {
            testcmd.test.preProcessor();
            A.isTrue(mockFs.mkdirSyncCalled);
        }

    }));
    Y.Test.Runner.add(suite);
});
