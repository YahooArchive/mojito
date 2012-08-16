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
        "test mergeparamsserver": function() {
	        enterText(Y.one('#name'), "Everyone"); 
	        Y.one('#likes > option[value="ice cream"]').set('selected','selected'); 
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