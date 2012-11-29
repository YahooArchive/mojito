/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, regexp:true, nomen:true, stupid:true*/
'use strict';

var libpath = require('path'),
    libfs = require('fs'),
    existsSync = libfs.existsSync || libpath.existsSync,
    exec = require('child_process').exec,

    // paths
    BASE = libpath.resolve(__dirname, '../../..') + '/',
    targetMojitoPath = BASE,
    mojitoTmp = '/tmp/mojitotmp',
    mojitoInstrumentedDir = '/tmp/mojito-lib-inst',
    fwTestsRoot = BASE + 'lib/tests',
    resultsDir = 'artifacts/test',
    resultsFile = 'artifacts/test/result.xml',
    coverageDir = 'artifacts/test/coverage',
    coverageFile = coverageDir + '/coverage.json',
    ytcJar = require.resolve('yuitest-coverage/jar/yuitest-coverage.jar'),
    ytcrJar = require.resolve('yuitest-coverage/jar/yuitest-coverage-report.jar'),

    utils = require(BASE + 'lib/management/utils'),
    ymc = require(BASE + 'lib/management/yui-module-configurator'),
    copyExclude = utils.copyExclude,
    copyFile = utils.copyFile,

    Store = require(BASE + 'lib/store'),

    MODE_ALL = parseInt('777', 8),
    RX_TESTS = /-tests$/,

    YUI = require('yui').YUI,
    YUITest = require('yuitest').YUITest,
    TestRunner = YUITest.TestRunner,

    testStart,

    // for asynch testing
    testQueue = [],

    collectedFailures = [],
    collectedResults = [],
    collectedJUnitXML = [],
    collectedCoverage = {},

    colorFactory,
    run,
    usage,
    options,
    inputOptions,
    runTests,
    Y = require('yui').YUI({useSync: true}).use('json-parse', 'json-stringify');

Y.applyConfig({useSync: false});

// OSX's /tmp directory is a symbolic link to /private/tmp, and we want to use
// the real directory string
try {
    if (libfs.statSync('/private/tmp').isDirectory()) {
        mojitoTmp = '/private' + mojitoTmp;
        mojitoInstrumentedDir = '/private' + mojitoInstrumentedDir;
    }
} catch (err) {
    // if there is no /private/tmp directory, no worries, the default /tmp must
    // be a real directory
}


/**
 * Collects the failure, for use later by processResults().
 *
 * @param {string} suiteName The name of the test suite in which the error
 *     occurred.
 * @param {Object} event YUITest The failure event.
 */
function collectFailure(suiteName, event) {
    collectedFailures.push({
        suiteName: suiteName,
        caseName: event.testCase.name,
        testName: event.testName,
        message: event.error.getMessage(),
        stack: event.error.stack
    });
}


/**
 * Collects the results of each run, for use later by processResults().
 * This not only stores the passed results, but also digs into the TestRunner
 * global to pull out the XML (and coverage info, if we're running coverage).
 *
 * @param {Object} results The results of the test run.
 */
function collectRunResults(results) {
    var str,
        json,
        file;

    collectedResults.push(results);
    collectedJUnitXML.push(TestRunner.getResults(YUITest.TestFormat.JUnitXML));

    if (inputOptions.coverage) {
        str = TestRunner.getCoverage(YUITest.CoverageFormat.JSON);
        try {
            json = Y.JSON.parse(str);
        } catch (e) {
            // not expected to happen very often, so no effort to make it pretty
            console.log('------ERROR------');
            console.log(e);
        }
        for (file in json) {
            if (json.hasOwnProperty(file)) {
                collectedCoverage[file] = json[file];
            }
        }
    }
}

function configureYUI(YUI, store) {
    YUI.applyConfig({
        useSync: true,
        groups: {
            'mojito-shared': store.yui.getConfigShared('server', {}, false),
            'mojito-mojits': store.yui.getConfigAllMojits('server', {})
        }
    });
}


