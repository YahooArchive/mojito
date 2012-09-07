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
         
             "test yuimodule": function() {
                 Y.Assert.areEqual("Storage Lite: Simple Notepad Example", Y.one('h1').get('innerHTML'));
                 Y.Assert.areEqual("Storage Lite", Y.one('a').get('innerHTML'));
                 Y.Assert.areEqual("\"/static/yui_module/autoload/storage-lite.client.js\"", Y.one('body').get('innerHTML').match(/"\/static\/yui_module\/autoload\/storage-lite.client.js"/gi).[0]);
             }
         }));    

         Y.Test.Runner.add(suite);
});

