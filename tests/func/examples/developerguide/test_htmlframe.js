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
         
             "test htmlframe": function() {
                 Y.Assert.areEqual("Framed Mojit", Y.one('h2').get('innerHTML'));
                 Y.Assert.areEqual("border: 10px solid rgb(61, 54, 45); -moz-border-radius: 10px 10px 10px 10px; margin-left: auto; margin-right: auto; padding: 10px 0px; background-color: rgb(247, 246, 244); text-align: center; font-weight: bold; font-size: 2em; color: rgb(255, 153, 0); width: 90%;", Y.one('h2').getAttribute('style'));
             }
         }));    

         Y.Test.Runner.add(suite);
});

