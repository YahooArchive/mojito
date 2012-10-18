/*jslint sloppy:true, stupid:true, node:true */

var path = require('path'),
    fn = require('./shared'),
    fl;

function copyPackageJson(from, to) {
    var name = 'package.json';
    fl.copy(path.join(from, name), path.join(to, name));
}

function makeSnapshot(conf) {
    var file = path.join(conf.build.dir, 'snapshot.json'),
        snap = {
            'name': conf.snapshot.name,
            'tag': conf.snapshot.tag,
            'packages': {'yahoo.libs.yui': '*' /* hardcoded for now */}
        };

    snap.packages[conf.app.name] = conf.app.version;
    fl.write(file, JSON.stringify(snap, null, 4));
}

function exec(conf, store, cb) {
    var buildmap = {};

    // add uris enumerated in application.json
    conf.build.uris.forEach(function (uri) {
        buildmap[uri + conf.contextqs] = uri;
    });

    // add uris for mojito and app internals to buildmap
    fn.mapStoreUris(buildmap, conf, store.getAllURLs() || {});

    // add tunnel uris to buildmap
    fn.mapDefxUris(buildmap, conf, store);

    // add uris from legacy mojit ids that have spec file parts to buildmap
    fn.mapFunkySpecUris(buildmap, conf);

    // copy mojito app's package.json to path/to/builddir/<static>/
    copyPackageJson(conf.app.dir, path.join(conf.build.dir, conf.staticpf));

    // make a snapshot file for the CRT updater
    makeSnapshot(conf);

    // use buildmap to scrape mojito server and save the rendered pages
    this.scraper
        .on('scraped-one', fn.mungePage.bind(this, conf))
        .on('scraping-done', cb)
        .start({port: conf.build.port, context: conf.context})
        .fetch(buildmap, cb);
}

function Hybridapp(writer, scraper) {
    fl = writer;
    fn.init(writer);
    this.scraper = scraper;
}

Hybridapp.prototype.exec = exec;

module.exports = Hybridapp;
