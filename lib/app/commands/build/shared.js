/*jslint sloppy:true, stupid:true, node:true */

var path = require('path'),
    fw, // ./writer.js module containing static filesystem functions
    EXTNS = /\.(css|js|json)$/i,
    PORT = 1111;

function init(writer) {
	fw = writer;
}

// add uris from resource store to buildmap, copy some to build dir
function mapStoreUris(buildmap, conf, storemap) {
    Object.keys(storemap).forEach(function (uri) {
        var from, to;
        if (uri.match(EXTNS)) {
            buildmap[uri + conf.contextqs] = uri;
        } else {
            from = storemap[uri]; // source mojito app filesystem path
            to = path.join(conf.build.dir, uri);
            fw.copy(from, to);
        }
    });
}

// add <mojit>/specs/default(?).json tunnel uris to buildmap
function mapSpecUris(buildmap, conf, name, store) {
    var opts = {type: 'spec', mojit: name},
        specs = store.getResources('client', conf.context, opts);

    Object.keys(specs).forEach(function (spec) {
        buildmap[conf.tunnelpf + spec.url + conf.contextqs] = spec.url;
    });
}

// add <mojit>/definition.json tunnel uris to buildmap
function mapDefxUris(buildmap, conf, store) {
    var mojits = store.getResources('client', conf.context, {type: 'mojit'});

    mojits.forEach(function (mojit) {
        var uri = mojit.url + '/definition.json';
        buildmap[conf.tunnelpf + uri + conf.contextqs] = uri;
        mapSpecUris(buildmap, conf, mojit.name, store);
    });
}

// add funky mojit spec uris to buildmap
// i.e. "foo:bar" -> <mojit>/specs/bar.json
function mapFunkySpecUris(buildmap, conf) {
    Object.keys(conf.app.specs).forEach(function (id) {
        var parts = id.split(':'),
            type = parts[0],
            name = (parts[1] || 'default') + '.json',
            uri = [null, conf.staticpf, type, 'specs', name].join('/');

        buildmap[conf.tunnelpf + uri + conf.contextqs] = uri;
    });
}

function makeManifest(uris, dir, stamp) {
    var lines = ['CACHE MANIFEST', '# ' + stamp, 'CACHE:'];
    Object.keys(uris).forEach(function (i) {
        lines.push(uris[i]);
    });
    fw.write(path.join(dir, 'cache.manifest'), lines.join("\n"));
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
function mungePage(conf, mapuri, contents) {
    var uri = mapuri === '/' ? '/index.html' : mapuri,
        file = path.join(conf.build.dir, uri);

    if (/\.html$/i.test(uri)) {
        if (conf.build.attachManifest) {
            contents = injectManifestAttr(uri, contents);
        }
        if (conf.build.forceRelativePaths) {
            contents = forceRelativePaths(uri, contents);
        }
    }

    fw.write(file, contents);
}

module.exports = {
    init: init,
    mapStoreUris: mapStoreUris,
    mapDefxUris: mapDefxUris,
    mapFunkySpecUris: mapFunkySpecUris,
    makeManifest: makeManifest,
    mungePage: mungePage    
};
