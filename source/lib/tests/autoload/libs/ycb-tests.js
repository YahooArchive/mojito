/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-ycb-tests', function(Y, NAME) {

    var libycb = require(__dirname + '/../../../libs/ycb.js'),
        suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        OA = YUITest.ObjectAssert,
        AA = YUITest.ArrayAssert;

    suite.add(new YUITest.TestCase({

        name: 'ycb',

        setUp: function() {

        },

        tearDown: function() {

        },

        'test if we can use the module': function() {

            A.isTrue(libycb.version === '2.0.0');
        },

        'test _flattenDimension': function() {

            var dims = readFixtureFile('dimensions.json'),
                flat;

            flat = libycb._flattenDimension('', dims[0].dimensions[6]['lang']);

            //Y.log(JSON.stringify(flat,null,4));

            A.isTrue(flat['en'] === 'en');
            A.isTrue(flat['en/en_CA'] === 'en_CA');
            A.isTrue(flat['fr'] === 'fr');
            A.isTrue(flat['fr/fr_FR/fr_CA'] === 'fr_CA');
        },

        'test _flattenDimensions': function() {

            var dims = readFixtureFile('dimensions.json'),
                flat;

            flat = libycb._flattenDimensions(dims[0].dimensions);

            //Y.log(JSON.stringify(flat,null,4));

            A.isTrue(flat['lang']['en'] === 'en');
            A.isTrue(flat['lang']['en/en_CA'] === 'en_CA');
            A.isTrue(flat['lang']['fr'] === 'fr');
            A.isTrue(flat['lang']['fr/fr_FR/fr_CA'] === 'fr_CA');
        },

        'test _makeOrderedLookupList': function() {

            var dims = readFixtureFile('dimensions.json'),
                context, list;

            context = {
                    'region': 'ir',
                    'environment': 'preproduction',
                    'lang': 'fr_CA'
                };

            list = libycb._makeOrderedLookupList(dims[0].dimensions, context);

            //Y.log(JSON.stringify(list,null,4));

            A.isTrue(list['environment'][0] === 'preproduction');
            A.isTrue(list['lang'][0] === 'fr_CA');
            A.isTrue(list['region'][0] === 'ir');
        },

        'test _getLookupPath': function() {

            var dims = readFixtureFile('dimensions.json'),
                context, path;

            context = {
                    'region': 'ir',
                    'environment': 'preproduction',
                    'lang': 'fr_FR'
                };

            path = libycb._getLookupPath(dims[0].dimensions, context);

            //Y.log(JSON.stringify(paths,null,4));

            A.isTrue(path === 'preproduction/*/*/*/*/*/fr_FR/ir/*/*/*');
        },

        'test _getLookupPaths': function() {

            var dims = readFixtureFile('dimensions.json'),
                context, paths, expected;

            context = {
                    'region': 'ir',
                    'environment': 'preproduction',
                    'lang': 'fr_FR'
                };

            paths = libycb._getLookupPaths(dims[0].dimensions, context);
            //Y.log(JSON.stringify(paths,null,4));

            expected = [
                "*/*/*/*/*/*/*/*/*/*/*",
                "*/*/*/*/*/*/*/gb/*/*/*",
                "*/*/*/*/*/*/*/ir/*/*/*",
                "*/*/*/*/*/*/fr/*/*/*/*",
                "*/*/*/*/*/*/fr/gb/*/*/*",
                "*/*/*/*/*/*/fr/ir/*/*/*",
                "*/*/*/*/*/*/fr_FR/*/*/*/*",
                "*/*/*/*/*/*/fr_FR/gb/*/*/*",
                "*/*/*/*/*/*/fr_FR/ir/*/*/*",
                "preproduction/*/*/*/*/*/*/*/*/*/*",
                "preproduction/*/*/*/*/*/*/gb/*/*/*",
                "preproduction/*/*/*/*/*/*/ir/*/*/*",
                "preproduction/*/*/*/*/*/fr/*/*/*/*",
                "preproduction/*/*/*/*/*/fr/gb/*/*/*",
                "preproduction/*/*/*/*/*/fr/ir/*/*/*",
                "preproduction/*/*/*/*/*/fr_FR/*/*/*/*",
                "preproduction/*/*/*/*/*/fr_FR/gb/*/*/*",
                "preproduction/*/*/*/*/*/fr_FR/ir/*/*/*"
            ];
            AA.itemsAreEqual(expected, paths);
        },

        'test _processRawBundle': function() {

            var bundle, ycb;

            bundle = readFixtureFile('dimensions.json')
                     .concat(readFixtureFile('simple-1.json')[0]);

            //Y.log(JSON.stringify(bundle,null,4));

            ycb = libycb._processRawBundle(bundle);

            //Y.log(JSON.stringify(ycb,null,4));

            A.isTrue(ycb.settings['*/*/*/*/*/*/*/*/*/*/*'].title_key === 'YRB_YAHOO');
            A.isTrue(typeof ycb.dimensions[7].region.us !== 'undefined');
        },

        'test _processRawBundle with dupe error': function() {

            var bundle, ycb;

            bundle = readFixtureFile('dimensions.json')
                     .concat(readFixtureFile('simple-1.json'))
                     .concat(readFixtureFile('simple-2.json'));

            //Y.log(JSON.stringify(bundle,null,4));

            // This should throw an error for us to trap
            try{
                ycb = libycb._processRawBundle(bundle);
            }catch(err){
                A.isTrue(true);
                return;
            }

            //Y.log(JSON.stringify(ycb,null,4));

            A.isTrue(false);
        },

        'test _processRawBundle with many settings': function() {

            var bundle, ycb;

            bundle = readFixtureFile('dimensions.json')
                     .concat(readFixtureFile('simple-1.json'))
                     .concat(readFixtureFile('simple-3.json'));

            //Y.log(JSON.stringify(bundle,null,4));

            ycb = libycb._processRawBundle(bundle);

            //Y.log(JSON.stringify(ycb,null,4));

            A.isTrue(ycb.settings['*/*/*/*/*/*/*/*/*/*/*'].title_key === 'YRB_YAHOO');
            A.isTrue(ycb.settings['*/*/*/*/*/*/*/fr/*/*/*'].links.home === 'http://fr.yahoo.com');
            A.isTrue(ycb.settings['*/*/*/*/*/*/*/fr/*/*/bt'].logo === 'yahoo_bt_FR.png');
            A.isTrue(typeof ycb.dimensions[7].region.us !== 'undefined');
        },

        'test _applySubstitutions': function() {

            var config, ycb;

            config = readFixtureFile('substitutions.json');

            //Y.log(JSON.stringify(config,null,4));

            libycb._applySubstitutions(config);

            //Y.log(JSON.stringify(config,null,4));

            A.isTrue(config.key0.key4 === 'The value of key0.key2 is value2');
            A.isTrue(config.key5.key4 === 'The value of key0.key2 is value2');
            A.isTrue(config.key6.key7.key8.key4 === 'The value of key0.key2 is value2');
            A.isTrue(config.key6.key9[2] === 'The value of key0.key2 is value2');
            A.isTrue(config['$$key0.key1$$'] === 'error');
            A.isTrue(config.key10.key11.key4 === 'The value of key0.key2 is value2');
            A.isTrue(config.key11[4] === 'The value of key0.key2 is value2');
            A.isTrue(config.key8.key4 === 'The value of key0.key2 is value2');
        },

        'test if we can use a simple config': function() {

            var bundle, ycb;

            bundle = readFixtureFile('simple-1.json');

            ycb = libycb.read(bundle);

            //Y.log(JSON.stringify(ycb,null,4));

            A.isTrue(ycb.title_key === 'YRB_YAHOO');
            A.isTrue(ycb.links.home === 'http://www.yahoo.com');
            A.isTrue(ycb.links.mail === 'http://mail.yahoo.com');
        },

        'test if we can use a simple config with dimensions': function() {

            var bundle, ycb;

            bundle = readFixtureFile('dimensions.json')
                     .concat(readFixtureFile('simple-1.json'));

            ycb = libycb.read(bundle);

            A.isTrue(ycb.title_key === 'YRB_YAHOO');
            A.isTrue(ycb.links.home === 'http://www.yahoo.com');
            A.isTrue(ycb.links.mail === 'http://mail.yahoo.com');
        },

        'test if we can use a simple config with dimensions and extra settings': function() {

            var bundle, ycb;

            bundle = readFixtureFile('dimensions.json')
                     .concat(readFixtureFile('simple-1.json'))
                     .concat(readFixtureFile('simple-3.json'));

            ycb = libycb.read(bundle);

            A.isTrue(ycb.title_key === 'YRB_YAHOO');
            A.isTrue(ycb.links.home === 'http://www.yahoo.com');
            A.isTrue(ycb.links.mail === 'http://mail.yahoo.com');
        },

        'test if we can use a simple config with dimensions and conext IR': function() {

            var bundle, context, ycb;

            bundle = readFixtureFile('dimensions.json')
                     .concat(readFixtureFile('simple-1.json'))
                     .concat(readFixtureFile('simple-3.json'));

            context = {
                    'region': 'ir',
                    'environment': 'preproduction',
                    'lang': 'fr_FR'
                };

            ycb = libycb.read(bundle, context);
            //Y.log(JSON.stringify(ycb,null,4));

            A.isTrue(ycb.title_key === 'YRB_YAHOO');
            A.isTrue(ycb.logo === 'yahoo_FR.png');
            A.isTrue(ycb.links.home === 'http://gb.yahoo.com');
            A.isTrue(ycb.links.mail === 'http://gb.mail.yahoo.com');
        },

        'test if we can use a simple config with dimensions and conext FR': function() {

            var bundle, context, ycb;

            bundle = readFixtureFile('dimensions.json')
                     .concat(readFixtureFile('simple-1.json'))
                     .concat(readFixtureFile('simple-3.json'));

            context = {
                    'region': 'fr',
                    'environment': 'preproduction',
                    'lang': 'fr_FR'
                };

            ycb = libycb.read(bundle, context);

            //Y.log(JSON.stringify(ycb,null,4));

            A.isTrue(ycb.title_key === 'YRB_YAHOO');
            A.isTrue(ycb.logo === 'yahoo_FR.png');
            A.isTrue(ycb.links.home === 'http://fr.yahoo.com');
            A.isTrue(ycb.links.mail === 'http://fr.mail.yahoo.com');
        },

        'test if we can use a simple config with dimensions and conext GB & BT': function() {

            var bundle, context, ycb;

            bundle = readFixtureFile('dimensions.json')
                     .concat(readFixtureFile('simple-1.json'))
                     .concat(readFixtureFile('simple-3.json'));

            context = {
                    'region': 'gb',
                    'environment': 'preproduction',
                    'flavor': 'bt'
                };

            ycb = libycb.read(bundle, context);
            //Y.log(JSON.stringify(ycb,null,4));

            A.isTrue(ycb.title_key === 'YRB_YAHOO');
            A.isTrue(ycb.logo === 'yahoo_bt_GB.png');
            A.isTrue(ycb.links.home === 'http://gb.yahoo.com');
            A.isTrue(ycb.links.mail === 'http://gb.mail.yahoo.com');
        },

        'test ycb accepts falsey config values': function() {
            var bundle,
                ycb,
                foo = {
                    settings: [ 'master' ],
                    title_key: 'YRB_YAHOO',
                    'data-url': 'http://service.yahoo.com',
                    logo: 'yahoo.png',
                    false_ok: false,
                    zero: 0,
                    undef: undefined,
                    links: { home: 'http://www.yahoo.com', mail: 'http://mail.yahoo.com' }
                };

            bundle = readFixtureFile('dimensions.json').concat([foo]);

            ycb = libycb.read(bundle);

            A.areEqual(ycb['data-url'], foo['data-url']);

            A.isTrue('false_ok' in ycb);
            A.areEqual(ycb.false_ok, foo.false_ok);

            A.isTrue('undef' in ycb);
            A.areEqual(ycb.undef, foo.undef);

            A.isTrue('zero' in ycb);
            A.areEqual(ycb.zero, foo.zero);
        }

    }));

    function readFixtureFile(file){

        var path = require('path').join(__dirname, '../../', 'fixtures/ycb' , file),
            data = require('fs').readFileSync(path, 'utf8');

        return JSON.parse(data);
    }

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: []});
