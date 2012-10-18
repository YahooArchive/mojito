/*jslint sloppy:true, stupid:true, node:true */
/*jslint nomen:true */ // node:true doesn't seem to register __dirname :(

var path = require('path'),
    qs = require('querystring'),

    BASE = path.resolve(__dirname, '../../../../') + '/',
    CWD = process.cwd(),

    writer = require('./writer'),
    util = require(BASE + 'lib/management/utils'),

    Y = require('./yuiuse')({
        'escape': null,
        'json-parse': null,
        'json-stringify': null,
        'mojito-util': BASE + 'lib/app/autoload/util.common.js',
        'mojito-resource-store': BASE + 'lib/store.server.js'
    });


function getConfigs(opts, buildtype, builddir, store) {
    var appconf = store.getAppConfig(opts.context) || {/* no app.json? */},
        pkgmeta = store.getResourceVersions({name: 'application'})[0].source.pkg,
        contextqs = qs.stringify(opts.context), // context as uri query string
        dotbuild; // shortcut to appconf.builds[buildtype]

    // define missing build obj properties
    dotbuild = (appconf.builds && appconf.builds[buildtype]) || {};
    dotbuild.urls = dotbuild.urls || [];

    // define missing staticHandling.prefix
    appconf.staticHandling = appconf.staticHandling || {};
    appconf.staticHandling.prefix = appconf.staticHandling.prefix || '/static';

    if (builddir) {
        // override application.json:builds[buildtype].buildDir with cli arg
        dotbuild.buildDir = path.resolve(builddir);
    }

    if (!dotbuild.hasOwnProperty('buildDir')) {
        // use default build dir ./artifacts/builds/html5app
        dotbuild.buildDir = path.resolve(CWD, 'artifacts/builds', buildtype);
    }

    // ok, we should have all the inputs we need to proceed with any build
    return {
        app: {
            name: pkgmeta.name,
            version: pkgmeta.version,
            specs: appconf.specs || {}
        },
        snapshot: {
            name: opts.snapshotName || 'missing --snapshotName',
            tag: opts.snapshotTag || 'missing --snapshotTag'
        },
        build: {
            attachManifest: dotbuild.attachManifest,
            forceRelativePaths: dotbuild.forceRelativePaths,
            port: opts.port || 1111,
            dir: dotbuild.buildDir,
            type: buildtype,
            uris: dotbuild.urls || []
        },
        context: opts.context,
        contextqs: contextqs.length ? '?' + contextqs : '',
        tunnelpf: appconf.tunnelPrefix || '/tunnel',
        staticpf: appconf.staticHandling.prefix
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
    case 'hybridapp':
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
        {shortName: 'n', longName: 'snapshotName', hasValue: true},
        {shortName: 't', longName: 'snapshotTag', hasValue: true},
        {shortName: 'p', longName: 'port', hasValue: true},
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
