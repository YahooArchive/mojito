#!/usr/bin/env node

/*jslint anon:true, sloppy:true, nomen:true, node:true*/

var fs = require('fs'),
    path = require('path'),
    wrench = require('wrench'),
    libpath = require('path'),
    glob = require("glob"),
    program = require('commander'),
    async = require('async'),
    child = require('child_process'),
    cwd = __dirname,
    pids = [],
    thePid = null,
    pidNames = {},
    thePidName = null,
    returnVal = 0,
    hostname = require('os').hostname(),
    dns = require('dns'),
    hostip,
    arrowReportDir,
    remoteselenium;

program.command('test')
    .description('Run unit and functional tests')
    .option('-u, --unit', 'Run unit tests')
    .option('-f, --func', 'Run functional tests')
    .option('-s, --no-selenium', 'Don\'t run arrow_selenium')
    .option('-a, --no-arrow', 'Don\'t run arrow_server')
    .option('--debugApps', 'show STDOUT and STDERR from apps')
    .option('--logLevel <value>', 'Arrow logLevel')
    .option('--testName <value>', 'Arrow testName')
    .option('--descriptor <value>', 'which descriptor to run. filename (or glob) relative to --path')
    .option('--port <value>', 'port number to run app')
    .option('--coverage', 'Arrow code coverage')
    .option('--reuseSession', 'Arrow reuseSession')
    .option('--baseUrl <value>', 'Full app path including port if there is one to run arrow tests')
    .option('--group <value>', 'Arrow group')
    .option('--driver <value>', 'Arrow driver')
    .option('--browser <value>', 'Arrow browser')
    .option('--path <value>', 'Path to find the tests. defaults to ./func or ./unit')
    .option('--reportFolder <value>', 'Result dir. defaults to tests/../artifact/ for functional or ./unit/artifact/ for unit')
    .action(test);

// report how we're called, mainly to help debug CI environments
console.log(process.argv.join(' '));
console.log();

program.parse(process.argv);

function test(cmd) {
    var series = [];
    cmd.logLevel = cmd.logLevel || 'WARN';
    // Default to all tests

    cmd.browser = cmd.browser || 'firefox';
    cmd.unitPath = path.resolve(cwd, cmd.unitPath || cmd.path || './unit');
    cmd.funcPath = path.resolve(cwd, cmd.funcPath || cmd.path || './func');
    if (cmd.reportFolder) {
        cmd.reportFolder = path.resolve(cwd, cmd.reportFolder);
        cmd.reportFolder = cmd.reportFolder + '/artifacts/';
    }

    if (cmd.unit) {
        arrowReportDir = cmd.reportFolder || cmd.unitPath + '/artifacts/arrowreport/';
    } else {
        arrowReportDir = cmd.reportFolder || cmd.funcPath + '/../../artifacts/arrowreport/';
    }
    try {
        wrench.rmdirSyncRecursive(arrowReportDir);
    } catch (e) {}
    wrench.mkdirSyncRecursive(arrowReportDir);


    if (process.env['SELENIUM_HUB_URL']) {
        remoteselenium = process.env['SELENIUM_HUB_URL'];
        console.log('selenium host.....' + remoteselenium);
        series.push(gethostip);
    }

    if (cmd.arrow) {
        series.push(startArrowServer);
    }

    if (cmd.browser === 'phantomjs') {
        series.push(function (callback) {
            startPhantomjs(cmd, callback);
        });
    } else if (cmd.reuseSession) {
        if (cmd.selenium) {
            series.push(function (callback) {
                startArrowSelenium(cmd, callback);
            });
        }
    }

    if (!cmd.unit && !cmd.func) {
        console.log("---Run both unit and functinal tests with phantomjs---");
        cmd.unit = true;
        cmd.func = true;
    }

    if (cmd.unit) {
        series.push(function (callback) {
            runUnitTests(cmd, callback);
        });
    }
    if (cmd.func) {
        series.push(function (callback) {
            runFuncAppTests(cmd, callback);
        });
    }
    async.series(series, finalize);
}

