/*
 * This is a basic func test for a Common application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
    var suite = new Y.Test.Suite("Common: acmojitdone7client");

    suite.add(new Y.Test.Case({
         
       "test acmojitdone7client": function() {
          var that = this;
          Y.one('#testcase > option[value="done7"]').set('selected','selected'); 
          Y.one('#acMojitButton').simulate('click');
          that.wait(function(){
              Y.Assert.areEqual('\{\"data\":\"Hello, world!\"\}', Y.one('#ACMojitResult').get('innerHTML').match(/\{\"data\":\"Hello, world!\"\}/gi));
          }, 1000);
      }

      }));

       Y.Test.Runner.add(suite);

});