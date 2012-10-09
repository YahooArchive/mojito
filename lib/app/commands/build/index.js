/*jslint sloppy:true, stupid:true, node:true */

var path = require('path'),
    BASE = path.resolve(__dirname, '../../../../') + '/',
    CWD = process.cwd(),
    writer = require('./writer'),
    util = require(BASE + 'lib/management/utils'),
    M = require(BASE + 'lib/mojito'),
    Y = require('./yuiuse')({
        'escape': null,
        'json-parse': null,
        'json-stringify': null,
        'mojito-util': BASE + 'lib/app/autoload/util.common.js',
        'mojito-resource-store': BASE + 'lib/store.server.js'
    });

/**
 * normalize mojito application configuration object properties
 * @param {Object}
 * @param {String} type Build type, i.e. 'html5app'
 * @param {String} dir Path to create and copy build
 * @return {Object} normalized mojito application configuration object
 */
function config(conf, type, dir) {
    var bc; // shortcut to conf.builds[type]

    conf = conf || {};
    conf.specs = conf.specs || {};
    conf.tunnelPrefix = conf.tunnelPrefix || '/tunnel';

    // staticHandling
    conf.staticHandling = conf.staticHandling || {};
    conf.staticHandling.prefix = conf.staticHandling.prefix || '/static';

    // builds
    conf.builds = conf.builds || {};
    conf.builds[type] = bc = conf.builds[type] || {};
    bc.urls = bc.urls || [];

    if (dir) {
        // build dir from cli arg overrides app.json:build.buildDir
        bc.buildDir = path.resolve(dir);
    }

    if (!bc.hasOwnProperty('buildDir')) {
        // default build dir ./artifacts/builds/html5app
        bc.buildDir = path.resolve(CWD, 'artifacts/builds', type);
    }

    return conf;
}

/**
 * @param {Array} args Trailing cli arguments passed to cli.js
 * @param {Object} opts Parsed cli options like -c (see exports.options)
 * @param {Function} cb callback to cli.js, takes string parameter for errors
 */
function run(args, opts, cb) {
    var store,
        csvctx = util.contextCsvToObject, // shortcut
        context,
        appconf,
        builddir,
        buildtype = (args[0] + '').toLowerCase();

    switch (buildtype) {
    case 'html5app':
    case 'hybridapp':
        break;
    case 'undefined':
        die('Missing type');
    default:
        die('Invalid type');
    }

    if (!util.isMojitoApp(CWD)) {
        die('Not a Mojito directory');
    }

    context = typeof opts.context === 'string' ? csvctx(opts.context) : {};
    store = new Y.mojito.ResourceStore({root: CWD, context: context});
    appconf = config(store.getAppConfig(context), buildtype, args[1]);
    builddir = appconf.builds[buildtype].buildDir;

    function die(err) {
        cb(err, null, true);
    }

    function beforeWrite(file, str) {
        writer.write(file, str, false);
        writer.write(path.join(builddir, 'filelist.txt'), file + '\n', true);
    }

    function makeSnapshot(packages) {
        var data = {
                "name": opts.snapshotName || 'missing -n <snapshot name>',
                "tag": opts.snapshotTag || 'missing -t <snapshot tag>',
                "packages": packages
            },
            str = JSON.stringify(data, null, 4);

        beforeWrite(builddir + '/snapshot.json', str);
    }

    function next(err) {
        if (err) {
            return die('Error removing ' + builddir + "\n" + err);
        }

        var Build = require('./' + buildtype),
            build = new Build(appconf, buildtype, context, store);

        build.on('snapshot', makeSnapshot)
            .on('write', beforeWrite)
            .on('copy', writer.copy)
            .on('error', die)
            .on('warn', console.log)
            .on('info', console.log)
            .on('done', cb)
            .exec(M);
    }

    return opts.replace ? writer.rmrf(builddir, next) : next();
}

module.exports = {
    run: run,
    options: [
        {shortName: 'n', longName: 'snapshotName', hasValue: true},
        {shortName: 't', longName: 'snapshotTag', hasValue: true},
        {shortName: 'r', longName: 'replace', hasValue: false},
        {shortName: 'c', longName: 'context', hasValue: true},
        {shortName: 'm', longName: 'mojit', hasValue: true}
    ],
    usage: [
        'mojito build {type} [destination]',
        '',
        'type: "html5app" or "hybridapp"',
        'destination: (optional) the directory where the build output goes.',
        '  By default this is the type i.e. "./artifacts/builds/<type>"',
        '',
        'OPTIONS:',
        ' --replace: Tells the build system to delete the destination directory and replace it.',
        '        -r: Short for --replace',
        ' --context: Tells the build system what context to build with i.e. device=iphone&lang=en-GB.',
        '        -c: Short for --context\n'
    ].join("\n  ")
};
