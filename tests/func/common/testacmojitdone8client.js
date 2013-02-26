/*
 * This is a basic func test for a Common application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
    var suite = new Y.Test.Suite("Common: acmojitdone8client");

    suite.add(new Y.Test.Case({
         
	  "test acmojitdone8client": function() {
          var that = this;
          Y.one('#testcase > option[value="done8"]').set('selected','selected'); 
          Y.one('#acMojitButton').simulate('click');
          that.wait(function(){
              Y.Assert.areEqual('Hello, world!--from done', Y.one('#ACMojitTest').get('innerHTML').match(/Hello, world!--from done/gi));
          }, 4000);
      }

      }));

      Y.Test.Runner.add(suite);

});