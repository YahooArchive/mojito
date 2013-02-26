/*
 * This is a basic func test for a Common application.
 */
YUI.add('compositemojit1client-tests', function (Y) {
   
    var suite = new Y.Test.Suite("Common: compositemojit1client");

    suite.add(new Y.Test.Case({

	    "test compositemojit1client": function() {
            var that = this;
            Y.one('#composite_mojit_button').simulate('click');
            that.wait(function(){
                Y.one('#nav_h3').simulate('click');
                that.wait(function(){
                    Y.Assert.areEqual('news heard a click from nav \(type\: CM_Nav\) with the data\:', Y.one('#click1').get('innerHTML').match(/news heard a click from nav \(type\: CM_Nav\) with the data\:/gi));
                    Y.Assert.areEqual('Hi News!', Y.one('#click1').get('innerHTML').match(/Hi News!/gi));
                    Y.one('#nav_h3').simulate('click');
                    that.wait(function(){
                        Y.Assert.areEqual('news heard a click from nav \(type\: CM_Nav\) with the data\:', Y.one('#click2').get('innerHTML').match(/news heard a click from nav \(type\: CM_Nav\) with the data\:/gi));
                        Y.Assert.areEqual('Hi News!', Y.one('#click1').get('innerHTML').match(/Hi News!/gi));
                    }, 4000);
    	        }, 4000);
            }, 4000);
        }

   }));

   Y.Test.Runner.add(suite);

}, '0.0.1', { requires: ['node', 'test', 'node-event-simulate', 'console']});