/**
 * Pretty-prints the results to the console.
 *
 * @param {Array} results The results of all test runs.
 * @param {Array} allFailures The list of failure details.
 */
function consoleTestReport(results, allFailures) {
    var passedCnt = 0,
        failedCnt = 0,
        deferredCnt = 0,
        totalCnt = 0,
        percentagePassed,
        formatter = null,
        msg = '',
        failure,
        testSuiteResults = {},
        i = 0,
        r,
        report = '',
        f = {
            bold: colorFactory(1),
            red: colorFactory(31),
            green: colorFactory(32),
            yellow: colorFactory(33),
            blue: colorFactory(34)
        };

    console.log('\n');

    function printTestResults(test, suiteName, caseName) {
        totalCnt += 1;
        if (test.result === 'pass') {
            if (test.name.indexOf('TODO') > -1) {
                formatter = f.yellow;
                msg = '⚑ deferred';
                deferredCnt += 1;
            } else {
                formatter = f.green;
                msg = '✔  passed';
                passedCnt += 1;
            }
        } else {
            formatter = f.red;
            msg = '✖  FAILED';
            failedCnt += 1;
        }
        console.log(formatter(msg + '\t' + suiteName + ' :: ' + caseName +
            ' :: ' + test.name));
    }

    function printTestCaseResults(tcase, suiteName) {
        var testName;
        for (testName in tcase) {
            if (tcase.hasOwnProperty(testName)) {
                if (typeof tcase[testName] === 'object') {
                    printTestResults(tcase[testName], suiteName, tcase.name);
                }
            }
        }
    }

    function printTestSuiteResults(suite) {
        if (inputOptions.verbose) {
            utils.log('suite: ' + suite.name);
        }
        var caseName,
            testThing;
        testSuiteResults[suite.name] = suite;
        for (caseName in suite) {
            if (suite.hasOwnProperty(caseName)) {
                if (typeof suite[caseName] === 'object') {
                    testThing = suite[caseName];
                    if (testThing.type === 'testcase') {
                        printTestCaseResults(testThing, suite.name);
                    } else if (testThing.type === 'testsuite') {
                        printTestSuiteResults(testThing);
                    }
                }
            }
        }
    }

    for (r = 0; r < results.length; r += 1) {
        printTestSuiteResults(results[r]);
    }

    if (allFailures.length) {
        console.log('\n' + f.bold('FAILURE DETAILS:\n================'));
        for (i = 0; i < allFailures.length; i += 1) {
            failure = allFailures[i];
            // suite, case, test, details
            console.log(f.red(failure.suiteName + ' :: ' + failure.caseName +
                ' :: ' + failure.testName + '\n' +
                (failure.stack || failure.message)) + '\n');
        }
    }

    percentagePassed = Math.round(passedCnt / totalCnt * 100);

    formatter = f.green;
    report = '\nTotal tests: ' + totalCnt + '\t' + '✔ Passed: ' + passedCnt +
        '\t';
    if (deferredCnt) {
        formatter = f.yellow;
    }
    report = report + formatter('⚑ Deferred: ' + deferredCnt) + '\t';
    if (failedCnt) {
        formatter = f.red;
    } else {
        formatter = f.green;
    }
    report = report + formatter('✖ Failed: ' + failedCnt) + '\t';

    if (percentagePassed > 99) {
        formatter = f.green;
    }
    report = report + formatter(percentagePassed + '% pass rate') + '\n';

    console.log(report);

}

/**
 * Perform a shallow merge. Properties on later objects override those on
 * earlier objects.
 * @return {Object} The merged object.
 */
function merge() {
    var result = {},
        prop,
        o,
        len = arguments.length,
        i;

    for (i = 0; i < len; i += 1) {
        o = arguments[i];
        for (prop in o) {
            if (o.hasOwnProperty(prop)) {
                result[prop] = o[prop];
            }
        }
    }

    return result;
}


