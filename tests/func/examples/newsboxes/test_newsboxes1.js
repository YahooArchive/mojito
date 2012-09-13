/*
 * This is a basic func test for a UseCase application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
         var suite = new Y.Test.Suite("Newsboxes: newsboxes1");

         suite.add(new Y.Test.Case({
         
             "test newsboxes1": function() {
                 Y.Assert.areEqual("News", Y.one('h1').get('innerHTML').match(/News/gi));
                 Y.Assert.areEqual("Boxes", Y.one('h1').get('innerHTML').match(/Boxes/gi));
                 Y.Assert.areEqual(12, Y.all('#toc a').size());
             }
         }));    

         Y.Test.Runner.add(suite);
});

