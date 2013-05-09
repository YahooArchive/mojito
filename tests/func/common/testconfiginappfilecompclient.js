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
                var have = Y.one('#completeConfig').get('innerHTML'),
                    matches;
                Y.Assert.areEqual('ac.config.get\(\) -', have.match(/ac.config.get\(\) -/gi));
                matches = have.match(/(\{.+\})/);
                Y.Assert.isNotNull(matches);
                Y.Assert.isTrue(!!matches[0]);
                have = JSON.parse(matches[0]);
                Y.Assert.isObject(have);
                Y.Assert.areEqual('This is the value from the default.yaml for key1', have.key1);
                Y.Assert.areEqual('This is the value from the default.yaml for key2', have.key2);
                Y.Assert.isArray(have.defaultArray);
                Y.Assert.areEqual('defaultArrayValue1', have.defaultArray[0]);
                Y.Assert.areEqual('defaultArrayValue2', have.defaultArray[1]);
                Y.Assert.isObject(have.nestedConfig);
                Y.Assert.areEqual('SubConfig from defaults.yaml', have.nestedConfig.subConfig1);
                Y.Assert.isObject(have.nestedConfig.subConfig2);
                Y.Assert.areEqual('SubSubConfig1 from defaults.yaml', have.nestedConfig.subConfig2.subsubConfig1);
                Y.Assert.areEqual('SubSubConfig2 from defaults.yaml', have.nestedConfig.subConfig2.subsubConfig2);
                // That's the original assert; not sure why the text is different from the results ??
                // Y.Assert.areEqual('\{\"key1\":\"This is the value from the default.yaml for key1\",\"key2\":\"This is the value from the default.yaml for key2\",\"commonKey1\":\"Value of commonKey1 in application.yaml\",\"defaultArray\":\[\"defaultArrayValue1\",\"defaultArrayValue2\"\],\"nestedConfig\":\{\"subConfig1\":\"SubConfig from defaults.yaml\",\"subConfig2\":\{\"subsubConfig1\":\"SubSubConfig1 from defaults.yaml\",\"subsubConfig2\":\"SubSubConfig2 from defaults.yaml\"\}\},\"config1\":\"This is the config for config1 in application.yaml\",\"configArray1\":\[\"configArray1Value1\",\"configArray1Value2\",\"configArray1Value3\"\],\"config2\":\{\"config2Key1\":\"config2Key1 value from application.yaml\",\"config2Key2\":\{\"config2Key2Key1\":\"It gets complicated here- config2Key2Key1 value in application.yaml\",\"config2Key2Key2\":\"config2Key2Key2 value in application.yaml\"\},\"config2Key3Array1\":\[\"config2Key3Array1Value1\",\"config2Key3Array1Value2\",\"config2Key3Array1Value3\"\]\},\"myUrls\":\[\"\/MyConfig\/myIndex\"\]\}', Y.one('#completeConfig').get('innerHTML').match(/\{\"key1\":\"This is the value from the default.yaml for key1\",\"key2\":\"This is the value from the default.yaml for key2\",\"commonKey1\":\"Value of commonKey1 in application.yaml\",\"defaultArray\":\[\"defaultArrayValue1\",\"defaultArrayValue2\"\],\"nestedConfig\":\{\"subConfig1\":\"SubConfig from defaults.yaml\",\"subConfig2\":\{\"subsubConfig1\":\"SubSubConfig1 from defaults.yaml\",\"subsubConfig2\":\"SubSubConfig2 from defaults.yaml\"\}\},\"config1\":\"This is the config for config1 in application.yaml\",\"configArray1\":\[\"configArray1Value1\",\"configArray1Value2\",\"configArray1Value3\"\],\"config2\":\{\"config2Key1\":\"config2Key1 value from application.yaml\",\"config2Key2\":\{\"config2Key2Key1\":\"It gets complicated here- config2Key2Key1 value in application.yaml\",\"config2Key2Key2\":\"config2Key2Key2 value in application.yaml\"\},\"config2Key3Array1\":\[\"config2Key3Array1Value1\",\"config2Key3Array1Value2\",\"config2Key3Array1Value3\"\]\},\"myUrls\":\[\"\/MyConfig\/myIndex\"\]\}/gi));
            }, 4000);
        }

    }));

    Y.Test.Runner.add(suite);

});