function preProcessor() {

    var filepath,
        fstat,
        files,
        i;

    try {
        files = libfs.readdirSync(coverageDir);
        for (i = 0; i < files.length; i += 1) {
            filepath = coverageDir + '/' + files[i];
            fstat = libfs.statSync(filepath);
            if (fstat.isFile()) {
                libfs.unlinkSync(filepath);
            }
        }
        libfs.rmdirSync(coverageDir);
    } catch (err1) {  // ignore
    }

    try {
        files = libfs.readdirSync(resultsDir);
        for (i = 0; i < files.length; i += 1) {
            filepath = resultsDir + '/' + files[i];
            fstat = libfs.statSync(filepath);
            if (fstat.isFile()) {
                libfs.unlinkSync(filepath);
            }
        }

        libfs.rmdirSync(resultsDir);
        utils.removeDir();
    } catch (err2) {  // ignore
    }

    try {
        libfs.mkdirSync(resultsDir, MODE_ALL);
    } catch (err3) {
        console.log('Couldn\'t create results dir: ' + err3);
    }

    if (inputOptions.coverage) {
        try {
            libfs.mkdirSync(coverageDir, MODE_ALL);
        } catch (err4) {
            console.log('Couldn\'t create results coverage dir: ' + err4);
        }
    }
}


/**
 * Merges results of the multiple runs.
 * Generates reports.
 * Prints output.
 */
function processResults() {
    var i,
        item,
        mergedJUnitXML,
        coverageResult,
        exitCode = 0;

    console.log();

    // merge JUnit XML
    mergedJUnitXML = '<?xml version="1.0" encoding="UTF-8"?><testsuites>';
    for (i = 0; i < collectedJUnitXML.length; i += 1) {
        item = collectedJUnitXML[i];
        item = item.replace(
            /^<\?xml version="1\.0" encoding="UTF-8"\?><testsuites>/,
            ''
        );
        item = item.replace(/<\/testsuites>$/, '');
        mergedJUnitXML += item;
    }
    mergedJUnitXML += '</testsuites>';
    utils.log('Test Results:\n' + libpath.normalize(resultsFile));
    libfs.writeFileSync(resultsFile, mergedJUnitXML, 'utf8');

    consoleTestReport(collectedResults, collectedFailures);
    if (collectedFailures.length) {
        exitCode = 1;
    }

    if (inputOptions.coverage) {
        coverageResult = Y.JSON.stringify(collectedCoverage);
        libfs.writeFileSync(coverageFile, coverageResult, 'utf8');
        utils.log('Creating coverage report...');
        // generate coverage reports in html
        // TODO:  find home for fixed path string
        exec('java -jar ' + ytcrJar +
             ' --format LCOV -o ' + coverageDir + ' ' + coverageFile,
            function(error, stdout, stderr) {
                if (inputOptions.verbose) {
                    utils.log('stdout: ' + stdout);
                    utils.log('stderr: ' + stderr);
                }
                if (error !== null) {
                    utils.error('exec error: ' + error);
                    process.exit(2);
                } else {
                    utils.log('Test Coverage Report:\n' +
                        libpath.normalize(coverageDir +
                            '/lcov-report/index.html')
                             );
                    // clear the old coverage reports
                    utils.removeDir(libfs.realpathSync(mojitoTmp));
                    libfs.rmdirSync(libfs.realpathSync(mojitoTmp));
                    utils.removeDir(libfs.realpathSync(mojitoInstrumentedDir));
                    libfs.rmdirSync(libfs.realpathSync(mojitoInstrumentedDir));
                    process.exit(exitCode);
                }
            });
    } else {
        process.exit(exitCode);
    }

}



