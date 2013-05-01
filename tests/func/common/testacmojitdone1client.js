/*
 * This is a basic func test for a Common application.
 */
YUI.add('acmojitdone1client-tests', function (Y) {

    var suite = new Y.Test.Suite("Common: acmojitdone1client");

    suite.add(new Y.Test.Case({

        "test acmojitdone1client": function() {
            var that = this;
            Y.one('#testcase > option[value="done1"]').set('selected','selected'); 
            Y.one('#acMojitButton').simulate('click');
            that.wait(function(){
                Y.Assert.areEqual('Hello Action Context Testing', Y.one('#ACMojitTest').get('innerHTML').match(/Hello Action Context Testing/gi));
            }, 4000);
        }

    }));

    Y.Test.Runner.add(suite);

}, '0.0.1', { requires: ['test', 'node', 'node-event-simulate', 'console']});