function gethostip(callback) {
    dns.lookup(hostname, function (err, addr, fam) {
        if (err) {
            callback(err);
            return;
        }
        hostip = addr;
        console.log('App running at.....' + hostip);
        callback(null);
    });
}

function startArrowServer(callback) {
    var timeout,
        listener = function (data) {
            process.stdout.write(data);
        };
    console.log("---Starting Arrow Server---");
    var p = runCommand(cwd, "node", [cwd+"/../node_modules/yahoo-arrow/arrow_server/server.js"], function () {
        // If this command returns called, then it failed to launch
        if (timeout) {
            clearTimeout(timeout);
        }
        console.log('arrow_server failed to start. If it is already running' +
            ' use \'-a\' to skip startup of arrow_server.');
        pids.pop();
        callback(1); // Trigger failure
    });
    p.stdout.on('data', listener);
    pids.push(p.pid);
    pidNames[p.pid] = 'arrow_server';
    timeout = setTimeout(function () {
        p.stdout.removeListener('data', listener); // Stop printing output from arrow_server
        callback(null);
    }, 5000);
}

function runUnitTests (cmd, callback) {
    console.log('---Running Unit Tests---');

    var descriptor = cmd.descriptor || '**/*_descriptor.json';
    var commandArgs = [
        cwd + "/../node_modules/yahoo-arrow/index.js",
        "--descriptor=" + cmd.unitPath + '/' + descriptor,
        "--exitCode=true",
        "--report=true",
        "--reportFolder=" + arrowReportDir
    ];
    if ('phantomjs' !== cmd.browser && cmd.reuseSession) {
        commandArgs.push('--reuseSession');
    }
    
    var filestoexclude = 'tests/base/mojito-test.js,' +
        'lib/app/autoload/mojito-client.client.js,' +
        'lib/app/autoload/perf.client.js,lib/app/autoload/perf.server.js,' +
        'lib/app/commands/,' +
        'lib/management/';
    commandArgs.push('--logLevel=' + cmd.logLevel);
    commandArgs.push('--browser=' + cmd.browser);
    cmd.driver && commandArgs.push('--driver=' + cmd.driver);
    cmd.testName && commandArgs.push('--testName=' + cmd.testName);
    cmd.group && commandArgs.push('--group=' + cmd.group);
    cmd.coverage && commandArgs.push('--coverage=' + cmd.coverage);
    cmd.coverage && commandArgs.push('--coverageExclude=' + filestoexclude);

    var p = runCommand(
        cmd.unitPath,
        "node",
        commandArgs,
        function (code) {
            callback(code);
        }
    );
    p.stdout.on('data', function (data) {
        process.stdout.write(data);
    });
}

function build(cmd, callback) {
    console.log('---Building Apps---');
    runCommand(
        cmd.funcPath + '/applications/frameworkapp/common',
        cwd + "/../bin/mojito",
        ['build', 'html5app', cmd.funcPath + '/applications/frameworkapp/flatfile'],
        callback
    );
}

function startPhantomjs(cmd, callback) {
    console.log("---Starting Phantomjs---");
    var timeout,
        listener = function (data) {
            process.stdout.write(data);
        },
        commandArgs;
    if (fs.existsSync(cwd + "/../node_modules/phantomjs")) {
        commandArgs = [cwd + "/../node_modules/phantomjs/bin/phantomjs"];
    } else {
        commandArgs = ["phantomjs"];
    }
    commandArgs.push("--webdriver=4445");
    var p = runCommand(cwd, "node", commandArgs, function() {
        // If this command returns called, then it failed to launch
        if (timeout) {
            clearTimeout(timeout);
        }
        console.log('phantomjs failed to start. Please check if phantomjs is installed');
        pids.pop();
        callback(1); // Trigger failure
    });
    p.stdout.on('data', listener);
    pids.push(p.pid);
    pidNames[p.pid] = 'phantomjs driver';
    timeout = setTimeout(function () {
        p.stdout.removeListener('data', listener); // Stop printing output from arrow_server
        callback(null);
    }, 5000);
}

