/*
 * This is a basic func test for a Common application.
 */
YUI({
     useConsoleOutput: true,
     useBrowserConsole: true,
     logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {

     var suite = new Y.Test.Suite("Common: ACPartailRenderClient");

     suite.add(new Y.Test.Case({

        "test ACPartailRenderClient": function() {
	        var that = this;
            Y.one('#partialRenderButton').simulate('click');
            that.wait(function(){
                Y.Assert.areEqual('this is my data: data not from url', Y.one('#subdata').get('innerHTML').match(/this is my data: data not from url/gi));
            }, 4000);
        }

     }));

     Y.Test.Runner.add(suite);

});

