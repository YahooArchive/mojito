/*
 * This is a basic func test for a Common application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
    var suite = new Y.Test.Suite("Common: mojitproxygetfromurl");

    suite.add(new Y.Test.Case({
 
        "test mojitproxygetfromurl": function() {
            var that = this;
            Y.one('#mojitProxyMojitButton').simulate('click');
            that.wait(function(){
	            Y.Assert.areEqual('abc', Y.one('#thisvalue').get('innerHTML').match(/abc/gi));
            }, 4000);
        }

    }));

    Y.Test.Runner.add(suite);
});