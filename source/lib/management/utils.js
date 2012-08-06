/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/


var fs = require('fs'),
    util = require('util'),
    mu = require('../app/libs/Mulib/Mu'),
    path = require('path'),
    http = require('http'),
    tty = require('tty'),
    spawn = require('child_process').spawn;
    mojito = require('../index.js'),
    httpProxy = require('http-proxy'),
    sockjs = require('sockjs'),
    archetypes_dir = path.join(__dirname, '/../archetypes'),
    isatty = tty.isatty(1) && tty.isatty(2);

var _ = require('../libs/underscore.js');
var server_handle;
var request_queue = [];

// status to monitor code change.
var Status = {
    running: false, // is server running now?
    crashing: false, // does server crash whenever we start it?
    listening: false, // do we expect the server to be listening now.
    counter: 0, // how many crashes in rapid succession

    reset: function () {
        this.crashing = false;
        this.counter = 0;
    },

    hard_crashed: function () {
        log("Your application is crashing. Waiting for file change.");
        this.crashing = true;
    },

    soft_crashed: function () {
        if (this.counter === 0)
            setTimeout(function () {
                this.counter = 0;
            }, 2000);

        this.counter++;

        if (this.counter > 2) {
            Status.hard_crashed();
        }
    }
};
var watcher;


if (!isatty) {
    // fake out the getters that the "color" library would have added
    (['bold', 'underline', 'italic', 'inverse', 'grey', 'yellow', 'red',
        'green', 'blue', 'white', 'cyan', 'magenta']).forEach(function(style) {
        Object.defineProperty(String.prototype, style, {
            get: function() {
                return this;
            }
        });
    });
} else {
    require('./colors');
}


function log(message) {
    console.log(message.cyan);
}


function error(message, usage, die) {
    if (message instanceof Error) {
        console.log(('✖ ' + message.message).red.bold);
        if (message.stack) {
            console.log(('\t' + message.stack).red.bold);
        }
    } else {
        console.log(('✖ ' + message).red.bold);
    }
    if (usage) {
        console.log('usage:\n' + usage.grey);
    }
    if (die) {
        process.exit(-1);
    }
}


function success(message) {
    console.log(('✔ ' + message).green.bold);
}


function warn(message) {
    console.log(('⚠ ' + message).yellow);
}


function heir(o) {
    function F() {}
    F.prototype = o;
    return new F();
}


function process_template(archetype_path, file, mojit_dir, template) {

    var archetype_file = path.join(archetype_path, file),
        new_file = path.join(mojit_dir, file.substring(0, file.length - 3)),
        buffer = '',
        stat,
        tmpl,
        compiled;

    /* going to check for file size and use compileText to avoid
       possible problems with any mustache templateRoot settings
     */
    stat = fs.statSync(archetype_file);
    if (stat.size > 0) {
        tmpl = fs.readFileSync(archetype_file);
        compiled = mu.compileText(tmpl);
        compiled(template).addListener('data', function(c) {
            buffer += c;
        }).addListener('end', function() {
            fs.writeFileSync(new_file, buffer);
        });
    } else {
        fs.writeFileSync(new_file, '');
    }
}


function process_file(archetype_path, file, mojit_dir, template) {
    if (/\.mu$/.test(file)) {
        // Process as a Mu template
        process_template(archetype_path, file, mojit_dir, template);
    } else {
        // Just copy the file over
        util.pump(
            fs.createReadStream(path.join(archetype_path, file)),
            fs.createWriteStream(path.join(mojit_dir, file)),
            function(err) {
                if (err) {
                    warn('Failed to copy file: ' + file);
                }
            }
        );
    }
}


