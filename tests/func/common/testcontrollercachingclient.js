/*
 * This is a basic func test for a Common application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
    var suite = new Y.Test.Suite("Common: testcontrollercachingclient");

    suite.add(new Y.Test.Case({

        "test testcontrollercachingclient": function() {
	        var that = this;
            Y.one('#myMojitsButton').simulate('click');
            that.wait(function(){
                Y.one('#inputbox.ballinput').set('value', "basketball");
                Y.one('#pitchbutton').simulate('click');
                that.wait(function(){
                    Y.Assert.areEqual('pitched: basketball', Y.one('#ControllerCachingResult').get('innerHTML').match(/pitched: basketball/gi));
		            Y.one('#retrievebutton').simulate('click');
		            that.wait(function(){
                        Y.Assert.areEqual('ball: basketball', Y.one('#ControllerCachingResult').get('innerHTML').match(/ball: basketball/gi));
			            Y.one('#inputbox.ballinput').set('value', "softball");
                        Y.one('#pitchbutton').simulate('click');
			            that.wait(function(){
                            Y.Assert.areEqual('pitched: softball', Y.one('#ControllerCachingResult').get('innerHTML').match(/pitched: softball/gi));
				            Y.one('#retrievebutton').simulate('click');
				            that.wait(function(){
					           Y.Assert.areEqual('ball: softball', Y.one('#ControllerCachingResult').get('innerHTML').match(/ball: softball/gi));
				            }, 4000);
			             }, 4000);
		             }, 4000);
	             }, 4000);         
            }, 4000);
       }

    }));

    Y.Test.Runner.add(suite);
});