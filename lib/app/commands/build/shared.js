/*jslint node:true */
'use strict';

var wr, // writer.js file system related functions or test stub
    path = require('path'),
    STORE_EXT_RE = /\.(css|js|json)$/i,
    MUNGE_EXT_RE = /\.html?$/i;


function init(writer) {
    wr = writer; // module ./writer.js containing static filesystem functions
}

function copydir(from, to) {
    wr.copydir(from, to);
}

function copyModule(src_dir, module_name, dest_dir) {
    var from = path.join(src_dir, 'node_modules', module_name),
        to = path.join(dest_dir, module_name);

    copydir(from, to);
}

// add uris from resource store to buildmap, copy some to build dir
function mapStoreUris(buildmap, conf, storemap) {
    Object.keys(storemap).forEach(function (uri) {
        var from, to;
        if (uri.match(STORE_EXT_RE)) {
            buildmap[uri + conf.contextqs] = uri;
        } else {
            from = storemap[uri]; // source mojito app filesystem path
            to = path.join(conf.build.dir, uri);
            wr.copy(from, to);
        }
    });
}

// add <mojit>/specs/default(?).json tunnel uris to buildmap
function mapSpecUris(buildmap, conf, name, store) {
    var opts = {type: 'spec', mojit: name},
        specs = store.getResources('client', conf.context, opts);

    Object.keys(specs).forEach(function (spec) {
        if (spec.hasOwnProperty('url')) { // see mapDefxUris [urls] comment
            buildmap[conf.tunnelpf + spec.url + conf.contextqs] = spec.url;
        }
    });
}

// add /tunnel/*/definition.json uris to buildmap
function mapDefxUris(buildmap, conf, store) {
    var mojits = store.getResources('client', conf.context, {type: 'mojit'});

    mojits.forEach(function (mojit) {
        var uri;
        /* [urls] note not all client mojits are url-addressable; resources in
           "app-level" (aka shared) mojits get uris via a special RS mojit named
           "Shared", not via the mojit they came in */
        if (mojit.hasOwnProperty('url')) {
            uri = mojit.url + '/definition.json';
            buildmap[conf.tunnelpf + uri + conf.contextqs] = uri;
            mapSpecUris(buildmap, conf, mojit.name, store);
        }
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
    wr.write(path.join(dir, 'cache.manifest'), lines.join("\n"));
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

function insertCharset(charset, str) {
    /*jslint regexp: true */
    var newtag = '<meta charset="' + charset + '">\n',
        hastag = /meta\b[^>]+charset=.*>/i.test(str);

    return hastag ? str : str.replace(/(<head[\S\s]*?>)/i, '$1\n' + newtag);
}

// post-process .html file contents
function mungePage(conf, mapuri, contents) {
    var uri = mapuri === '/' ? '/index.html' : mapuri,
        file = path.join(conf.build.dir, uri);

    if (MUNGE_EXT_RE.test(uri)) {
        if (conf.build.attachManifest) {
            contents = injectManifestAttr(uri, contents);
        }
        if (conf.build.forceRelativePaths) {
            contents = forceRelativePaths(uri, contents);
        }
        if (conf.build.insertCharset) {
            contents = insertCharset(conf.build.insertCharset, contents);
        }
    }

    wr.write(file, contents);
    return contents;
}

module.exports = {
    init: init,
    copyModule: copyModule,
    mapStoreUris: mapStoreUris,
    mapDefxUris: mapDefxUris,
    mapFunkySpecUris: mapFunkySpecUris,
    makeManifest: makeManifest,
    mungePage: mungePage
};
