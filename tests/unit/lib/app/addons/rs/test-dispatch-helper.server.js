/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use(
    'base',
    'oop',
    'mojito-resource-store',
    'addon-rs-yui',
    'addon-rs-dispatch-helper',
    'json',
    'test',
    function(Y) {
    
    var suite = new YUITest.TestSuite('mojito-addon-rs-dispatch-helper-tests'),
        libpath = require('path'),
        mojitoRoot = libpath.join(__dirname, '../../../../../../lib'),
        A = Y.Assert;


    suite.add(new YUITest.TestCase({
        
        name: 'dispatch-helper rs addon tests',
        

        'augment getMojitTypeDetails with AC addons': function() {
            var fixtures = libpath.join(__dirname, '../../../../../fixtures/gsg5');
            var store = new Y.mojito.ResourceStore({ root: fixtures, mojitoRoot: mojitoRoot });
            store.preload();

            var details = store.getMojitTypeDetails('server', {}, 'PagedFlickr');
            // order matters
            var keys = Y.Object.keys(details.acAddons);
            A.areSame(4, keys.length, 'number of AC addons');
            A.areSame(JSON.stringify(['config','intl','params','url']), JSON.stringify(keys), 'correct order');
            A.areSame('mojito-config-addon', details.acAddons.config);
            A.areSame('mojito-intl-addon', details.acAddons.intl);
            A.areSame('mojito-params-addon', details.acAddons.params);
            A.areSame('mojito-url-addon', details.acAddons.url);
        }


    }));
    
    Y.Test.Runner.add(suite);
    
});
