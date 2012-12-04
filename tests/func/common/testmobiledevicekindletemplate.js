/*
 * This is a basic func test for a Common application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
    var suite = new Y.Test.Suite("Common");

    suite.add(new Y.Test.Case({

        "test mobiledevicekindletemplate": function() {
            Y.Assert.areEqual('This is the template for the kindle.', Y.one('p').get('innerHTML').match(/This is the template for the kindle./gi));
        }

    }));

    Y.Test.Runner.add(suite);

});
