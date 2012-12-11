/*
 * This is a basic func test for a Routing application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {

    var suite = new Y.Test.Suite("Routing: BasicRouting10-1");
    suite.add(new Y.Test.Case({
         "test BasicRouting10-1": function(){
             Y.Assert.areEqual('Click to execute the action \'route-2\' for the mojit \'nothing\'', Y.one('#mylink').get('innerHTML'));
             Y.Assert.areEqual("error:%20No%20route%20match%20found%20for%20'route-2.nothing'%20(get)", Y.one('#mylink').get('href'), 'invalid routes should trigger an error');
             Y.Assert.areEqual('route-2', Y.one('#name').get('innerHTML'));
         }
   }));

   Y.Test.Runner.add(suite);
});
