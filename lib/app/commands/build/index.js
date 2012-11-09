/*jslint node:true, nomen:true */
'use strict';

var path = require('path'),
    qs = require('querystring'),

    BASE = path.resolve(__dirname, '../../../../') + '/',
    CWD = process.cwd(),

    writer = require('./writer'),
    util = require(BASE + 'lib/management/utils'),

    Y = util.yuiuse({
        'mojito-resource-store': BASE + 'lib/store.server.js'
    });


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
        app: {
            name: pkgmeta.pkg.name,
            version: pkgmeta.pkg.version,
            specs: appconf.specs || {},
            dir: pkgmeta.fs.rootDir // should be same as CWD
        },
        snapshot: {
            name: opts.snapshotName || '',
            tag: opts.snapshotTag || '',
            packages: dotbuild.snapshotPackages || {}
        },
        build: {
            attachManifest: dotbuild.attachManifest || false,
            forceRelativePaths: dotbuild.forceRelativePaths || false,
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
 * @param {Array} args Trailing cli arguments passed to cli.js
 * @param {Object} opts Parsed cli options like -c (see exports.options)
 * @param {Function} cb callback to cli.js, takes string parameter for errors
 */
function run(args, opts, cb) {
    var csvctx = util.contextCsvToObject, // shortcut
        buildtype = String(args[0]).toLowerCase(),
        store,
        conf;

    function die(err) {
        cb(err, null, true);
    }

    switch (buildtype) {
    case 'html5app':
        break;
    case 'hybridapp':
        if (!opts.snapshotName || !opts.snapshotTag) {
            die('Build hybridapp requires --snapshotName and --snapshotTag');
        }
        break;
    case 'undefined':
        die('Missing type');
        break;
    default:
        die('Invalid type');
    }

    if (!util.isMojitoApp(CWD)) {
        die('Not a Mojito directory');
    }

    // hash a cli context string like 'device:iphone,environment:test'
    opts.context = typeof opts.context === 'string' ? csvctx(opts.context) : {};

    // init resource store
    store = new Y.mojito.ResourceStore({root: CWD, context: opts.context});
    store.preload();

    // normalize inputs
    conf = getConfigs(opts, buildtype, args[1], store);

    function next(err) {
        if (err) {
            return die('Error removing ' + conf.build.dir + "\n" + err);
        }

        var Mojito = require(BASE + 'lib/mojito'),
            Scraper = require('./scraper'),
            Builder = require('./' + buildtype),
            builder = new Builder(writer, new Scraper(Mojito));

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
        {shortName: 'n', longName: 'snapshotName', hasValue: true},
        {shortName: 't', longName: 'snapshotTag', hasValue: true},
        {shortName: 'p', longName: 'port', hasValue: true}
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
