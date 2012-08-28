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
 
        "test mojitproxyrefreshtemplate": function() {
            var that = this;
            Y.one('#mojitProxyRefreshButton').simulate('click');
            that.wait(function(){
	            Y.Assert.areEqual('Testing ac.refreshTemplate', Y.one('#MojitProxyMojitResult').get('innerHTML').match(/Testing ac.refreshTemplate/gi));
	            Y.one('#refreshTemplateButton').simulate('click');
	            that.wait(function(){
		            Y.Assert.areEqual('Testing ac.refreshTemplate', Y.one('#MojitProxyMojitResult').get('innerHTML').match(/Testing ac.refreshTemplate/gi));
	            }, 3000);
            }, 3000);
        }

    }));

    Y.Test.Runner.add(suite);
});
