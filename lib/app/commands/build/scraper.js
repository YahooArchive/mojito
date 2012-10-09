/*jslint sloppy:true, stupid:true, node:true */

var Stream = require('stream');

function Scaper(mojito) {
    this.mojito = mojito;
    this.server = null;
}

function start(opts) {
    this.server = this.mojito.createServer(opts);
    return this;
}

function fetch(buildmap, cb) {
    var me = this;

    this.server.listen(null, null, function (err) {
        var keys = Object.keys(buildmap),
            have = 0,
            failed = 0,
            need = keys.length,
            opts = {headers: {'x-mojito-build': 'html5app'}};

        if (err) {
            me.emit('error', err);
            return cb('Failed to start server.');
        }

        keys.forEach(function (key) {
            me.server.getWebPage(key, opts, function (err, uri, content) {
                if (err) {
                    failed += 1;
                    me.emit('warn', 'FAILED to get ' + uri);
                } else {
                    me.emit('scraped-one', buildmap[uri], content);
                }

                have += 1;
                if (have === need) {
                    me.server.close();
                    me.emit('scraping-done');
                }
            });
        });
    });
}

Scaper.prototype = Object.create(Stream.prototype, {
    start: {value: start},
    fetch: {value: fetch}
});

module.exports = Scaper;