function process_directory(archetype_path, dir, mojit_dir, template, force) {
    //    console.log('process_directory(' + archetype_path + ', ' + dir +
    //        ', ' + mojit_dir + ', ' + template + ',' + force + ')');
    var new_dir = path.join(mojit_dir, dir),
        files;

    try {
        fs.mkdirSync(new_dir, parseInt('755', 8));
    } catch (err) {
        if (err.message.match(/EEXIST/)) {
            warn('Overwriting existing directory: ' + new_dir);
        } else if (err.message.match(/ENOENT/) &&
                   mojit_dir.indexOf('mojits') === 0) {
            if (!force) {
                error('Please cd into a Mojito application before creating' +
                    ' a Mojit.\nTo force Mojit creation, use --force.');
            }
        } else {
            error('Unexpected error: ' + err.message);
        }
    }

    // log('created dir: ' + new_dir);
    // console.log('reading dir: ' + path.join(archetype_path, dir));

    files = fs.readdirSync(path.join(archetype_path, dir));
    files.forEach(function(f) {
        var s = fs.statSync(path.join(archetype_path, '/', dir, '/', f));

        if (f.charAt(0) === '.') {
            return;
        }
        if (s.isDirectory()) {
            process_directory(path.join(archetype_path, '/', dir), f,
                path.join(mojit_dir, '/', dir), template, force);
        } else {
            process_file(path.join(archetype_path, '/', dir), f,
                new_dir, template);
        }
    });
}


function validate_archetype(archetype_type, archetype_name) {
    var found = false,
        files,
        curdir;

    try {
        curdir = path.join(archetypes_dir, archetype_type);
        files = fs.readdirSync(curdir);
        files.forEach(function(archetype) {
            var s = fs.statSync(path.join(curdir, archetype));

            if (s.isDirectory()) {
                if (archetype === archetype_name) {
                    // console.log('found archetype'.blue);
                    found = true;
                }
            }
        });
    } catch (er) {
        warn(er.message);
        return false;
    }
    return found;
}


/**
 * returns a function that determines whether a name is excluded from a list
 * using a set of firewall style rules.
 *
 * Each rule looks like this:
 *  { pattern: /matchPattern/, include: true|false, type: file|dir|any }
 *
 *  If a file matches a rule, it is included or excluded based on the value of
 *  the include flag If rule is a regexp, it is taken to be { pattern: regexp,
 *  include: false, type: 'any' } - i.e. it is an exclusion rule.
 *  The first rule that matches, wins.
 *  The defaultIsExclude value specifies the behavior when none of the rules
 *  match (if not specified, the file is included)
 *
 * @param {Array} rules set of rules to determine what files and directories are
 *     copied.
 * @param {boolean} defaultIsExclude determines what to do when none of the
 *     rules match.
 * @return {function} A match function.
 */
function getExclusionMatcher(rules, defaultIsExclude) {

    return function isExcluded(name, ofType) {
        var index,
            include,
            pattern,
            rule,
            type,
            matchedRule,
            ret = null;

        if (!(ofType === 'file' || ofType === 'dir')) {
            throw new Error(
                'Internal error: file type was not provided, was [' +
                    ofType + ']'
            );
        }

        /* check if there are any rules */

        if (rules.length < 1) {
            throw new Error('No rules specified');
        }

        // console.log('checking ' + name + '...');
        for (index in rules) {
            // console.log('\t against ' + excludes[regex] + ': ' +
            //     name.search(excludes[regex]));
            if (rules.hasOwnProperty(index)) {

                rule = rules[index];

                if (rule instanceof RegExp) {
                    pattern = rule;
                    include = false;
                    type = 'any';
                } else {
                    pattern = rule.pattern;
                    include = !!rule.include;
                    type = rule.type || 'any';
                }

                if (!(type === 'file' || type === 'dir' || type === 'any')) {
                    throw new Error('Invalid type for match [' + type + ']');
                }

                if (!(pattern instanceof RegExp)) {
                    console.log(rule);
                    throw new Error('Pattern was not a regexp for rule');
                }

                if (name.search(pattern) !== -1 &&
                        (type === 'any' || type === ofType)) {
                    matchedRule = rule;
                    ret = !include;
                    break;
                }
            }
        }

        ret = ret === null ? !!defaultIsExclude : ret;
        //console.log('Match [' + name + '], Exclude= [' + ret + ']');
        //console.log('Used rule');
        //console.log(matchedRule);
        return ret;
    };
}


function copyFile(from, to, cb) {
    var content = fs.readFileSync(from, 'utf-8');

    fs.writeFileSync(to, content, 'utf-8');
    if (typeof cb === 'function') {
        cb();
    }
}


/**
 * recursively copies the source to destination directory based on a matcher
 * that returns whether a file is to be excluded.
 * @param {string} src source dir.
 * @param {string} dest destination dir.
 * @param {function} excludeMatcher the matcher that determines if a given file
 *     is to be excluded.
 */