function executeTestsWithinY(tests, cb) {

    var YUIInst,
        suiteName = '';

    function handleEvent(event) {
        switch (event.type) {
        case TestRunner.BEGIN_EVENT:
            preProcessor();
            break;

        case TestRunner.TEST_SUITE_BEGIN_EVENT:
            suiteName = event.testSuite.name;
            break;

        case TestRunner.TEST_FAIL_EVENT:
            collectFailure(suiteName, event);
            break;

        case TestRunner.COMPLETE_EVENT:
            TestRunner.unsubscribe(TestRunner.BEGIN_EVENT, handleEvent);
            TestRunner.unsubscribe(TestRunner.TEST_SUITE_BEGIN_EVENT,
                handleEvent);
            TestRunner.unsubscribe(TestRunner.TEST_FAIL_EVENT, handleEvent);
            TestRunner.unsubscribe(TestRunner.COMPLETE_EVENT, handleEvent);

            collectRunResults(event.results);

            if (cb) {
                cb();
            } else {
                processResults();
            }
            break;
        }
    }

    function testRunner(Y) {
        TestRunner.subscribe(TestRunner.BEGIN_EVENT, handleEvent);
        TestRunner.subscribe(TestRunner.TEST_SUITE_BEGIN_EVENT, handleEvent);
        TestRunner.subscribe(TestRunner.TEST_FAIL_EVENT, handleEvent);
        TestRunner.subscribe(TestRunner.COMPLETE_EVENT, handleEvent);
        TestRunner.run();
    }

    tests.push(testRunner);

    // Since TestRunner is a global, it will hang onto tests from previous
    // calls to executeTestsWithinY(), and re-run them each time.
    TestRunner.clear();

    // create new YUI instance using tests and mojito
    YUIInst = YUI({core: [
        'get',
        'features',
        'intl-base',
        'mojito'
    ]});

    YUIInst.use.apply(YUIInst, tests);
}


function instrumentDirectory(from, verbose, testType, callback) {
    utils.log('Instrumenting "' + from +
        '" for test coverage\n\t(this will take a while).');
    var opts = verbose ? ' -v' : '',
        realPathFrom = libfs.realpathSync(from),
        cmd = 'java -jar ' + ytcJar + ' ' + opts +
            ' -d -o ' + mojitoInstrumentedDir + ' ' + mojitoTmp,
        allMatcher,
        instrumentableJsMatcher;

    utils.removeDir(mojitoTmp);
    utils.removeDir(mojitoInstrumentedDir);

    if (verbose) {
        utils.log('copying ' + realPathFrom + ' to ' + mojitoTmp);
    }

    if (testType === 'app') { //copy everything to instrumented dir first
        allMatcher = utils.getExclusionMatcher([
            { pattern: /\.svn/, include: false },
            { pattern: /.*/, include: true }
        ], false);
        utils.copyUsingMatcher(realPathFrom, mojitoInstrumentedDir, allMatcher);
    }

    // create a matcher that will match only the JS files that need to be
    // instrumented
    instrumentableJsMatcher = utils.getExclusionMatcher(
        [
            /\barchetypes$/,
            /\bassets$/,
            /\.svn/,
            /-tests.js$/,
            /\btests\/harness$/,
            /\byuidoc$/,
            /\btests$/,
            /server\/management$/,
            { pattern: /\.js$/, include: true },
            { pattern: /\.json$/, include: true }, //needed for framework tests
            { pattern: /\/node_modules$/, include: false },
            // match all remaining directories for correct recursion
            { pattern: /.*/, type: 'dir', include: true }
        ],
        true
    ); //exclude stuff by default

    utils.copyUsingMatcher(realPathFrom, mojitoTmp, instrumentableJsMatcher);

    if (verbose) {
        utils.log(cmd);
    }

    exec(cmd, function(error, stdout, stderr) {
        if (verbose) {
            utils.log('coverage instrumentation finished for ' +
                mojitoInstrumentedDir);
        }
        var testsFrom = libpath.join(realPathFrom, 'lib/tests'),
            testsTo = libpath.join(mojitoInstrumentedDir, 'lib/tests'),
            packageFrom = libpath.join(mojitoTmp, 'package.json'),
            packageTo = libpath.join(mojitoInstrumentedDir, 'package.json'),
            cfgFrom = libpath.join(mojitoTmp, 'lib/config.json'),
            cfgTo = libpath.join(mojitoInstrumentedDir, 'lib/config.json'),
            dimFrom = libpath.join(mojitoTmp, 'lib/dimensions.json'),
            dimTo = libpath.join(mojitoInstrumentedDir, 'lib/dimensions.json'),
            nodeModulesFrom = libpath.join(realPathFrom, 'node_modules'),
            nodeModulesTo = libpath.join(mojitoInstrumentedDir, 'node_modules');
        if (verbose) {
            utils.log('stdout: ' + stdout);
            utils.log('stderr: ' + stderr);
        }
        if (error !== null) {
            utils.warn('exec error: ' + error);
        } else {
            if (verbose) {
                utils.log('Copy other files for testing');
            }

            if (testType === 'fw') {
                if (verbose) {
                    utils.log('copying non-js files to instrumented' +
                        ' coverage directory');
                }
                // copy remaining non-js files into instrumented directory
                copyExclude(nodeModulesFrom, nodeModulesTo, [/\.svn/]);
                copyExclude(testsFrom, testsTo, [/\.svn/]);
                copyFile(packageFrom, packageTo);
                copyFile(cfgFrom, cfgTo);
                copyFile(dimFrom, dimTo);
                callback();
            } else {
                callback();
            }
        }
    });
}


