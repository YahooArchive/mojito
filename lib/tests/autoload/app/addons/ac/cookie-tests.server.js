/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-cookie-addon-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'cookie tests',
        
        'set cookie': function() {
            var headerAdded = false;
            var c = new Y.mojito.addons.ac.cookie(null, null, {
                http: {
                    addHeader: function(name, cookie) {
                        headerAdded = true;
                        A.areSame('Set-Cookie', name, 'bad cookie header name');
                        A.areSame('key=val', cookie, 'wrong cookie value');
                    },
                    getRequest: function() {}
                }
            });

            c.set('key', 'val');
            
            A.isTrue(headerAdded, 'cookie not set');
        },

        'set cookie with options': function() {
            var headerAdded = false;
            var c = new Y.mojito.addons.ac.cookie(null, null, {
                http: {
                    addHeader: function(name, cookie) {
                        headerAdded = true;
                        A.areSame('Set-Cookie', name, 'bad cookie header name');
                        A.areSame('key=val; Path=path; Domain=domain', cookie, 'wrong cookie value');
                    },
                    getRequest: function() {}
                }
            });

            c.set('key', 'val', {path: 'path', domain: 'domain'});

            A.isTrue(headerAdded, 'cookie not set');
        },
        
        'get cookie by key': function() {
            var c = new Y.mojito.addons.ac.cookie(null, null, {
                http: {
                    getRequest: function() {
                        return {
                            cookies: {one: 1}
                        };
                    }
                }
            });

            var value = c.get('one');
            
            A.areSame(1, value, 'bad cookie value');
        },

        'get all cookies': function() {
            var c = new Y.mojito.addons.ac.cookie(null, null, {
                http: {
                    getRequest: function() {
                        return {
                            cookies: 'COOKIES'
                        };
                    }
                }
            });

            var value = c.get();

            A.areSame('COOKIES', value, 'bad cookie value');
        }
        
    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojito-cookie-addon']});
