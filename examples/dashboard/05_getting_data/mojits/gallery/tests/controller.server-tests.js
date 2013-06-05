

YUI.add('Gallery-tests', function (Y) {

    var suite = new YUITest.TestSuite('Gallery-tests'),
        controller = null,
        model = null,
        A = YUITest.Assert;

    suite.add(new YUITest.TestCase({

        name: 'Gallery user tests',

        setUp: function () {
            controller = Y.mojito.controllers.Gallery;
            model = Y.mojito.models.galleryModelYQL;
        },
        tearDown: function () {
            controller = null;
        },
        'test mojit': function () {
            var ac,
                assetsResults,
                doneResults,
                def_value,
                route_param;
            ac = {
                assets: {
                    addCss: function (css) {
                        assetsResults = "joe";
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
                        A.areEqual('galleryModelYQL', modelName, 'wrong model name');
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

}, '0.0.1', {requires: ['mojito-test', 'Gallery', 'galleryModelYQL']});
