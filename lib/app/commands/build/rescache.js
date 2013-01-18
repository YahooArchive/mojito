/*jslint node:true */
'use strict';


function ResCache(writer, scraper) {}

ResCache.prototype.exec = function exec(conf, store, cb) {
    store.resourceCacheSave();
    cb();
};

module.exports = ResCache;
