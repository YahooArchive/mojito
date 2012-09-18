/*
 * This is a basic func test for a UseCase application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', 'intl', 'datatype-date-format', function (Y) {

    
         var suite = new Y.Test.Suite("UseCases: flickr");

         suite.add(new Y.Test.Case({
         
             "test flickr": function() {
                   Y.Assert.areEqual('Hello, world!', Y.one('#flickrtitle').get('innerHTML'));
                   var imagelink = Y.all('#image a').item(1).get('href');
                   Y.Assert.areEqual('http:', imagelink.match(/http:/gi));
                   Y.Assert.areEqual('static.flickr.com', imagelink.match(/static.flickr.com/gi));
             }
         }));

         Y.Test.Runner.add(suite);
});

