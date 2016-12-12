/*jslint node:true, nomen:true, stupid: true */
'use strict';

var libpath = require('path'),
    libfs = require('fs'),
    existsSync = libfs.existsSync || libpath.existsSync,

    BASE = libpath.resolve(__dirname, '../../../') + '/',
    CWD = process.cwd(),

    YUIFactory = require(BASE + 'lib/yui-sandbox'),
    Store = require(BASE + 'lib/store'),
    util = require(BASE + 'lib/management/utils'),

    Benchmark = require('benchmark').Benchmark,
    Benchtable = require('benchtable');

function getYUIInstance(store, testName) {

    var YUI,
        Y,
        mojits = store.yui.getConfigAllMojits('server', {}),
        shared = store.yui.getConfigShared('server', {}, false),
        modules;

    YUI = YUIFactory.getYUI();

    /*
     * this synthetic module defines two ways to do
     * benchmarking, by using the row implementation,
     * or the table implementation which allows us to
     * do more advanced things with multiple datasets.
     * Only one of them should be used by a benchmark
     * test.
     */
    YUI.add('mojito-benchmark', function (Y, NAME) {

        var suite,
            suiteTable;

        // enabling benchmark suite

        suite = Y.BenchmarkSuite = Benchmark.Suite(testName);

        suite.on('start', function () {
            util.log('Starting benchmarks.');
        });

        suite.on('cycle', function (event) {
            if (!event.target.error) {
                util.log(String(event.target));
            }
        });

        suite.on('error', function (event) {
            util.error(String(event.target) + String(event.target.error));
        });

        suite.on('complete', function (event) {
            util.warn('Fastest is ' + this.filter('fastest').pluck('name'));
        });

        // enabling benchtable suite

        suiteTable = Y.BenchtableSuite = new Benchtable(testName);

        suiteTable.on('start', function () {
            util.log('Starting benchmarks.');
        });

        suiteTable.on('cycle', function (event) {
            if (!event.target.error) {
                util.log(String(event.target));
            }
        });

        suiteTable.on('error', function (event) {
            util.error(String(event.target) + String(event.target.error));
        });

        suiteTable.on('complete', function (event) {
            util.warn('Fastest is ' + this.filter('fastest').pluck('name'));
            util.log(this.table.toString());
        });

    });

    Y = YUI({
        useSync: true
    });

    modules = Y.merge((mojits.modules || {}), (shared.modules || {}));

    Y.applyConfig({
        modules: modules
    });

    return Y;

}

/**
 * Standard run method hook export.
 * @method run
 * @param {Array} args Trailing cli arguments passed to cli.js
 * @param {Object} opts Parsed cli options like --context (see exports.options)
 * @param {Function} cb callback to cli.js, takes string parameter for errors
 */
function run(args, opts, cb) {

    var csvctx = util.contextCsvToObject, // shortcut
        store,
        conf = {
            modules: {}
        },
        file = args[0] && libpath.resolve(CWD, args[0]),
        name = file && libpath.basename(file, '.js'),
        Y;

    function die(err) {
        cb(err, exports.usage, true);
    }

    if (!util.isMojitoApp(CWD)) {
        die('Not a Mojito directory');
    }

    if (!file || !existsSync(file)) {
        die('Invalid argument with the path to the benchmark script: ' + file);
    }

    // hash a cli context string like 'device:iphone,environment:test'
    opts.context = typeof opts.context === 'string' ? csvctx(opts.context) : {};

    // init resource store
    store = Store.createStore({
        root: CWD,
        context: opts.context
    });

    // normalize inputs
    Y = getYUIInstance(store, name);

    util.log('Benchmarking YUI module ' + name + ' [' + file + ']');

    conf.modules[name] = {
        fullpath: file
    };

    Y.applyConfig(conf);
    Y.use(name);

    if (Y.BenchmarkSuite) {
        try {
            Y.BenchmarkSuite.run();
            Y.BenchtableSuite.run();
        } catch (e) {
            die('Internal error while executing the benchmark module: ' +
                name + '\n' + e);
        }
    } else {
        die('Invalid benchmark module: ' + name);
    }

}

/**
 * Standard usage string export.
 */
exports.usage = [
    'mojito benchmark {file} [options]',
    '',
    'Example: mojito benchmark ./benchmark/foo-benchmark.js',
    "  (execute a global benchmark test)",
    '',
    'Example: mojito benchmark ./mojit/bar/tests/benchmark/bar-benchmark.js',
    '  (execute a mojit benchmark test)',
    '',
    'Example: mojito benchmark baz.js --context environment:development',
    '  (execute a custom benchmark test with a custom context)',
    '',
    'NOTES:',
    '  * The name of the yui module that defines the benchmark test should',
    '    match the filename. In the first example, the test should be defined',
    '    as `YUI.add("foo-benchmark", function (Y) {/*...*/});`, otherwise',
    '    the test will fail.',
    '  * Any yui module from yui core, mojito core or application level module',
    '    that runs on the server runtime could be required as part of the',
    '    "requires" array in the benchmark test without any extra configuration.',
    '  * If you want to require a yui module that is meant to run in the client',
    '    runtime, make sure you specify the proper --context option.',
    '',
    'OPTIONS: ',
    '  --context [string]  A comma-separated list of key:value pairs',
    '                      that define the base context used to read',
    '                      configuration files'].join("\n");

/**
 * Standard options list export.
 */
exports.options = [
    {
        longName: 'context',
        shortName: null,
        hasValue: true
    }
];

exports.run = run;