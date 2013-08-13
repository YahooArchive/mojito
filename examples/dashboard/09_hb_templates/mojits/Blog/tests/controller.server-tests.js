
YUI.add('Blog-tests', function (Y) {

    var suite = new YUITest.TestSuite('Blog-tests'),
        controller = null,
        A = YUITest.Assert,
        model;

    suite.add(new YUITest.TestCase({

        name: 'Blog user tests',

        setUp: function () {
            controller = Y.mojito.controllers.Blog;
            model = Y.mojito.models.BlogModelYQL;
        },
        tearDown: function () {
            controller = null;
        },

        'test mojit': function () {
            var ac,
                modelData,
                assetsResults,
                doneResults,
                route_param,
                def_value;
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
                        A.areEqual('BlogModelYQL', modelName, 'wrong model name');
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
}, '0.0.1', {requires: ['mojito-test', 'Blog', 'BlogModelYQL']});
