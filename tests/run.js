#!/usr/bin/env node

var fs = require('fs'),
    path = require('path'),
    wrench = require('wrench'),
    libpath = require('path'),
    program = require('commander'),
    async = require('async'),
    child = require('child_process'),
    cwd = __dirname,
    pids = [],
    pidNames = {},
    returnVal = 0;

program.command('test')
    .description('Run unit and functional tests')
    .option('-c, --cli', 'Run command line tests')
    .option('-u, --unit', 'Run unit tests')
    .option('-f, --func', 'Run functional tests')
    .option('-b, --no-build', 'Don\'t build the apps')
    .option('-d, --no-deploy', 'Don\'t deploy the apps')
    .option('-s, --no-selenium', 'Don\'t run arrow_selenium')
    .option('-a, --no-arrow', 'Don\'t run arrow_server')
    .option('--debugApps', 'show STDOUT and STDERR from apps')
    .option('--logLevel <value>', 'Arrow logLevel')
    .option('--testName <value>', 'Arrow testName')
    .option('--descriptor <value>', 'which descriptor to run. filename (or glob) relative to --path')
    .option('--coverage', 'Arrow code coverage')
    .option('--group <value>', 'Arrow group')
    .option('--driver <value>', 'Arrow driver')
    .option('--browser <value>', 'Arrow browser')
    .option('--path <value>', 'Path to find the tests. defaults to ./func or ./unit')
    .action(test);

program.command('build')
    .description('Build all HTML5 apps')
    .action(build);

program.command('deploy')
    .description('Deploy all apps')
    .action(deploy);

// report how we're called, mainly to help debug CI environments
console.log(process.argv.join(' '));
console.log();

program.parse(process.argv);

function test (cmd) {
    var series = [];
    cmd.logLevel = cmd.logLevel || 'WARN';
    // Default to all tests
    if (!cmd.unit && !cmd.func && !cmd.cli) {
        cmd.cli = true;
        cmd.unit = true;
        cmd.func = true;
    }
    cmd.unitBrowser = cmd.unitBrowser || cmd.browser || 'firefox';
    cmd.funcBrowser = cmd.funcBrowser || cmd.browser || 'firefox';
    cmd.cliPath = path.resolve(cwd, cmd.cliPath || cmd.path || './cli');
    cmd.unitPath = path.resolve(cwd, cmd.unitPath || cmd.path || './unit');
    cmd.funcPath = path.resolve(cwd, cmd.funcPath || cmd.path || './func');

    // We only start the Arrow server when we're running unit or functional
    // tests. If we're only running cli tests we skip that since it slows things
    // down without adding value.
    if (cmd.arrow && (!cmd.cli || (!cmd.cli && !cmd.unit && !cmd.func))) {
        series.push(startArrowServer);
    }
    if (cmd.cli) {
        series.push(function (callback) {
            runCliTests(cmd, callback)
        });
    }
    if (cmd.unit) {
        if ('phantomjs' !== cmd.unitBrowser) {
            if (cmd.selenium) {
                series.push(function (callback) {
                    startArrowSelenium(cmd, callback);
                });
            }
        }
        series.push(function (callback) {
            runUnitTests(cmd, callback)
        });
    }
    if (cmd.func) {
        if (cmd.build) {
            series.push(function (callback) {
                build(cmd, callback);
            });
        }
        if ('phantomjs' !== cmd.funcBrowser) {
            if (cmd.selenium) {
                series.push(function (callback) {
                    startArrowSelenium(cmd, callback);
                });
            }
        }
        if (cmd.deploy) {
            series.push(function (callback) {
                deploy(cmd, callback);
            });
        }
        series.push(function (callback) {
            runFuncTests(cmd, callback)
        });
    }
    async.series(series, finalize);
}

