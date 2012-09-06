/*
 * This is a basic func test for a Common application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
    var suite = new Y.Test.Suite("Common");

    suite.add(new Y.Test.Case({

	    "test compositemojit1client": function() {
            var that = this;
            Y.one('#composite_mojit_button').simulate('click');
            that.wait(function(){
                Y.one('#nav_h3').simulate('click');
                that.wait(function(){
                    Y.Assert.areEqual('news heard a click from nav \(type\: CM_Nav\) with the data\:', Y.one('#click1').get('innerHTML').match(/news heard a click from nav \(type\: CM_Nav\) with the data\:/gi));
                    Y.Assert.areEqual('Hi News!', Y.one('#click1').get('innerHTML').match(/Hi News!/gi));
                    Y.one('#nav_h3').simulate('click');
                    that.wait(function(){
                        Y.Assert.areEqual('news heard a click from nav \(type\: CM_Nav\) with the data\:', Y.one('#click2').get('innerHTML').match(/news heard a click from nav \(type\: CM_Nav\) with the data\:/gi));
                        Y.Assert.areEqual('Hi News!', Y.one('#click1').get('innerHTML').match(/Hi News!/gi));
                    }, 2000);
    	        }, 2000);
            }, 3000);
        }

   }));

   Y.Test.Runner.add(suite);

});