
YUI.add('YoutubeModelYQL-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        model = null,
        A = YUITest.Assert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'YoutubeModelFoo user tests',
        
        setUp: function() {
            model = Y.mojito.models.YoutubeModelYQL;
        },
        tearDown: function() {
            model = null;
        },
        
        'test mojit model': function() {
            var called = false,
                cfg = { color: 'red' };

            A.isNotNull(model);

            A.isFunction(model.init);
            model.init(cfg);
            A.areSame(cfg, model.config);

            A.isFunction(model.getData);
            model.getData({}, function(data) {
                called = true;
                A.isObject(data);
                A.isTrue(called);
            });
        }
        
    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojito-test', 'YoutubeModelYQL']});
