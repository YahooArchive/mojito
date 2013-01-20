/*jslint node:true */
'use strict';

var path = require('path'),
    fn = require('./shared'),
    wr; // writer.js file system related functions or test stub


function copyProperties(from, into) {
    Object.keys(from).forEach(function (key) {
        into[key] = from[key];
    });
}

/**
 * mungePackageJson copies over the application's package.json, and changes the
 * dependencies as follows:
 * - removes "mojito"
 * - merges in application.json build config's "packages" object.
 * @param {Object} conf Build configs, defined in index.js getConfigs().
 * @param {String} to Path to app within build/output directory.
 */
function mungePackageJson(conf, to) {
    var name = 'package.json',
        file = path.join(conf.app.dir, name),
        data = JSON.parse(wr.read(file));

    if (!data.hasOwnProperty('dependencies')) {
        data.dependencies = conf.snapshot.packages;
    } else {
        copyProperties(conf.snapshot.packages, data.dependencies);
    }

    if (data.dependencies.hasOwnProperty('mojito')) {
        delete data.dependencies.mojito;
    }

    wr.writeJson(path.join(to, name), data);
}

/**
 * makeSnapshot creates the build snapshot.json file.
 * @param {Object} conf Build configs, defined in index.js getConfigs().
 */
function makeSnapshot(conf) {
    var file = path.join(conf.build.dir, 'snapshot.json'),
        snap = {
            'name': conf.snapshot.name,
            'tag': conf.snapshot.tag,
            'packages': conf.snapshot.packages
        };

    snap.packages[conf.app.name] = conf.app.version;
    wr.writeJson(file, snap);
}

/**
 * @constructor
 * @param {Object} writer
 * @param {Object} scraper
 */
function Hybridapp(writer, scraper) {
    wr = writer;
    fn.init(writer);
    this.scraper = scraper;
}

/**
 * @param {Object} conf Build configs, defined in index.js getConfigs().
 * @param {Object} store An instance of the resource store; post preload().
 * @param {Function} cb Callback to invoke on completion.
 */
Hybridapp.prototype.exec = function exec(conf, store, cb) {
    var buildmap = {};

    // add uris enumerated in application.json to buildmap
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
    mungePackageJson(conf, path.join(conf.build.dir, conf.staticpf));

    // make a snapshot file for the CRT updater
    makeSnapshot(conf);

    // use buildmap to scrape mojito server and save the rendered pages
    this.scraper
        .on('scraped-one', fn.mungePage.bind(this, conf))
        .on('scraping-done', cb)
        .start({port: conf.build.port, context: conf.context})
        .fetch(buildmap, cb);
};

module.exports = Hybridapp;
