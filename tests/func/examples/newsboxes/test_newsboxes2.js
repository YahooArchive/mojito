/*
 * This is a basic func test for a UseCase application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
         var suite = new Y.Test.Suite("Newsboxes: newsbox2");

         suite.add(new Y.Test.Case({
         
             "test newsbox2": function() {
                 Y.Assert.areEqual("Contents", Y.all('a').item(0).get('innerHTML'));
                 Y.Assert.areEqual("Source", Y.all('a').item(1).get('innerHTML'));
                 Y.Assert.areNotEqual("Ooo, could not fetch stories for", Y.one('#desc').get('innerHTML').match(/Ooo, could not fetch stories for/gi));
                 Y.Assert.isTrue(Y.one('.main-sv').hasClass('yui3-scrollview-content'));
             }
         }));    

         Y.Test.Runner.add(suite);
});

