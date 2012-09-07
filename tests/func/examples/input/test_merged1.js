/*
 * This is a basic func test for a UseCase application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
         var suite = new Y.Test.Suite("input");

         suite.add(new Y.Test.Case({
         
             "test merged": function() {
                 Y.Assert.areEqual("Merged Parameters Example", Y.one('h1').get('innerHTML'));
                 Y.Assert.areEqual("POST Parameters", Y.one('h2').get('innerHTML'));
                 Y.Assert.areEqual("Submit for for example of POST processing.", Y.one('p').get('innerHTML'));
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