function startArrowServer (callback) {
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

function runCliTests (cmd, callback) {
    console.log('---Running CLI Tests---');
    var arrowReportDir = cmd.cliPath + '/artifacts/arrowreport/';
    try {
        wrench.rmdirSyncRecursive(arrowReportDir);
    } catch (e) {}
    wrench.mkdirSyncRecursive(arrowReportDir);

    var commandArgs = [
        cwd + "/../node_modules/yahoo-arrow/index.js",
        "--descriptor=" + cmd.cliPath + "/**/*_descriptor.json",
        "--report=true",
        "--reportFolder=" + arrowReportDir
    ];
    // Unlike other test types the CLI tests force use of the nodejs driver and
    // do not specify a browser since one won't be useful for CLI testing.
    commandArgs.push('--driver=nodejs');

    commandArgs.push('--logLevel=' + cmd.logLevel);
    cmd.testName && commandArgs.push('--testName=' + cmd.testName);
    cmd.group && commandArgs.push('--group=' + cmd.group);
    cmd.coverage && commandArgs.push('--coverage=' + cmd.coverage);

    var p = runCommand(
        cmd.cliPath,
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

function runUnitTests (cmd, callback) {
    console.log('---Running Unit Tests---');
    var arrowReportDir = cmd.unitPath + '/artifacts/arrowreport/';
    try {
        wrench.rmdirSyncRecursive(arrowReportDir);
    } catch (e) {}
    wrench.mkdirSyncRecursive(arrowReportDir);

    var commandArgs = [
        cwd + "/../node_modules/yahoo-arrow/index.js",
        "--descriptor=" + cmd.unitPath + "/**/*_descriptor.json",
        "--report=true",
        "--reportFolder=" + arrowReportDir
    ];
    if ('phantomjs' !== cmd.unitBrowser) {
        commandArgs.push('--reuseSession');
    }
    commandArgs.push('--logLevel=' + cmd.logLevel);
    commandArgs.push('--browser=' + cmd.unitBrowser);
    cmd.driver && commandArgs.push('--driver=' + cmd.driver);
    cmd.testName && commandArgs.push('--testName=' + cmd.testName);
    cmd.group && commandArgs.push('--group=' + cmd.group);
    cmd.coverage && commandArgs.push('--coverage=' + cmd.coverage);

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

function build (cmd, callback) {
    console.log('---Building Apps---');
    runCommand(
        cmd.funcPath + '/applications/frameworkapp/common',
        cwd + "/../bin/mojito",
        ['build', 'html5app', cmd.funcPath + '/applications/frameworkapp/flatfile'],
        callback
    );
}

function deploy (cmd, callback) {
    console.log('---Deploying Apps---');
    var appSeries = [],
        appsConfig = JSON.parse(fs.readFileSync(cmd.funcPath + '/applications/apps.json', 'utf8')),
        apps = appsConfig.applications;

    for (var i=0; i<apps.length; i++) {
        (function (app) {
            var port = app.port || null,
                type = app.type || 'mojito';

            if ('mojito' === type) {
                if (app.tests) {
                    var mytests = app.tests;
                    for(var j=0; j<mytests.length; j++) {
                        (function (test) {
                            var port = test.port || app.port || null;
                            appSeries.push(function (callback) {
                                runMojitoApp(app, cmd, cmd.funcPath + '/applications', port, test.param, callback);
                            });
                        })(mytests[j]);
                    }
                } else {
                    appSeries.push(function (callback) {
                        runMojitoApp(app, cmd, cmd.funcPath + '/applications', port, app.param, callback);
                    });
                }
            } else if ('static' === type) {
                appSeries.push(function (callback) {
                    runStaticApp(cmd.funcPath + '/applications', app.path, port, app.param, callback);
                });
            }
        })(apps[i]);
    }
    async.series(appSeries, callback);
}

function startArrowSelenium (cmd, callback) {
    console.log("---Starting Arrow Selenium---");
    var commandArgs = [cwd+"/../node_modules/yahoo-arrow/arrow_selenium/selenium.js"];
    commandArgs.push("--open=" + cmd.funcBrowser);
    runCommand(cwd, "node", commandArgs, function () {
        callback(null);
    });
}

function runFuncTests (cmd, callback) {
    console.log('---Running Functional Tests---');
    var arrowReportDir = cmd.funcPath + '/artifacts/arrowreport/';
    try {
        wrench.rmdirSyncRecursive(arrowReportDir);
    } catch (e) {}
    wrench.mkdirSyncRecursive(arrowReportDir);

    var descriptor = cmd.descriptor || '**/*_descriptor.json';
    var commandArgs = [
        cwd + "/../node_modules/yahoo-arrow/index.js",
        "--descriptor=" + cmd.funcPath + '/' + descriptor,
        "--report=true",
        "--reportFolder=" + arrowReportDir,
        "--config=" + cwd + "/config/config.js"
    ];
    if ('phantomjs' !== cmd.funcBrowser) {
        commandArgs.push('--reuseSession');
    }
    commandArgs.push('--logLevel=' + cmd.logLevel);
    commandArgs.push('--browser=' + cmd.funcBrowser);
    cmd.driver && commandArgs.push('--driver=' + cmd.driver);
    cmd.testName && commandArgs.push('--testName=' + cmd.testName);
    cmd.group && commandArgs.push('--group=' + cmd.group);
    cmd.coverage && commandArgs.push('--coverage=' + cmd.coverage);

    var p = runCommand(
        cmd.funcPath,
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

function finalize (err, results) {
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

function runMojitoApp (app, cliOptions, basePath, port, params, callback) {
    if (!app.enabled) {
        console.error('------------------------------- DISABLED APP ' + app.name + ':' + port);
        callback();
        return;
    }
    /* useful when debugging
    var OK = {
        4081: true,
    };
    if (! OK[port]) {
        console.error('------------------------------- SKIPPING APP ' + app.name);
        callback();
        return;
    }
    */
    params = params || '';
    console.log('Starting ' + app.name + ' at port ' + port + ' with params ' + (params || 'empty'));
    var cmdArgs = ['start'];
    if (port) {
        cmdArgs.push(port);
    }
    if (params) {
        cmdArgs.push('--context');
        cmdArgs.push(params);
    }
    var p = runCommand(basePath + '/' + app.path, cwd + "/../bin/mojito", cmdArgs, function () {});

    pids.push(p.pid);
    pidNames[p.pid] = app.name + ':' + port + (params ? '?' + params : '');
    if (cliOptions.debugApps) {
        p.stdout.on('data', function(data) {
            console.error('---DEBUG ' + port + ' STDOUT--- ' + data.toString());
        });
        p.stderr.on('data', function(data) {
            console.error('---DEBUG ' + port + ' STDERR--- ' + data.toString());
        });
    }
    // Give each app a second to start
    setTimeout(function () { callback(null) }, 1000);
}

function runStaticApp (basePath, path, port, params, callback) {
    params = params || '';
    console.log('Starting static server for ' + path + ' at port ' + port);
    var p = runCommand(basePath + '/' + path, "node", [cwd + "/base/staticServer.js", port], function () {});
    pids.push(p.pid);
    pidNames[p.pid] = 'static ' + libpath.basename(path) + ':' + port;
    // Give each app a second to start
    setTimeout(function () { callback(null) }, 1000);
}
