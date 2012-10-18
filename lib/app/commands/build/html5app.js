/*jslint sloppy:true, stupid:true, node:true */

var path = require('path'),
    func = require('./shared');


function exec(conf, store, cb) {
    var buildmap = {};

    // this is rm'd for crt, but used for docs
    buildmap['/' + conf.contextqs] = '/index.html';

    // add uris enumerated in application.json
    conf.build.uris.forEach(function (uri) {
        buildmap[uri + conf.contextqs] = uri;
    });

    // add uris for mojito and app internals to buildmap
    func.mapStoreUris(buildmap, conf, store.getAllURLs() || {});

    // add tunnel uris to buildmap
    func.mapDefxUris(buildmap, conf, store);

    // add uris from legacy mojit ids that have spec file parts to buildmap
    func.mapFunkySpecUris(buildmap, conf);

    // create a couple files
    func.makeManifest(buildmap, conf.build.dir, new Date());

    // use buildmap to scrape mojito server and save the rendered pages
    this.scraper
        .on('scraped-one', func.mungePage.bind(this, conf))
        .on('scraping-done', cb)
        .start({port: conf.build.port, context: conf.context})
        .fetch(buildmap, cb);
}

function Html5app(writer, scraper) {
    func.init(writer);
    this.scraper = scraper;
}

Html5app.prototype.exec = exec;

module.exports = Html5app;
