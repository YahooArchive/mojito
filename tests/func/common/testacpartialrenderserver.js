/*
 * This is a basic func test for a Common application.
 */
YUI.add('common-testacpartialrenderserver-tests', function (Y) {
     var suite = new Y.Test.Suite("Common: acpartailrenderserver");

     suite.add(new Y.Test.Case({

	     "test acpartailrenderserver": function() {
             var that = this;
	         that.wait(function(){
	             Y.Assert.areEqual(Y.one('pre').get('innerHTML').match(/this is my data: data not from url/gi), 'this is my data: data not from url');
	         }, 2000);
         }

     }));

     Y.Test.Runner.add(suite);
     
}, '0.0.1', {requires: [
    'node', 'node-event-simulate', 'test', 'console'
]});