function copyUsingMatcher(src, dest, excludeMatcher) {

    var filenames,
        basedir,
        i,
        name,
        file,
        newdest,
        type;

    //console.log('copying ' + src + ' to ' + dest);
    /* check if source path exists */

    if (!path.existsSync(src)) {
        throw new Error(src + ' does not exist');
    }

    /* check if source is a directory */

    if (!fs.statSync(src).isDirectory()) {
        throw new Error(src + ' must be a directory');
    }

    /* get the names of all files and directories under source in an array */

    filenames = fs.readdirSync(src);
    basedir = src;

    /* check if destination directory exists */

    if (!path.existsSync(dest)) {
        fs.mkdirSync(dest, parseInt('755', 8));
    }

    for (i = 0; i < filenames.length; i += 1) {

        name = filenames[i];
        file = basedir + '/' + name;
        type = fs.statSync(file).isDirectory() ? 'dir' : 'file';
        newdest = dest + '/' + name;

        if (!excludeMatcher(file, type)) {
            //console.log('Copy ' + file + ' as ' + newdest);
            if (type === 'dir') {
                copyUsingMatcher(file, newdest, excludeMatcher);
            } else {
                copyFile(file, newdest);
            }
        }
    }
}


function copyExclude(src, dest, excludes) {
    copyUsingMatcher(src, dest, getExclusionMatcher(excludes, false));
}


function copy(obj) {
    var temp = null,
        key = '';

    if (!obj || typeof obj !== 'object') { return obj; }
    temp = new obj.constructor();
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            temp[key] = copy(obj[key]);
        }
    }
    return temp;
}


function removeDir(src) {
    var filenames,
        basedir,
        emptydirs,
        name,
        file,
        count;

    /* check if source path exists */
    if (!path.existsSync(src)) {
        return;
    }

    /* check if source is a directory */
    if (!fs.statSync(src).isDirectory()) {
        throw new Error(src + ' must be a directory');
    }

    /* get the names of all files and directories under source in an array */

    filenames = fs.readdirSync(src);
    basedir = src;
    emptydirs = [];

    for (name in filenames) {
        if (filenames.hasOwnProperty(name)) {
            file = basedir + '/' + filenames[name];
            if (fs.statSync(file).isDirectory()) {
                emptydirs.push(file);
                removeDir(file);
            } else {
                fs.unlinkSync(file);
            }
        }
    }
    for (count = 0; count < emptydirs.length; count += 1) {
        fs.rmdirSync(emptydirs[count]);
    }
}


function makeDir(p, mode) {

    var ps = path.normalize(p).split('/'),
        i;

    if (!mode) {
        mode = parseInt('755', 8);
    }

    for (i = 0; i <= ps.length; i += 1) {
        try {
            fs.mkdirSync(ps.slice(0, i).join('/'), mode);
        } catch (err) {
            // Dirty way to check dir
        }
    }
}


function isMojitoApp(dir, usage, die) {
    // Mojito apps must have:
    // - either server.js OR index.js
    // - the file above must require('mojito')

    var requiresMojito = /require\s*\(\s*'mojito'\s*\)/,
        isMojito = false,
        checker;

    checker = function(file) {
        var filepath,
            contents;

        if (isMojito) { return; }
        filepath = path.join(dir, file);
        if (path.existsSync(filepath)) {
            contents = fs.readFileSync(filepath, 'utf-8');
            isMojito = requiresMojito.test(contents);
        }
    };

    ['server.js', 'index.js'].forEach(checker);

    // if command usage is provided, it is assumed that we exit on error
    if (!isMojito && usage) {
        error("The directory '" + dir + "' is not a Mojito Application",
            usage, die);
    }

    return isMojito;
}


// utility class for starting and querying the server (used by a few different
// commands)
function App(options) {
    this._options = options || {};
    this._options.port = this._options.port || 8666;
}


