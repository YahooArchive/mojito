/*jslint sloppy:true, stupid:true, node:true */

var qs = require('querystring'),
    path = require('path'),
    Stream = require('stream'),
    Scraper = require('./scraper'),

    EXTNS = /\.(css|js|json)$/i,
    PORT = 1111;


function Html5app(appconf, buildtype, context, store) {

    this.appconf = appconf;

    this.buildtype = buildtype;
    this.builddir = appconf.builds[buildtype].buildDir; // shortcut

    this.context = context;
    this.contextqs = qs.stringify(this.context);
    if (this.contextqs.length) {
        this.contextqs = '?' + this.contextqs;
    }

    this.store = store;
}

function exec(mojito) {
    var me = this,
        buildmap = {},
        scraper = new Scraper(mojito);

    // init
    this.store.preload();

    // init the map of mojito-http to filesystem uris
    // this is rm'd for crt, but used for docs
    buildmap['/' + this.contextqs] = '/index.html';

    // add uris enumerated in application.json
    this.appconf.builds[this.buildtype].urls.forEach(function (uri) {
        buildmap[uri + me.contextqs] = uri;
    });

    // add uris for mojito and app internals to buildmap
    this.mapStoreUris(buildmap);

    // add tunnel uris to buildmap
    this.mapDefxUris(buildmap);

    // add uris to buildmap from legacy mojit ids that have spec file parts
    this.mapFunkySpecUris(buildmap);

    // create a couple files
    this.makeManifest(buildmap, this.builddir);
    this.makeIndexJs(path.join(this.builddir, 'index.js'));

    // use buildmap to scrape mojito server and save the rendered pages
    scraper
        .on('scraped-one', this.mungePage.bind(this))
        .on('scraping-done', this.emit.bind(this, 'done'))
        .on('error', this.emit.bind(this, 'error'))
        .on('warn', this.emit.bind(this, 'warn'))
        .on('info', this.emit.bind(this, 'info'))
        .start({port: PORT, context: this.context})
        .fetch(buildmap);
}

// add store uris
function mapStoreUris(buildmap) {
    var from, to, uri, storemap = this.store.getAllURLs();

    for (uri in storemap) {
        if (storemap.hasOwnProperty(uri)) {
            from = storemap[uri]; // filesystem path
            to = path.join(this.builddir, uri);

            if (uri.match(EXTNS)) {
                buildmap[uri + this.contextqs] = uri;
            } else {
                this.emit('copy', from, to);
            }
        }
    }
}

// add <mojit>/definition.json tunnel uris to buildmap
function mapDefxUris(buildmap) {
    var opts = {type: 'mojit'},
        mojits = this.store.getResources('client', this.context, opts),
        mojit,
        i,
        uri,
        snapshot = {};

    for (i in mojits) {
        if (mojits.hasOwnProperty(i)) {
            mojit = mojits[i];
            if (mojit.source.pkg.depth < 999) {
                snapshot[mojit.name] = mojit.source.pkg.version;
            }
            uri = mojit.url + '/definition.json';
            buildmap[this.appconf.tunnelPrefix + uri + this.contextqs] = uri;
            this.mapSpecUris(buildmap, mojit.name);
        }
    }

    this.emit('snapshot', snapshot);
}

// 1. add <mojit>/specs/default(?).json tunnel uris to buildmap
// 2. create mojit package info aka "snapshot"
function mapSpecUris(buildmap, name) {
    var opts = {type: 'spec', mojit: name},
        specs = this.store.getResources('client', this.context, opts),
        tunnelpf = this.appconf.tunnelPrefix,
        qs = this.contextqs;

    Object.keys(specs).forEach(function (spec) {
        if (spec.url) {
            buildmap[tunnelpf + spec.url + qs] = spec.url;
        }
    });
}

// add funky mojit spec uris to buildmap
// i.e. "foo:bar" -> <mojit>/specs/bar.json
function mapFunkySpecUris(buildmap) {
    var staticpf = this.appconf.staticHandling.prefix,
        tunnelpf = this.appconf.tunnelPrefix,
        qs = this.contextqs;

    Object.keys(this.appconf.specs).forEach(function (id) {
        var parts = id.split(':'),
            type = parts[0],
            name = parts[1] || 'default',
            uri = [null, staticpf, type, 'specs', name + '.json'].join('/');

        buildmap[tunnelpf + uri + qs] = uri;
    });
}

function makeManifest(uris, dir, stamp) {
    var lines = ['CACHE MANIFEST', '# ' + (stamp || new Date()), 'CACHE:'];
    Object.keys(uris).forEach(function (i) {
        lines.push(uris[i]);
    });
    this.emit('write', path.join(dir, 'cache.manifest'), lines.join("\n"));
}

function makeIndexJs(file) {
    this.emit('write', file, 'module.exports = require("express")' +
        '.createServer(require("express")["static"](__dirname));');
}

function injectManifestAttr(uri, str) {
    var rel = path.relative(path.dirname(uri), '/cache.manifest'),
        rgx = /(<html[\s\S]*?)>/i;
    return str.replace(rgx, '$1 manifest="' + rel + '">');
}

function forceRelativePaths(uri, str) {
    var rgx = /(src|href)="(\/\S+?)"/g,
        dir = path.dirname(uri);
    /*jslint unparam: true */
    return str.replace(rgx, function (matched, tag, val) {
        return tag + '="' + path.relative(dir, val) + '"';
    });
}

// post-process .html file contents
function mungePage(mapuri, contents) {
    var uri = mapuri === '/' ? '/index.html' : mapuri,
        conf = this.appconf.builds[this.buildtype],
        file = path.join(this.builddir, uri);

    if (/\.html$/i.test(uri)) {
        if (conf.attachManifest) {
            contents = injectManifestAttr(uri, contents);
        }
        if (conf.forceRelativePaths) {
            contents = forceRelativePaths(uri, contents);
        }
    }

    this.emit('write', file, contents);
}

Html5app.prototype = Object.create(Stream.prototype, {
    exec: {value: exec},
    mapStoreUris: {value: mapStoreUris},
    mapDefxUris: {value: mapDefxUris},
    mapSpecUris: {value: mapSpecUris},
    mapFunkySpecUris: {value: mapFunkySpecUris},
    makeManifest: {value: makeManifest},
    makeIndexJs: {value: makeIndexJs},
    mungePage: {value: mungePage}
});

module.exports = Html5app;
