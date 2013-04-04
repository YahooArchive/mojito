/*
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 */

/**
Mojito Built-In Functional/Unit Tests

Mojito comes with the script run.js that allows you to run built-in unit and functional tests. The script 
run.js uses the npm module Arrow, a testing framework that fuses together JavaScript, Node.js, PhantomJS, 
and Selenium. By running the built-in unit and functional tests, contributors can accelerate the merging 
of their pull request.
For more info, visit: http://developer.yahoo.com/cocktails/mojito/docs/topics/mojito_testing.html#func-unit-builtin

This is a functional test for Mojito QuickStartGuide in regular Reader's page.
**/
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {

        var suite = new Y.Test.Suite("QuickStartGuide: Reader test");

        suite.add(new Y.Test.Case({
            "test Reader nav bar": function() {
                // Tests the previous link, if presents
                if (Y.one('.container .contents-nav .link-prev')) {
                    Y.Assert.areEqual("http://10.72.183.144:4000/read.html?filename=", Y.one('.container .contents-nav .link-prev').get('href').substring(0, 45));
                }

                // Tests the next link, if presents
                if (Y.one('.container .contents-nav .link-next')) {
                    Y.Assert.areEqual("http://10.72.183.144:4000/read.html?filename=", Y.one('.container .contents-nav .link-next').get('href').substring(0, 45));
                }

                // HOME menu
                Y.Assert.areEqual("HOME", Y.one('.container .contents-nav .link-home').get('innerHTML'));

                // Tests bottom previous link, if presents
                if (Y.one('.container .link-bottom .link-prev')) {
                    Y.Assert.areEqual("http://10.72.183.144:4000/read.html?filename=", Y.one('.container .contents-nav .link-prev').get('href').substring(0, 45));
                }

                // Tests bottom next link, if presents
                if (Y.one('.container .link-bottom .link-next')) {
                    Y.Assert.areEqual("http://10.72.183.144:4000/read.html?filename=", Y.one('.container .contents-nav .link-next').get('href').substring(0, 45));
                }
            }
        }));

    Y.Test.Runner.add(suite);
});

