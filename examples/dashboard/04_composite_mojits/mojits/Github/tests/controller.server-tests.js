YUI.add('Github-tests', function (Y) {

    var suite = new YUITest.TestSuite('Github-tests'),
        controller = null,
        A = YUITest.Assert,
        model;

    suite.add(new YUITest.TestCase({

        name: 'Github user tests',

        setUp: function () {
            controller = Y.mojito.controllers.Github;
            model = Y.mojito.models.StatsModelYQL;
        },
        tearDown: function () {
            controller = null;
        },
        'test mojit': function () {
            var ac,
                modelData,
                assetsResults,
                route_param,
                doneResults,
                def_value;
            modelData = { x: 'y' };
            ac = {
                assets: {
                    addCss: function (css) {
                        assetsResults = css;
                    }
                },
                config: {
                    getDefinition: function (key) {
                        def_value = key;
                    }
                },
                params: {
                    getFromRoute: function (param) {
                        route_param = param;
                    }
                },
                models: {
                    get: function (modelName) {
                        A.areEqual('StatsModelYQL', modelName, 'wrong model name');
                        return model;
                    }
                },
                done: function (data) {
                    doneResults = data;
                }
            };

            A.isNotNull(controller);
            A.isFunction(controller.index);
            controller.index(ac);
        }

    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: ['mojito-test', 'Github', 'StatsModelYQL']});

