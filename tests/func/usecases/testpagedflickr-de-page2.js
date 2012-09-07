/*
 * This is a basic func test for a UseCase application.
 */

YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', 'intl', 'datatype-date-format', function (Y) {

    
         var suite = new Y.Test.Suite("UseCase");

         suite.add(new Y.Test.Case({
         
             "test pagedflickr-page2": function() {
                    Y.Assert.areEqual('Hallo! genießen Sie Ihre Bilder', Y.one('h2').get('innerHTML').match(/Hallo! genießen Sie Ihre Bilder/gi));
                    Y.Assert.areEqual("zurück", Y.all('#paginate a').item(0).get('innerHTML'));
                    Y.Assert.areEqual("weiter", Y.all('#paginate a').item(1).get('innerHTML'));
                    Y.Assert.areEqual("page=1", Y.all('#paginate a').item(0).get('href').match(/page=1/gi));
                    Y.Assert.areEqual("page=3", Y.all('#paginate a').item(1).get('href').match(/page=3/gi));
                    
                }
         }));

         Y.Test.Runner.add(suite);
});