function startArrowSelenium(cmd, callback) {
    console.log("---Starting Arrow Selenium---");
    var commandArgs = [cwd + "/../node_modules/yahoo-arrow/arrow_selenium/selenium.js"];
    if (remoteselenium) {
        commandArgs.push('--seleniumHost=' + remoteselenium);
    }
    commandArgs.push("--open=" + cmd.browser);
    runCommand(cwd, "node", commandArgs, function () {
        callback(null);
    });
}

function runFuncAppTests(cmd, callback) {
    var descriptor = cmd.descriptor || '**/*_descriptor.json',
        descriptors = [],
        exeSeries = [];
    if (descriptor === '**/*_descriptor.json') {
        descriptors = glob.sync(cmd.funcPath + '/' + descriptor);
    } else {
        descriptors.push(cmd.funcPath + '/' + descriptor);
    }

    async.forEachSeries(descriptors, function(des, callback) {
        var appConfig = JSON.parse(fs.readFileSync(des, 'utf8'));
        var app = appConfig[0].config.application,
            port = cmd.port || 8666,
            param = app.param || null,
            type = app.type || 'mojito';
        if (type === "static") {
            exeSeries.push(build(cmd, function() {
                runStaticApp(cmd.funcPath + '/applications', app.path, port, function(thispid) {
                    runFuncTests(cmd, des, port, thispid, callback);
                });
            }));
        } else {
            // Install dependecies for specific projects
            // Change here if you want your app to do npm install prior to start mojito server for test
            if (app.path === "../../../examples/quickstartguide") {
                exeSeries.push(installDependencies(app, cmd.funcPath + '/applications', function() {
                    runMojitoApp(app, cmd, cmd.funcPath + '/applications', port, app.param, function(thispid) {
                        runFuncTests(cmd, des, port, thispid, callback);
                    });
                }));
            } else {
                exeSeries.push(runMojitoApp(app, cmd, cmd.funcPath + '/applications', port, app.param, function(thispid) {
                    runFuncTests(cmd, des, port, thispid, callback);
                }));
            }
        }
    }, function(err) {
          callback(err);
    });
    async.series(exeSeries, callback);
}

function runFuncTests(cmd, desc, port, thispid, callback) {
    console.log('---Running Functional Tests---');

    var group = cmd.group || null,
        baseUrl;
    if (cmd.baseUrl) {
        baseUrl = cmd.baseUrl;
    } else if (hostip) {
        baseUrl = 'http:\/\/' + hostip + ':' + port;
    } else {
        baseUrl = 'http:\/\/localhost' + ':' + port;
    }
 
    var commandArgs = [
        cwd + "/../node_modules/yahoo-arrow/index.js",
        "--descriptor=" + desc,
        "--baseUrl=" + baseUrl,
        "--exitCode=true",
        "--report=true",
        "--reportFolder=" + arrowReportDir,
        "--config=" + cwd + "/config/config.js"
    ];
    if ('phantomjs' !== cmd.browser && cmd.reuseSession) {
        commandArgs.push('--reuseSession');
    }
    if (remoteselenium) {
        commandArgs.push('--seleniumHost=' + remoteselenium);
    }
    commandArgs.push('--logLevel=' + cmd.logLevel);
    commandArgs.push('--browser=' + cmd.browser);
    cmd.driver && commandArgs.push('--driver=' + cmd.driver);
    cmd.testName && commandArgs.push('--testName=' + cmd.testName);
    cmd.group && commandArgs.push('--group=' + cmd.group);
    cmd.coverage && commandArgs.push('--coverage=' + cmd.coverage);

    var p = runCommand(
        cmd.funcPath,
        "node",
        commandArgs,
        function (code) {
            try {
                console.log('Shutting down pid '+ thePid + ' -- ' + thePidName);
                process.kill(thePid);
                pids.pop(thePid);
            }
            catch(e) {
                console.log('FAILED to shut down pid:' + thePid);
            }
            callback(code);
        }
    );
    p.stdout.on('data', function (data) {
        process.stdout.write(data);
    });
}

