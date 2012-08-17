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

        "test broadcaststaticunlistenall": function() {
            var that = this;
            Y.one('#staticButton').simulate('click');
            that.wait(function(){
	            Y.log("*****testing broadcast all and listen *******");
	            Y.Assert.areEqual('I\'m a red child.',Y.all('#childred').item(0).get('innerHTML').match(/I\'m a red child./gi));
	            Y.Assert.areEqual('I\'m a red child.', Y.all('#childred').item(1).get('innerHTML').match(/I\'m a red child./gi));
	            Y.Assert.areEqual('I\'m a blue child.', Y.all('#childblue').item(0).get('innerHTML').match(/I\'m a blue child./gi));
	            Y.Assert.areEqual('I\'m a blue child.', Y.all('#childblue').item(1).get('innerHTML').match(/I\'m a blue child./gi));
	            Y.Assert.areEqual('I\'m a green child.', Y.all('#childgreen').item(0).get('innerHTML').match(/I\'m a green child./gi));
	            Y.Assert.areEqual('I\'m a green child.', Y.all('#childgreen').item(1).get('innerHTML').match(/I\'m a green child./gi));
	            enterText(Y.one('#message'), "four"); 
	            enterText(Y.one('#child'), "all"); 
	            Y.one('#sendbutton').simulate('click');
	            that.wait(function(){
		            Y.log("*****after clicking*******");
		            Y.Assert.areEqual('I\'m a red child.', Y.all('#childred').item(0).get('innerHTML').match(/I\'m a red child./gi));
		            Y.Assert.areEqual('I\'m a red child.', Y.all('#childred').item(1).get('innerHTML').match(/I\'m a red child./gi));
		            Y.Assert.areEqual('Recieved message "hellofour" from yui_', Y.all('#childblue').item(0).get('innerHTML').match(/Recieved message "hellofour" from yui_/gi));
		            Y.Assert.areEqual('Recieved message "hellofour" from yui_', Y.all('#childblue').item(1).get('innerHTML').match(/Recieved message "hellofour" from yui_/gi));
		            Y.Assert.areEqual('I\'m a green child.', Y.all('#childgreen').item(0).get('innerHTML').match(/I\'m a green child./gi));
		            Y.Assert.areEqual('I\'m a green child.', Y.all('#childgreen').item(1).get('innerHTML').match(/I\'m a green child./gi));
	            }, 5000);
            }, 5000);
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