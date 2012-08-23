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
             "test i18n": function() {
                   Y.Assert.areEqual('Pick your order', Y.one('h3').get('innerHTML'));
                   Y.Assert.areEqual('First Choice Mojito', Y.one('#order1').get('innerHTML'));
                   Y.Assert.areEqual('Second Choice Bronx', Y.one('#order2').get('innerHTML'));
                   Y.Assert.areEqual('Third Choice Zombie and Earthquake', Y.one('#order3').get('innerHTML'));
         }}));

         Y.Test.Runner.add(suite);
});