function finalize (err, results) {
    console.log("---in finalize---");
    for(var i=0; i < pids.length; i++) {
        console.log('Shutting down pid ' + pids[i] + ' -- ' + pidNames[pids[i]]);
        try {
            process.kill(pids[i]);
        }
        catch(e) {
            console.log('FAILED to shut down pid ' + pids[i] + ' -- ' + pidNames[pids[i]]);
        }
    }
    if (err) {
        console.log(err);
        console.log('FAILED');
        process.exit(1);
        return;
    }
    console.log('Completed');
    process.exit(0);

}

function runCommand (path, command, argv, callback) {
    callback = callback || function () {};
    process.chdir(path);
    console.log(command + ' ' + argv.join(' '));
    var cmd = child.spawn(command, argv, {
        cwd: path,
        env: process.env
    });

    cmd.stdout.on('data', function (data) {
        // Don't care generally. But, specific commands may want a listener for this.
    });

    cmd.stderr.on('data', function (data) {
        process.stdout.write(data);
    });

    cmd.on('exit', function (code) {
        cmd.stdin.end();
        if (0 !== code) {
            callback('exit: child process exited with code ' + code);
            return;
        }
        callback(code);
    });

    cmd.on('uncaughtException', function (err) {
        process.stderr.write('uncaught exception: ' + err+'\n');
        callback(1);
    });

    return cmd;
}

function installDependencies (app, basePath, callback) {
    console.log("---Starting installing dependencies---");
    // Install with npm
    runCommand(basePath + '/' + app.path, "npm", ["i"], function (code) {
        if (code !== 0) {
            // Try to install with ynpm if npm is not available
            runCommand(basePath + '/' + app.path, "ynpm", ["i", "--registry=http://ynpm-registry.corp.yahoo.com:4080"], function (code) {
                if (code !== 0) {
                    // Neither npm nor ynpm is available
                    process.stderr.write("please install npm.\n");
                }
                callback(code);
            });
        } else {
            callback(code);
        }
    });
}

function runMojitoApp (app, cliOptions, basePath, port, params, callback) {
    params = params || '';
    var cmdArgs = ['start'];
    console.log("---Starting application---");
    if (port) {
        cmdArgs.push(port);
    }
    if (params) {
        cmdArgs.push('--context');
        cmdArgs.push(params);
    }
    var p = runCommand(basePath + '/' + app.path, cwd + "/../bin/mojito", cmdArgs, function () {});
        thispid = p.pid;
    thePid = p.pid;
    thePidName = app.name + ':' + port + (params ? '?' + params : '');
    pids.push(thePid);
    pidNames[p.pid] = thePidName;
    if (cliOptions.debugApps) {
        p.stdout.on('data', function(data) {
            console.error('---DEBUG ' + port + ' STDOUT--- ' + data.toString());
        });
        p.stderr.on('data', function(data) {
            console.error('---DEBUG ' + port + ' STDERR--- ' + data.toString());
        });
    }

    var listener;
    listener = function(data) {
        if (data.toString().match(/✔ 	Mojito\(v/)) {
            p.stdout.removeListener('data', listener);
            callback(thePid);
        }
    }
    p.stdout.on('data', listener);
}

function runStaticApp (basePath, path, port, callback) {
    console.log('---Starting static server for ' + path + ' at port ' + port);
    var p = runCommand(basePath + '/' + path, cwd + "/../node_modules/.bin/static", ['-p', port, '-c', '1'], function () {});
    thePid = p.pid;
    thePidName = 'static ' + libpath.basename(path) + ':' + port;
    pids.push(p.pid);
    pidNames[p.pid] = 'static ' + libpath.basename(path) + ':' + port;
    
    var listener;
    listener = function(data) {
        if (data.toString().match(/serving \".\" at http:\/\//)) {
            p.stdout.removeListener('data', listener);
            callback(thePid);
        }
    }
    p.stdout.on('data', listener);
}
