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
         
             "test simplelogging": function() {
                 Y.Assert.areEqual("Simple Log Configuration ", Y.one('h2').get('innerHTML'));
                 Y.Assert.areEqual(" Server Configuration ", Y.all('h3').item(0).get('innerHTML'));
                 Y.Assert.areEqual(" Client Configuration ", Y.all('h3').item(1).get('innerHTML'));
                 Y.log("here....."+Y.all('div').item(2).get('innerHTML'));
                 Y.Assert.areEqual("<b>Log level: </b> DEBUG <br>", Y.all('div').item(2).get('innerHTML').match(/<b>Log level: <\/b> DEBUG <br>/gi));
                 Y.Assert.areEqual("<b>Log level: </b> INFO <br>", Y.all('div').item(2).get('innerHTML').match(/<b>Log level: <\/b> INFO <br>/gi));
             }
         }));    

         Y.Test.Runner.add(suite);
});

