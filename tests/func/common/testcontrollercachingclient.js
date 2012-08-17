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

        "test testcontrollercachingclient": function() {
	        var that = this;
            Y.one('#myMojitsButton').simulate('click');
            that.wait(function(){
                enterText(Y.all('#inputbox').item(1), "basketball"); 
                Y.all('#pitchbutton').item(1).simulate('click');
                that.wait(function(){
                    Y.Assert.areEqual('pitched: basketball', Y.one('#ControllerCachingResult').get('innerHTML').match(/pitched: basketball/gi));
		            Y.all('#retrievebutton').item(1).simulate('click');
		            that.wait(function(){
                        Y.Assert.areEqual('ball: basketball', Y.one('#ControllerCachingResult').get('innerHTML').match(/ball: basketball/gi));
			            enterText(Y.all('#inputbox').item(2), "softball"); 
                        Y.all('#pitchbutton').item(2).simulate('click');
			            that.wait(function(){
                            Y.Assert.areEqual('pitched: softball', Y.one('#ControllerCachingResult').get('innerHTML').match(/pitched: softball/gi));
				            Y.all('#retrievebutton').item(2).simulate('click');
				            that.wait(function(){
					           Y.Assert.areEqual('ball: softball', Y.one('#ControllerCachingResult').get('innerHTML').match(/ball: softball/gi));
				            }, 1000);
			             }, 1000);
		             }, 1000);
	             }, 1000);         
            }, 1000);
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