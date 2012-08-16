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

        "test mojitproxydestroychild": function() {
            var that = this;
            Y.one('#destroychildButton').simulate('click');
            that.wait(function(){
	            Y.log("*****testing destroyChild*******");
	            Y.Assert.areEqual('I\'m a red child.', Y.one('#childred').get('innerHTML').match(/I\'m a red child./gi));
	            Y.Assert.areEqual('I\'m a blue child.', Y.all('#childblue').item(0).get('innerHTML').match(/I\'m a blue child./gi));
	            Y.Assert.areEqual('I\'m a blue child.', Y.all('#childblue').item(1).get('innerHTML').match(/I\'m a blue child./gi));
	            Y.Assert.areEqual('I\'m a green child.', Y.all('#childgreen').item(0).get('innerHTML').match(/I\'m a green child./gi));
	            Y.Assert.areEqual('I\'m a green child.', Y.all('#childgreen').item(1).get('innerHTML').match(/I\'m a green child./gi));
            }, 3000);
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