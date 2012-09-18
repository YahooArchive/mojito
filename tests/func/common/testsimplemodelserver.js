/*
 * This is a basic func test for a Common application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
    var suite = new Y.Test.Suite("Common: simplemodelserver");

    suite.add(new Y.Test.Case({

        "test simplemodelserver": function() {
            var that = this;
            Y.Assert.areEqual('Turkey Viewer 1.0', Y.one('#SimpleModelTitle').get('innerHTML').match(/Turkey Viewer 1.0/gi));
            var imglist = Y.all('img');
            imglist.each(function (taskNode) {
		        Y.Assert.areEqual('static.flickr.com', taskNode.get('src').match(/static.flickr.com/gi));
		    });
        }

    }));

    Y.Test.Runner.add(suite);
});