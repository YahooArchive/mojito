/*
 * This is a basic func test for a Common application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
    var suite = new Y.Test.Suite("Common: acmojitdone10client");

    suite.add(new Y.Test.Case({

      "test acmojitdone10client": function() {
          var that = this;
          Y.one('#testcase > option[value="done10"]').set('selected','selected'); 
          Y.one('#acMojitButton').simulate('click');
          that.wait(function(){
              Y.Assert.areEqual("1,2,,4", Y.one('#ACMojitTest').get('innerHTML').match(/1,2,,4/gi));
          }, 4000);
      }

      }));

      Y.Test.Runner.add(suite);

});