colorFactory = function(code) {
    function color(code, string) {
        return '\u001b[' + code + 'm' + string + '\u001b[0m';
    }
    return function(string) {
        return color(code, string);
    };
};


run = function(params, opts) {
    var artifactsDir = 'artifacts',
        testOption = params[0],
        dir = params[1],
        testName,
        stat;

    inputOptions = opts || {};

    if (inputOptions.tmpdir) {
        if (!existsSync(inputOptions.tmpdir)) {
            utils.warn('The temporary directory you specified does not exist.' +
                ' It will be created.');
            libfs.mkdirSync(inputOptions.tmpdir, MODE_ALL);
        }
        mojitoTmp = libpath.join(inputOptions.tmpdir, 'mojitotmp');
        mojitoInstrumentedDir = libpath.join(inputOptions.tmpdir, 'mojitoinst');
    }

    testStart = new Date().getTime();

    if (!existsSync(artifactsDir)) {
        libfs.mkdirSync(artifactsDir, MODE_ALL);
    }
    if (existsSync(resultsDir)) {
        utils.removeDir(libfs.realpathSync(resultsDir));
        libfs.rmdirSync(libfs.realpathSync(resultsDir));
    }
    libfs.mkdirSync(resultsDir, MODE_ALL);

    if (testOption === 'app' || testOption === 'mojit') {
        testName = params[2];
        if (!dir) {
            utils.error('Please specify ' + testOption + ' directory to test.',
                usage,
                true
                );
        }
        try {
            stat = libfs.statSync(dir);
            if (!stat.isDirectory()) {
                utils.error('"' + dir + '" is not a directory.', usage, true);
            }
        } catch (err) {
            utils.error('Invalid directory: \'' + dir + '\'', usage, true);
        }
        runTests({path: dir, type: testOption, name: testName});
    } else {
        utils.error('Invalid parameter.', usage, true);
    }
};

