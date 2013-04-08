/*jslint node:true, nomen:true */
'use strict';

var path = require('path'),
    qs = require('querystring'),

    BASE = path.resolve(__dirname, '../../../../') + '/',
    CWD = process.cwd(),

    writer = require('./writer'),
    Store = require(BASE + 'lib/store'),
    util = require(BASE + 'lib/management/utils'),

    Mojito = require(BASE + 'lib/mojito'),
    Scraper = require('./scraper'),
    Builder = require('./html5app');


function getConfigs(opts, buildtype, builddir, store) {
    var appconf = store.getAppConfig(opts.context) || {/* no app.json? */},
        pkgmeta = store.getResourceVersions({name: 'package'})[0].source,
        contextqs = qs.stringify(opts.context), // context as uri query string
        dotbuild; // shortcut to appconf.builds[buildtype]

    // define required parent properties, if missing
    dotbuild = (appconf.builds && appconf.builds[buildtype]) || {};
    dotbuild.urls = dotbuild.urls || [];
    appconf.staticHandling = appconf.staticHandling || {};

    if (builddir) {
        // override application.json:builds[buildtype].buildDir with cli arg
        dotbuild.buildDir = path.resolve(builddir);
    }

    if (!dotbuild.hasOwnProperty('buildDir')) {
        // use default build dir ./artifacts/builds/html5app
        dotbuild.buildDir = path.resolve(CWD, 'artifacts/builds', buildtype);
    }

    // ok, we should have all the inputs we need to proceed with any build
    // apply some default for anything that may be undefined
    return {
        mojitodir: BASE,
        app: {
            name: pkgmeta.pkg.name,
            version: pkgmeta.pkg.version,
            specs: appconf.specs || {},
            dir: pkgmeta.fs.rootDir // should be same as CWD
        },
        snapshot: {
            name: opts.snapshotName || '',
            tag: opts.snapshotTag || '',
            packages: dotbuild.packages || {}
        },
        build: {
            attachManifest: dotbuild.attachManifest || false,
            forceRelativePaths: dotbuild.forceRelativePaths || false,
            insertCharset: dotbuild.insertCharset || 'UTF-8',
            port: opts.port || 1111,
            dir: dotbuild.buildDir,
            type: buildtype,
            uris: dotbuild.urls || []
        },
        context: opts.context,
        contextqs: contextqs.length ? '?' + contextqs : '',
        tunnelpf: appconf.tunnelPrefix || '/tunnel',
        staticpf: appconf.staticHandling.prefix || '/static'
    };
}

/**
 * Invoked by cli.js. Checks and normalizes input, optionally deletes
 * destination dir, then invokes subcommand html5app.js.
 * @method run
 * @param {Array} args Trailing cli arguments passed to cli.js
 * @param {Object} opts Parsed cli options like -c (see exports.options)
 * @param {Function} cb Callback params are: [errmsg], [show_usage], [die]
 */
function run(args, opts, cb) {
    var csvctx = util.contextCsvToObject, // shortcut
        buildtype = String(args[0]).toLowerCase(),
        store,
        conf;

    switch (buildtype) {
    case 'html5app':
        break;
    case undefined:
        return cb('Missing type', null, true);
    default:
        return cb('Invalid type', null, true);
    }

    if (!util.isMojitoApp(CWD)) {
        return cb('Not a Mojito directory', null, true);
    }

    // hash a cli context string like 'device:iphone,environment:test'
    opts.context = typeof opts.context === 'string' ? csvctx(opts.context) : {};

    // init resource store
    store = Store.createStore({
        root: CWD,
        context: opts.context
    });

    // normalize inputs
    conf = getConfigs(opts, buildtype, args[1], store);

    function next(err) {
        if (err) {
            return cb('Error removing ' + conf.build.dir + "\n" + err, null, true);
        }

        var builder = new Builder(writer, new Scraper(Mojito));
        builder.exec(conf, store, cb);
    }

    return opts.replace ? writer.rmrf(conf.build.dir, next) : next();
}

module.exports = {
    run: run,
    options: [
        {shortName: 'c', longName: 'context', hasValue: true},
        {shortName: 'm', longName: 'mojit', hasValue: true},
        {shortName: 'r', longName: 'replace', hasValue: false},
        {shortName: 'p', longName: 'port', hasValue: true}
    ],
    usage: [
        'mojito build {type} [destination]',
        '',
        'type: "hybridapp" is currently the only valid type',
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
