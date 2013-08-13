
YUI.add('Youtube-tests', function (Y) {

    var suite = new YUITest.TestSuite('Youtube-tests'),
        controller = null,
        A = YUITest.Assert;

    suite.add(new YUITest.TestCase({

        name: 'Youtube user tests',

        setUp: function () {
            controller = Y.mojito.controllers.Youtube;
            //Y.log("controllers");
            //Y.log(Y.mojito.controllers);
        },
        tearDown: function () {
            controller = null;
        },

        'test mojit 001': function () {
            var ac,
                assetsResults,
                doneResults;
                modelData = [
                    {
                        title: 'sometitle',
                        id: "http://gdata.youtube.com/feeds/base/videos/1234"
                    }
                ];
            ac = {
                assets: {
                    addCss: function (css) {
                        assetsResults = css;
                    }
                },
                models: {
                    get: function (modelName) {
                        A.areEqual('YoutubeModelYQL', modelName, 'wrong model name');

                        return {
                            getData: function (params, cb) {
                                Y.log("youtube: modelData");
                                Y.log(modelData);

                                cb(modelData);
                            }
                        };
                    }
                },
                done: function (data) {
                    doneResults = data;
                }
            };

            A.isNotNull(controller);
            A.isFunction(controller.index, "not a function");
            controller.index(ac);
            A.isObject(doneResults);
        }
    }));
    YUITest.TestRunner.add(suite);
}, '0.0.1', {requires: ['mojito-test', 'Youtube']});
