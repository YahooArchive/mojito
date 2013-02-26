/*
 * This is a basic func test for a Common application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
    var suite = new Y.Test.Suite("Common: mojitproxyrefreshview");

    suite.add(new Y.Test.Case({
 
        "test mojitproxyrefreshview": function() {
            var that = this;
            Y.one('#mojitProxyRefreshButton').simulate('click');
            that.wait(function(){
	            Y.Assert.areEqual('Testing ac.refreshView', Y.one('#MojitProxyMojitResult').get('innerHTML').match(/Testing ac.refreshView/gi));
	            Y.one('#refreshViewButton').simulate('click');
	            that.wait(function(){
		            Y.Assert.areEqual('Testing ac.refreshView', Y.one('#MojitProxyMojitResult').get('innerHTML').match(/Testing ac.refreshView/gi));
	            }, 4000);
            }, 4000);
        }

    }));

    Y.Test.Runner.add(suite);
});