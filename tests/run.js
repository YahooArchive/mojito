#!/usr/bin/env node

var fs = require('fs'),
    program = require('commander'),
    async = require('async'),
    child = require('child_process'),
    cwd = process.cwd();

program.command('test')
    .description('Run functional tests')
    .option('-u, --unit', 'Run unit tests')
    .option('-f, --func', 'Run functional tests')
    .option('-b, --no-build', 'Don\'t build the apps')
    .option('-d, --no-deploy', 'Don\'t deploy the apps')
    .option('-s, --no-selenium', 'Don\'t run selenium')
    .option('-a, --no-arrow', 'Don\'t run arrow_server')
    .action(test);

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
    if (cmd.selenium) {
        series.push(startSelenium);
    }
    if (cmd.unit) {
        if (cmd.arrow) {
            series.push(startArrowServer);
        }
        series.push(runUnitTests);
    }
    if (cmd.func) {
        if (cmd.build) {
            series.push(build);
        }
        if (cmd.selenium) {
            series.push(startArrowSelenium);
        }
        if (cmd.deploy) {
            series.push(deploy);
        }
        series.push(runFuncTests);
    }
    async.series(series, finalize);
}

function startArrowServer (callback) {
    console.log("---Starting Arrow Server---");
    var p = runCommand(cwd, "arrow_server");
    setTimeout(function () {
        callback(null, [p.pid]);
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
                ["**/*_descriptor.json", "--browser=phantomjs", "--report=true", "--reportFolder=" + arrowReportDir],
                callback
            );
            cmd.stdout.on('data', function (data) {
                process.stdout.write(data);
            });
        });
    });
}

function build (callback) {
    console.log('---Building Apps---');
    runCommand(
        cwd + '/func/applications/frameworkapp/common',
        "mojito",
        ['build', 'html5app', cwd + '/func/applications/frameworkapp/flatfile'],
        callback
    );
}

function deploy (callback) {
    console.log('---Deploying Apps---');
    var appSeries = [],
        appsConfig = JSON.parse(fs.readFileSync(cwd + '/func/applications/apps.json', 'utf8')),
        apps = appsConfig.applications;

    for (var i=0; i<apps.length; i++) {
        (function () {
            var app = apps[i],
                port = app.port ? parseInt(app.port) : null;

            if (app.tests) {
                var mytests = app.tests;
                for(var j=0; j<mytests.length; j++) {
                    (function () {
                        var test = mytests[j],
                            port = test.port ? parseInt(test.port) : null;
                        appSeries.push(function (callback) {
                            runApp(cwd + '/func/applications', app.path, port, test.param, callback);
                        });
                    })();
                }
            } else if (app.enabled === "true" && app.path && port) {
                appSeries.push(function (callback) {
                    runApp(cwd + '/func/applications', app.path, port, app.param, callback);
                });
            }
        })();
    }
    async.series(appSeries, callback);
}

function startSelenium (callback) {
    console.log("---Starting Selenium---");
    var p = runCommand(cwd+"/base", "java", ["-jar", "selenium-server-standalone-2.22.0.jar"]);
    callback(null, p.pid);
}

function startArrowSelenium (callback) {
    console.log("---Starting Arrow Selenium---");
    var p = runCommand(cwd+"/func/applications/frameworkapp/common", "arrow_selenium", ["--open=firefox"]);
    setTimeout(function () {
        callback(null, [p.pid]);
    }, 10000);
}

function runFuncTests (callback) {
    console.log('---Running Functional Tests---');
    var arrowReportDir = cwd + '/arrowreport/func/';
    runCommand(cwd, "mkdir", [arrowReportDir], function () {
        var cmd = runCommand(
            cwd + '/func/',
            "arrow",
            ["**/*_descriptor.json", "--browser=firefox", "--reuseSession", "--report=true", "--reportFolder=" + arrowReportDir],
            callback
        );
        cmd.stdout.on('data', function (data) {
            process.stdout.write(data);
        });
    });
}

function finalize (err, results) {
    if (results && results[0] && results[0].length) {
        for(var i=0; i < results[0].length; i++) {
            console.log('Shutting down pid ' + results[0][i]);
            process.kill(results[0][i]);
        }
    }
    if (err) {
        console.log(err);
        console.log('FAILED');
        process.exit(1);
        return;
    }
    console.log(results);
    console.log('Completed');
    process.exit(0);

}

function runCommand (path, command, argv, callback) {
    callback = callback || function () {};
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
            return;
        }
        callback();
    });

    cmd.on('uncaughtException', function (err) {
        process.stderr.write('uncaught exception: ' + err+'\n');
        callback(1);
    });

    return cmd;
}

function runApp (basePath, path, port, params, callback) {
    params = params || '';
    console.log('Starting ' + path + ' at port ' + port + ' with params ' + (params || 'empty'));
    var p = runCommand(basePath + '/' + path, "mojito", ["start", port, "--context", params], function () {});
    // Give each app a second to start
    setTimeout(function () { callback(null, [p.pid]) }, 1000);
}