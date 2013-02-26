/*
 * This is a basic func test for a Common application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
    var suite = new Y.Test.Suite("Common: mojitproxygetid");

    suite.add(new Y.Test.Case({
 
        "test mojitproxygetid": function() {
            var that = this;
            Y.one('#mojitProxyMojitButton').simulate('click');
            that.wait(function(){
	            Y.log("************"+Y.one('#thisid').get('innerHTML'));
	            Y.Assert.areEqual('yui_', Y.one('#thisid').get('innerHTML').match(/yui_/gi));
            }, 4000);
        }
    }));

    Y.Test.Runner.add(suite);
});