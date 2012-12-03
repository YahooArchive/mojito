/*jslint node:true */
'use strict';

var path = require('path'),
    fn = require('./shared');


function Html5app(writer, scraper) {
    fn.init(writer);
    this.scraper = scraper;
}

Html5app.prototype.exec = function exec(conf, store, cb) {
    var buildmap = {};

    // this is rm'd for crt, but used for docs
    buildmap['/' + conf.contextqs] = '/index.html';

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

    // create a couple files
    fn.makeManifest(buildmap, conf.build.dir, new Date());

    // copy path/to/mojito/node_modules/yui to build dir ./static
    fn.copyModule(conf.mojitodir, 'yui', path.join(conf.build.dir, conf.staticpf));

    // use buildmap to scrape mojito server and save the rendered pages
    this.scraper
        .on('scraped-one', fn.mungePage.bind(this, conf))
        .on('scraping-done', cb)
        .start({port: conf.build.port, context: conf.context})
        .fetch(buildmap, cb);
};

module.exports = Html5app;