runTests = function(opts) {

    var i,
        ttn,
        targetTests,
        testName = opts.name,
        testType = opts.type || 'fw',
        path = libpath.resolve(opts.path),
        coverage = inputOptions.coverage,
        verbose = inputOptions.verbose,
        store,
        testRunner,
        runNext,

        testModuleNames = ['mojito', 'mojito-test'];

    testRunner = function(testPath) {
        var testConfigs,
            sourceConfigs;

        if (testType === 'mojit') {
            testConfigs = ymc(path);
            sourceConfigs = ymc(testPath, [/-tests.js$/]);
            // clobbering the original sources with instrumented sources
            Object.keys(sourceConfigs).forEach(function(k) {
                testConfigs[k] = sourceConfigs[k];
            });
            testConfigs['mojito-test'] = {
                fullpath: BASE + 'lib/app/autoload/mojito-test.common.js',
                requires: ['mojito']
            };
            testConfigs.mojito = {
                fullpath: BASE + 'lib/app/autoload/mojito.common.js'
            };
            YUI.applyConfig({
                modules: testConfigs
            });
        } else {
            store = Store.createStore({
                root: testPath,
                context: {},
                appConfig: { env: 'test' }
            });

            configureYUI(YUI, store);

            if (testType === 'fw') {
                testConfigs = store.yui.getConfigShared('server', {}, true).modules;
            } else if (testType === 'app') {
                testConfigs = merge(
                    store.yui.getConfigShared('server', {}, true).modules,
                    store.yui.getConfigAllMojits('server', {}).modules
                );
            }
        }

        // allowing multiple test names to be given
        if (testName) {
            targetTests = testName.indexOf(',') > 0 ?
                    testName.split(',') :
                    [testName];
        }

        Object.keys(testConfigs).forEach(function(name) {
            // if a test name filter is in effect, only run matching tests
            if (testName) {

                for (i = 0; i < targetTests.length; i += 1) {
                    ttn = targetTests[i];
                    if (testType === 'fw' && ttn.indexOf('mojito-') !== 0) {
                        ttn = 'mojito-' + ttn;
                    }
                    if (ttn === name || ttn + '-tests' === name) {
                        testModuleNames.push(name);
                    }
                }

            } else if (RX_TESTS.test(name)) {
                testModuleNames.push(name);
            }
        });

        if (!testModuleNames.length) {
            utils.error('No ' + testType + ' tests to run in ' + path +
                ' with test name \'' + testName + '\'', null, true);
        }

        global.YUITest = YUITest;

        // ensures all tests are run in the same order on any machine
        testModuleNames = testModuleNames.sort();

        if (testType === 'app') {

            // execute each test within new sandbox
            testModuleNames.forEach(function(name) {
                // only run tests, and not the frame mojit tests
                if (RX_TESTS.test(name) && name !== 'HTMLFrameMojit-tests') {
                    testQueue.push(name);
                }
            });

            runNext = function() {
                var cb = runNext,
                    next = testQueue.pop();

                // only run next if there is a next
                if (testQueue.length === 0) {
                    cb = null;
                }
                executeTestsWithinY([next, 'mojito-test'], cb);
            };

            if (testQueue.length) {
                runNext();
            }

        } else {
            executeTestsWithinY(testModuleNames);
        }

    };

    if (coverage) {
        instrumentDirectory(path, verbose, testType, function() {
            testRunner(mojitoInstrumentedDir);
        });
    } else {
        testRunner(path);
    }

};


/**
 * Add ability to skip tests without breaking.
 */
YUITest.Assert.skip = function() {
    YUITest.Assert._increment();
};


options = [
    {
        longName: 'coverage',
        shortName: 'c',
        hasValue: false
    },
    {
        longName: 'verbose',
        shortName: 'v',
        hasValue: false
    },
    {
        longName: 'tmpdir',
        shortName: 't',
        hasValue: true
    }
];


usage = 'Options: -c --coverage  Instruments code under test and prints ' +
    'coverage report\n' +
    '         -v --verbose   Verbose logging\n' +
    'To test a mojit:\n' +
    '    mojito test mojit ./path/to/mojit/directory\n' +
    'To test a Mojito app:\n' +
    '    mojito test app ./path/to/mojito/app/directory\n' +
    '    \n' +
    'NOTE: You cannot generate test coverage for a Mojito application,' +
    ' only individual mojits.';

/**
 */
exports.run = run;
/**
 */
exports.usage = usage;

/**
 */
exports.options = options;
