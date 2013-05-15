/*
 * This is a basic func test for a Common application.
 */
YUI.add('common-testacpartialinvokeserver-tests', function (Y) {
    var suite = new Y.Test.Suite("Common: acpartialinvokeserver");

     suite.add(new Y.Test.Case({
	     "test acpartialinvokeserver": function() {
             var that = this;
             that.wait(function(){
                 Y.Assert.areEqual(Y.one('pre').get('innerHTML').match(/This is mytest1/gi), 'This is mytest1');
                 Y.Assert.areEqual(Y.one('pre').get('innerHTML').match(/data from url/gi), 'data from url');
             }, 2000);    
         }
    }));

    Y.Test.Runner.add(suite);
    
}, '0.0.1', { requires: [
    'node', 'node-event-simulate', 'test', 'console'
]});
    