App.prototype = {


    proxy_start: function(cb) {

        var connect_clients = [];

        var start_proxy = function (options, callback) {
            callback = callback || function () {
            };

            var _options = options || {};
            var outer_port = _options.port || 8666;
            var inner_port = Number(outer_port) + 1;

            var p = httpProxy.createServer(function (req, res, proxy) {
                if (Status.crashing) {
                    // sad face. send error logs.
                    // XXX formatting! text/plain is bad
                    res.writeHead(200, {'Content-Type':'text/plain'});

                    res.write("Your app is crashing. Here's the latest log.\n\n");

                    _.each(server_log, function (log) {
                        _.each(log, function (val, key) {
                            if (val)
                                res.write(val);
                            // deal with mixed line endings! XXX
                            if (key !== 'stdout' && key !== 'stderr')
                                res.write("\n");
                        });
                    });

                    res.end();
                } else if (Status.listening) {
                    // server is listening. things are hunky dory!
                    proxy.proxyRequest(req, res, {
                        host:'127.0.0.1', port:inner_port
                    });
                } else {
                    // Not listening yet. Queue up request.
                    var buffer = httpProxy.buffer(req);
                    request_queue.push(function () {
                        proxy.proxyRequest(req, res, {
                            host:'127.0.0.1', port:inner_port,
                            buffer:buffer
                        });
                    });
                }
            });

            var sockjs_opts = { prefix:'/sockjs',
                                heartbeat_delay: 25000,
                                jsessionid: false
                             };

            socket  = sockjs.createServer(sockjs_opts);
            socket.on('connection', function(conn) {

                connect_clients.push(conn);

                log('===>CLIENT:Got client connection');

                conn.on('data', function(message) {
                    log('===>CLIENT:Got client data');
                    for (var i in connect_clients)
                    {

                        connect_clients[i].write(message);

                    }

                });
                conn.on('close', function() {
                    log('===>CLIENT:Client websocket closed');
                    connect_clients = _.without(connect_clients, conn);

                });
            });

            socket.installHandlers(p);

            /*
            // Proxy websocket requests using same buffering logic as for regular HTTP requests
            p.on('upgrade', function (req, socket, head) {
                if (Status.listening) {
                    // server is listening. things are hunky dory!
                    p.proxy.proxyWebSocketRequest(req, socket, head, {
                        host:'127.0.0.1', port:inner_port
                    });
                } else {
                    // Not listening yet. Queue up request.
                    var buffer = httpProxy.buffer(req);
                    request_queue.push(function () {
                        p.proxy.proxyWebSocketRequest(req, socket, head, {
                            host:'127.0.0.1', port:inner_port,
                            buffer:buffer
                        });
                    });
                }
            });
            */
            p.on('error', function (err) {
                if (err.code == 'EADDRINUSE') {
                    error("Can't listen on port " + outer_port
                        + ". Perhaps another Proxy is running?\n");
                    error("\n");
                    error(" If something else is using port " + outer_port + ", you can\n");
                    error("specify an alternative port.\n");
                } else {
                    error(err + "\n");
                }

                process.exit(1);
            });

            // don't spin forever if the app doesn't respond. instead return an
            // error immediately. This shouldn't happen much since we try to not
            // send requests if the app is down.
            p.proxy.on('proxyError', function (err, req, res) {
                res.writeHead(503, {
                    'Content-Type':'text/plain'
                });
                res.end('Unexpected error.');
            });

            p.listen(outer_port);
            callback(options);
        };

        var start_server = function (options,on_exit_callback, on_listen_callback) {
            // environment
            var param = [];
            var context;
            var Mojito_Port = Number(options.port) +1;

            param.push('start');
            param.push(Mojito_Port)

            if (options.context) {
                param.push('--context');
                for (var index in options.context) {
                    context += index + ':' + options.context[index] + ',';
                }
                context = context.slice(0, context.length - 1);
                param.push(context);
            }


            /*var proc = spawn(process.execPath,
                [path.join(__dirname, 'cli.js'), param],
                {env:env});*/
            var Mojito_Path = path.join(__dirname, '../../bin/mojito');

            var proc = spawn(Mojito_Path,param);
            // XXX deal with test server logging differently?!

            proc.stdout.setEncoding('utf8');
            proc.stdout.on('data', function (data) {
                if (!data) return;

                // string must match server.js
                if (data.match(/✔ 	Mojito started/)) {
                    on_listen_callback && on_listen_callback();
                    log(data);
                } else {
                    log(data);
                }
            });

            proc.stderr.setEncoding('utf8');
            proc.stderr.on('data', function (data) {
                data && error(data);
            });

            proc.on('exit', function (code, signal) {
                if (signal) {
                    log('Exited from signal: ' + signal);
                } else {
                    log('Exited with code: ' + code);
                }

                on_exit_callback();
            });

            // this happens sometimes when we write a keepalive after the app is
            // dead. If we don't register a handler, we get a top level exception
            // and the whole app dies.
            // http://stackoverflow.com/questions/2893458/uncatchable-errors-in-node-js
            proc.stdin.on('error', function () {
            });

            // Keepalive so server can detect when we die
            var timer = setInterval(function () {
                try {
                    if (proc && proc.pid && proc.stdin && proc.stdin.write)
                        proc.stdin.write('k');
                } catch (e) {
                    // do nothing. this fails when the process dies.
                }
            }, 2000);

            return {
                proc:proc,
                timer:timer
            };
        };
        var kill_server = function (handle) {
            if (handle.proc.pid) {
                handle.proc.removeAllListeners('exit');
                handle.proc.kill();
            }
            clearInterval(handle.timer);
        };

        var DependencyWatcher = function (app_dir,options, on_change) {
            var self = this;

            self.app_dir = app_dir;
            self.on_change = on_change;
            self.watches = {}; // path => unwatch function with no arguments
            self.last_contents = {}; // path => last contents (array of filenames)
            self.mtimes = {}; // path => last seen mtime

            // If a file is under a source_dir, and has one of the
            // source_extensions, then it's interesting.
            self.source_dirs = [self.app_dir];
            self.source_extensions = ['.css', '.js', '.html' , '.htm'];
            self.options = options;

            // Start monitoring
            _.each(self.source_dirs, _.bind(self._scan, self, true));

        };

        DependencyWatcher.prototype = {
            // stop monitoring
            destroy:function () {
                var self = this;
                self.on_change = function () {
                };
                for (var filepath in self.watches)
                    self.watches[filepath](); // unwatch
                self.watches = {};
            },

            // initial is true on the initial scan, to suppress notifications
            _scan:function (initial, filepath) {
                var self = this;
                try {
                    var stats = fs.lstatSync(filepath)
                } catch (e) {
                    // doesn't exist -- leave stats undefined
                }
                // '+' is necessary to coerce the mtimes from date objects to ints
                // (unix times) so they can be conveniently tested for equality
                if (stats && +stats.mtime === +self.mtimes[filepath])
                // We already know about this file and it hasn't actually
                // changed. Probably its atime changed.
                    return;

                // If an interesting file has changed, fire!
                var is_interesting = self._is_interesting(filepath);
                if (!initial && is_interesting) {
                    self.on_change(this.options);
                    self.destroy();
                    return;
                }

                if (!stats) {
                    // A directory (or an uninteresting file) was removed
                    var unwatch = self.watches[filepath];
                    unwatch && unwatch();
                    delete self.watches[filepath];
                    delete self.last_contents[filepath];
                    delete self.mtimes[filepath];
                    return;
                }

                // If we're seeing this file or directory for the first time,
                // monitor it if necessary
                if (!(filepath in self.watches) && (filepath.indexOf('/.')<0) &&
                    (is_interesting || stats.isDirectory())) {
                    if (!stats.isDirectory()) {
                        // Intentionally not using fs.watch since it doesn't play well with
                        // vim (https://github.com/joyent/node/issues/3172)
                        //log('---------watch file---------'+filepath);
                        fs.watchFile(filepath, {interval:500}, // poll a lot!
                            _.bind(self._scan, self, false, filepath));
                        self.watches[filepath] = function () {
                            fs.unwatchFile(filepath);
                        };
                    } else {
                        // fs.watchFile doesn't work for directories (as tested on ubuntu)
                        //log('---------watch file---------'+filepath);
                        var watch = fs.watch(filepath, {interval:500}, // poll a lot!
                            _.bind(self._scan, self, false, filepath));
                        self.watches[filepath] = function () {
                            watch.close();
                        };
                    }
                    self.mtimes[filepath] = stats.mtime;
                }

                // If a directory, recurse into any new files it contains. (We
                // don't need to check for removed files here, since if we care
                // about a file, we'll already be monitoring it)
                if (stats.isDirectory()) {
                    var old_contents = self.last_contents[filepath] || [];
                    var new_contents = fs.readdirSync(filepath);
                    var added = _.difference(new_contents, old_contents);

                    self.last_contents[filepath] = new_contents;
                    _.each(added, function (child) {
                        self._scan(initial, path.join(filepath, child));
                    });
                }
            },
            // Should we fire if this file changes?
            _is_interesting:function (filepath) {
                var self = this;

                var in_any_dir = function (dirs) {
                    return _.any(dirs, function (dir) {
                        return filepath.slice(0, dir.length) === dir;
                    });
                };

                // Source files
                if (in_any_dir(self.source_dirs) &&
                    _.indexOf(self.source_extensions, path.extname(filepath)) !== -1)
                    return true;

                return false;
            }

        };


        var start_watching = function (options) {

            watcher = new DependencyWatcher(process.cwd(), options,function (options) {
                if (Status.crashing)
                    log("=> Modified -- restarting.");
                Status.reset();

                for (var i in connect_clients)
                {

                    connect_clients[i].write('reload');

                }

                watcher.destroy();

                restart_server(options);
            });

        };

        var restart_server = function (options) {
            Status.running = false;
            Status.listening = false;
            if (server_handle)
                kill_server(server_handle);

            start_watching(options);
            Status.running = true;
            server_handle = start_server(options,function () {
                // on server exit
                Status.running = false;
                Status.listening = false;
                Status.soft_crashed();
                if (!Status.crashing)
                    restart_server(options);
            }, function () {
                // on listen
                Status.listening = true;
                _.each(request_queue, function (f) {
                    f();
                });
                request_queue = [];
            }
            )};

        try {

            start_proxy(this._options, function (options) {
                restart_server(options);
            });
            cb(null);
        } catch (err) {
            cb(err);
        }


    },

    start: function(cb) {
        var app;

        if (this._options.verbose) {
            exports.warn('Starting Mojito App');
        }

        try {
            this._app = app = new mojito.constructor().createServer(
                this._options
            );
            app.listen(this._options.port, null, function(err) {
                // give away the app instance to the start callback
                cb(err, app);
            });
        } catch (err) {
            cb(err);
        }
    },

    // url: what to fetch from the running application
    // cb: function(err, url, content) called with the contents of the URL
    getWebPage: function(url, opts, cb) {
        var app = this,
            buffer = '',
            options = {
                host: '127.0.0.1',
                port: app._options.port,
                path: url,
                method: 'get'
            };

        if (typeof opts === 'function') {
            cb = opts;
        } else {
            Object.keys(opts).forEach(function(k) {
                options[k] = opts[k];
            });
        }

        http.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                buffer += chunk;
            });
            res.on('end', function() {
                if (res.statusCode !== 200) {
                    return cb('Could not get web page: status code: ' +
                        res.statusCode + '\n' + buffer, url);
                } else {
                    cb(null, url, buffer);
                }
            });
        }).on('error', function(err) {
            cb(err, url);
        }).end();
    },

    // urls:  list of urls to fetch
    // cb:  function(err, url, content) called once for each URL
    getWebPages: function(urls, cb) {
        var app = this,
            initOne;

        // need a copy, since we'll be mutating it
        urls = urls.slice();

        initOne = function() {
            if (urls.length) {
                app.getWebPage(urls.shift(), function(err, url, data) {
                    cb(err, url, data);
                    initOne();
                });
            }
        };

        initOne();
    },

    close: function() {
        if (this._options.verbose) {
            exports.warn('Closing Mojito App');
        }
        this._app.close();
    }
};


/**
 */
exports.process_directory = process_directory;

/**
 */
exports.validate_archetype = validate_archetype;

/**
 */
exports.copyExclude = copyExclude;

/**
 */
exports.copyFile = copyFile;

/**
 */
exports.copy = copy;

/**
 */
exports.isMojitoApp = isMojitoApp;

/**
 */
exports.removeDir = removeDir;

/**
 */
exports.makeDir = makeDir;

/**
 */
exports.error = error;

/**
 */
exports.warn = warn;

/**
 */
exports.log = log;

/**
 */
exports.success = success;

/**
 */
exports.App = App;

/**
 */
exports.getExclusionMatcher = getExclusionMatcher;

/**
 */
exports.copyUsingMatcher = copyUsingMatcher;

/**
 */
exports.heir = heir;
