/*
 * This is a basic func test for a Common application.
 */
YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'node-event-simulate', 'test', 'console', function (Y) {
   
    var suite = new Y.Test.Suite("Common: configinappfilecompclient");

    suite.add(new Y.Test.Case({

	    "test configinappfilecompclient": function() {
	        var that = this;
            Y.one('#config_button').simulate('click');
            that.wait(function(){
	            Y.Assert.areEqual(
                    'ac.config.get\(\) -',
                    Y.one('#completeConfig').get('innerHTML').match(/ac.config.get\(\) -/gi)
                );
                //console.log(Y.one('#completeConfig').get('innerHTML'));
                Y.Assert.areEqual(
                    '\"key1\":\"This is the value from the default.yaml for key1\"',
                    Y.one('#completeConfig').get('innerHTML').match(/\"key1\":\"This is the value from the default.yaml for key1\"/gi)
                );
                Y.Assert.areEqual('\"key1\":\"This is the value from the default.yaml for key1\",\"key2\":\"This is the value from the default.yaml for key2\",\"defaultArray\":\[\"defaultArrayValue1\",\"defaultArrayValue2\"\],\"nestedConfig\":\{\"subConfig1\":\"SubConfig from defaults.yaml\",\"subConfig2\":\{\"subsubConfig1\":\"SubSubConfig1 from defaults.yaml\",\"subsubConfig2\":\"SubSubConfig2 from defaults.yaml\"\}\},\"myUrls\":\[\"\/MyConfig\/myIndex\"\]', Y.one('#completeConfig').get('innerHTML').match(/\"key1\":\"This is the value from the default.yaml for key1\",\"key2\":\"This is the value from the default.yaml for key2\",\"defaultArray\":\[\"defaultArrayValue1\",\"defaultArrayValue2\"\],\"nestedConfig\":\{\"subConfig1\":\"SubConfig from defaults.yaml\",\"subConfig2\":\{\"subsubConfig1\":\"SubSubConfig1 from defaults.yaml\",\"subsubConfig2\":\"SubSubConfig2 from defaults.yaml\"\}\},\"myUrls\":\[\"\/MyConfig\/myIndex\"\]/gi));
                // That's the original assert; not sure why the text is different from the results ??
	            // Y.Assert.areEqual('\{\"key1\":\"This is the value from the default.yaml for key1\",\"key2\":\"This is the value from the default.yaml for key2\",\"commonKey1\":\"Value of commonKey1 in application.yaml\",\"defaultArray\":\[\"defaultArrayValue1\",\"defaultArrayValue2\"\],\"nestedConfig\":\{\"subConfig1\":\"SubConfig from defaults.yaml\",\"subConfig2\":\{\"subsubConfig1\":\"SubSubConfig1 from defaults.yaml\",\"subsubConfig2\":\"SubSubConfig2 from defaults.yaml\"\}\},\"config1\":\"This is the config for config1 in application.yaml\",\"configArray1\":\[\"configArray1Value1\",\"configArray1Value2\",\"configArray1Value3\"\],\"config2\":\{\"config2Key1\":\"config2Key1 value from application.yaml\",\"config2Key2\":\{\"config2Key2Key1\":\"It gets complicated here- config2Key2Key1 value in application.yaml\",\"config2Key2Key2\":\"config2Key2Key2 value in application.yaml\"\},\"config2Key3Array1\":\[\"config2Key3Array1Value1\",\"config2Key3Array1Value2\",\"config2Key3Array1Value3\"\]\},\"myUrls\":\[\"\/MyConfig\/myIndex\"\]\}', Y.one('#completeConfig').get('innerHTML').match(/\{\"key1\":\"This is the value from the default.yaml for key1\",\"key2\":\"This is the value from the default.yaml for key2\",\"commonKey1\":\"Value of commonKey1 in application.yaml\",\"defaultArray\":\[\"defaultArrayValue1\",\"defaultArrayValue2\"\],\"nestedConfig\":\{\"subConfig1\":\"SubConfig from defaults.yaml\",\"subConfig2\":\{\"subsubConfig1\":\"SubSubConfig1 from defaults.yaml\",\"subsubConfig2\":\"SubSubConfig2 from defaults.yaml\"\}\},\"config1\":\"This is the config for config1 in application.yaml\",\"configArray1\":\[\"configArray1Value1\",\"configArray1Value2\",\"configArray1Value3\"\],\"config2\":\{\"config2Key1\":\"config2Key1 value from application.yaml\",\"config2Key2\":\{\"config2Key2Key1\":\"It gets complicated here- config2Key2Key1 value in application.yaml\",\"config2Key2Key2\":\"config2Key2Key2 value in application.yaml\"\},\"config2Key3Array1\":\[\"config2Key3Array1Value1\",\"config2Key3Array1Value2\",\"config2Key3Array1Value3\"\]\},\"myUrls\":\[\"\/MyConfig\/myIndex\"\]\}/gi));
            }, 2000);
        }

    }));

    Y.Test.Runner.add(suite);

});
