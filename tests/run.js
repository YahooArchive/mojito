#!/usr/bin/env node

var fs = require('fs'),
    program = require('commander'),
    async = require('async'),
    child = require('child_process'),
    cwd = __dirname,
    pids = [],
    returnVal = 0;

program.command('test')
    .description('Run unit and functional tests')
    .option('-u, --unit', 'Run unit tests')
    .option('-f, --func', 'Run functional tests')
    .option('-b, --no-build', 'Don\'t build the apps')
    .option('-d, --no-deploy', 'Don\'t deploy the apps')
    .option('-s, --no-selenium', 'Don\'t run arrow_selenium')
    .option('-a, --no-arrow', 'Don\'t run arrow_server')
    .action(test);

program.command('build')
    .description('Build all HTML5 apps')
    .action(build);

program.command('deploy')
    .description('Deploy all apps')
    .action(deploy);

program.parse(process.argv);

function test (cmd) {
    var series = [];
    // Default to all tests
    if (!cmd.unit && !cmd.func) {
        cmd.unit = true;
        cmd.func = true;
    }
    if (cmd.unit) {
        if (cmd.arrow) {
            series.push(startArrowServer);
        }
        series.push(runUnitTests);
    }
    if (cmd.func) {
        if (cmd.build) {
            series.push(function (callback) {
                build(cmd, callback);
            });
        }
        if (cmd.selenium) {
            series.push(startArrowSelenium);
        }
        if (cmd.deploy) {
            series.push(function (callback) {
                deploy(cmd, callback);
            });
        }
        series.push(runFuncTests);
    }
    async.series(series, finalize);
}

function startArrowServer (callback) {
    var timeout,
        listener = function (data) {
            process.stdout.write(data);
        };
    console.log("---Starting Arrow Server---");
    var p = runCommand(cwd, "arrow_server", [], function () {
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
    timeout = setTimeout(function () {
        p.stdout.removeListener('data', listener); // Stop printing output from arrow_server
        callback(null);
    }, 5000);
}

function runUnitTests (callback) {
    console.log('---Running Unit Tests---');
    var arrowReportDir = cwd + '/arrowreport/unit/';
    runCommand(cwd, "mkdir", [cwd + '/arrowreport/'], function () {
        runCommand(cwd, "mkdir", [arrowReportDir], function () {
            var cmd = runCommand(
                cwd + '/unit',
                "arrow",
                [cwd + "/unit/**/test_descriptor.json", "--browser=phantomjs", "--report=true", "--reportFolder=" + arrowReportDir],
                function (code) {
                    callback(code);
                }
            );
            cmd.stdout.on('data', function (data) {
                process.stdout.write(data);
            });
        });
    });
}

function build (cmd, callback) {
    console.log('---Building Apps---');
    runCommand(
        cwd + '/func/applications/frameworkapp/common',
        "mojito",
        ['build', 'html5app', cwd + '/func/applications/frameworkapp/flatfile'],
        callback
    );
}

function deploy (cmd, callback) {
    console.log('---Deploying Apps---');
    var appSeries = [],
        appsConfig = JSON.parse(fs.readFileSync(cwd + '/func/applications/apps.json', 'utf8')),
        apps = appsConfig.applications;

    for (var i=0; i<apps.length; i++) {
        (function () {
            var app = apps[i],
                port = app.port ? parseInt(app.port) : null,
                type = app.type || 'mojito';

            if ('mojito' === type) {
                if (app.tests) {
                    var mytests = app.tests;
                    for(var j=0; j<mytests.length; j++) {
                        (function () {
                            var test = mytests[j],
                                port = test.port ? parseInt(test.port) : null;
                            appSeries.push(function (callback) {
                                runMojitoApp(cwd + '/func/applications', app.path, port, test.param, callback);
                            });
                        })();
                    }
                } else if (app.enabled === "true" && app.path && port) {
                    appSeries.push(function (callback) {
                        runMojitoApp(cwd + '/func/applications', app.path, port, app.param, callback);
                    });
                }
            } else if ('static' === type) {
                appSeries.push(function (callback) {
                    runStaticApp(cwd + '/func/applications', app.path, port, app.param, callback);
                });
            }
        })();
    }
    async.series(appSeries, callback);
}

function startArrowSelenium (callback) {
    console.log("---Starting Arrow Selenium---");
    var p = runCommand(cwd+"/func/applications/frameworkapp/common", "arrow_selenium", ["--open=firefox"]);
    setTimeout(function () {
        pids.push(p.pid);
        callback(null);
    }, 10000);
}

function runFuncTests (callback) {
    console.log('---Running Functional Tests---');
    var arrowReportDir = cwd + '/arrowreport/func/';
    runCommand(cwd, "mkdir", [arrowReportDir], function () {
        var cmd = runCommand(
            cwd + '/func/',
            "arrow",
            [cwd + "/func/**/*_descriptor.json", "--browser=firefox", "--reuseSession", "--report=true", "--reportFolder=" + arrowReportDir],
            function (code) {
                callback(code);
            }
        );
        cmd.stdout.on('data', function (data) {
            process.stdout.write(data);
        });
    });
}

function finalize (err, results) {
    for(var i=0; i < pids.length; i++) {
        console.log('Shutting down pid ' + pids[i]);
        process.kill(pids[i]);
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
    console.log(path);
    process.chdir(path);
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
        }
        callback(code);
    });

    cmd.on('uncaughtException', function (err) {
        process.stderr.write('uncaught exception: ' + err+'\n');
        callback(1);
    });

    return cmd;
}

function runMojitoApp (basePath, path, port, params, callback) {
    params = params || '';
    console.log('Starting ' + path + ' at port ' + port + ' with params ' + (params || 'empty'));
    var p = runCommand(basePath + '/' + path, "mojito", ["start", port, "--context", params], function () {});
    pids.push(p.pid);
    // Give each app a second to start
    setTimeout(function () { callback(null) }, 1000);
}

function runStaticApp (basePath, path, port, params, callback) {
    params = params || '';
    console.log('Starting static server for ' + path + ' at port ' + port);
    var p = runCommand(basePath + '/' + path, "node", [cwd + "/base/staticServer.js", port], function () {});
    pids.push(p.pid);
    // Give each app a second to start
    setTimeout(function () { callback(null) }, 1000);
}