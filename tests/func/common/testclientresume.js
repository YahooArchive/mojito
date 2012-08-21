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

        "test clientresumefunc": function() {
            var that = this;
            Y.one('#mojitProxyPauseResumeButton').simulate('click');
            that.wait(function(){
	            Y.Assert.areEqual('Testing ac.pause And ac.resume', Y.one('#MojitProxyMojitResult').get('innerHTML').match(/Testing ac.pause And ac.resume/gi));
	            Y.one('#pauseButton').simulate('click');
	            that.wait(function(){
		            Y.one('#mojitProxyMojitButton').simulate('click');
		            that.wait(function(){
			            Y.Assert.areEqual('Testing ac.pause And ac.resume', Y.one('#MojitProxyMojitResult').get('innerHTML').match(/Testing ac.pause And ac.resume/gi));
			            Y.one('#resumeButton').simulate('click');
			            that.wait(function(){
				            Y.Assert.areEqual('this is my data: abc', Y.one('#thisdata').get('innerHTML').match(/this is my data: abc/gi));
			            }, 2000);
		            }, 2000);
	            }, 2000);
            }, 2000);
        }

    }));

    Y.Test.Runner.add(suite);

    function enterText(node, str){
        for (var i = 0, length = str.length; i < length; i++) {
            node.simulate("keypress", {
                charCode: str.charCodeAt(i)
            }); 	
        }
    }
});