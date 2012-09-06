/*
 * This is a basic func test for a UseCase application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
         var suite = new Y.Test.Suite("Developerguide");

         suite.add(new Y.Test.Case({
         
             "test newsbox2": function() {
                 Y.Assert.areEqual("Contents", Y.all('a').item(0).get('innerHTML'));
                 Y.Assert.areEqual("Source", Y.all('a').item(1).get('innerHTML'));
                 Y.Assert.areEqual("selected", Y.all('span').item(0).getAttribute('class'));
             }
         }));    

         Y.Test.Runner.add(suite);
});

