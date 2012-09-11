/*
 * This is a basic func test for a UseCase application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', 'intl', 'datatype-date-format', function (Y) {
   
         var suite = new Y.Test.Suite("UseCases: hello");

         suite.add(new Y.Test.Case({
         
             "test hello": function() {
                  Y.Assert.areEqual('Mojito is working.', Y.one('pre').get('innerHTML'));
             }
         }));    

         Y.Test.Runner.add(suite);
});

