/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-params-addon-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        Addon = Y.mojito.addons.ac.params,
        A = YUITest.Assert;

    function create(p) {
        return new Addon({params: p});
    }

    suite.add(new YUITest.TestCase({
    
        name: 'param tests',
        
        'getAll function: accessing url, body, route, file params': function() {
            var p = create({
                body: {
                    foo: 'postfooval',
                    bar: 'postbarval',
                    baz: 'postbazval',
                    boo: 'postbooval'
                },
                url: {
                    foo: 'getfooval',
                    bar: 'getbarval',
                    baz: 'getbazval',
                },
                route: {
                    foo: 'routefooval',
                    bar: 'routebarval'
                },
                file: {
                    foo: 'filefooval'
                }
            });

            var params = p.getAll();

            A.isNotUndefined(params.body.foo);
            A.isNotUndefined(params.body.bar);
            A.isNotUndefined(params.body.baz);
            A.isNotUndefined(params.body.boo);

            //A.areSame('filefooval', params.file.foo); Not implemented
            A.areSame('routebarval', params.route.bar);
            A.areSame('getbazval', params.url.baz);
            A.areSame('postbooval', params.body.boo);
        },

        'all function: accessing url, body, route, file params': function() {
            var p = create({
                body: {
                    foo: 'postfooval',
                    bar: 'postbarval',
                    baz: 'postbazval',
                    boo: 'postbooval'
                },
                url: {
                    foo: 'getfooval',
                    bar: 'getbarval',
                    baz: 'getbazval',
                },
                route: {
                    foo: 'routefooval',
                    bar: 'routebarval'
                },
                file: {
                    foo: 'filefooval'
                }
            });

            var params = p.all();

            A.isNotUndefined(params.body.foo);
            A.isNotUndefined(params.body.bar);
            A.isNotUndefined(params.body.baz);
            A.isNotUndefined(params.body.boo);

            //A.areSame('filefooval', params.file.foo); Not implemented
            A.areSame('routebarval', params.route.bar);
            A.areSame('getbazval', params.url.baz);
            A.areSame('postbooval', params.body.boo);
        },

        'getFromBody function: accessing body params': function() {
            var p = create({
                body: {
                    foo: 'postfooval',
                    bar: 'postbarval',
                    baz: 'postbazval',
                    boo: 'postbooval'
                },
                url: {
                    foo: 'getfooval',
                    bar: 'getbarval',
                    baz: 'getbazval',
                },
                route: {
                    foo: 'routefooval',
                    bar: 'routebarval'
                }
            });

            var params = p.getFromBody();

            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.isNotUndefined(params.baz);
            A.isNotUndefined(params.boo);

            A.areSame('postfooval', params.foo);
            A.areSame('postbarval', params.bar);
            A.areSame('postbazval', params.baz);
            A.areSame('postbooval', params.boo);
        },

        'body function: accessing body params': function() {
            var p = create({
                body: {
                    foo: 'postfooval',
                    bar: 'postbarval',
                    baz: 'postbazval',
                    boo: 'postbooval'
                },
                url: {
                    foo: 'getfooval',
                    bar: 'getbarval',
                    baz: 'getbazval',
                },
                route: {
                    foo: 'routefooval',
                    bar: 'routebarval'
                }
            });

            var params = p.body();

            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.isNotUndefined(params.baz);
            A.isNotUndefined(params.boo);

            A.areSame('postfooval', params.foo);
            A.areSame('postbarval', params.bar);
            A.areSame('postbazval', params.baz);
            A.areSame('postbooval', params.boo);
        },

        'getFromMerged function: accessing url params': function() {

            var p = create({
                url: {
                    foo: 'fooval',
                    bar: 'barval'
                }
            });
            
            var params = p.getFromMerged();
        
            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.areSame('fooval', params.foo);
            A.areSame('barval', params.bar);
        },
    
        'getFromMerged function: accessing the post parameters': function() {
            var p = create({
                body: {
                    foo: 'fooval',
                    bar: 'barval'
                }
            });
            var params = p.getFromMerged();

            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.areSame('fooval', params.foo);
            A.areSame('barval', params.bar);
        },

        'getFromMerged function: accessing the routes data': function() {
            var p = create({
                route: {
                    foo: 'fooval',
                    bar: 'barval'
                }
            });
            
            var params = p.getFromMerged();

            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.areSame('fooval', params.foo);
            A.areSame('barval', params.bar);
        },
    
        'getFromMerged function: get params override post params': function() {

            var p = create({
                body: {
                    foo: 'postfooval',
                    bar: 'postbarval'
                },
                url: {
                    foo: 'getfooval'
                }
            });

            var params = p.getFromMerged();

            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.areSame('getfooval', params.foo);
            A.areSame('postbarval', params.bar);
        },
    
        'getFromMerged function: route params override get and post params': function() {
            var p = create({
                body: {
                    foo: 'postfooval',
                    bar: 'postbarval',
                    baz: 'postbazval'
                },
                url: {
                    foo: 'getfooval',
                    bar: 'getbarval'
                },
                route: {
                    foo: 'routefooval'
                }
            });

            var params = p.getFromMerged();

            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.isNotUndefined(params.baz);
            A.areSame('routefooval', params.foo);
            A.areSame('getbarval', params.bar);
            A.areSame('postbazval', params.baz);
        },

        'getFromMerged function: get params are accessible directly': function() {

            var p = create({
                url: {
                    foo: 'fooval',
                    bar: 'barval'
                }
            });

            var params = p.getFromMerged();

        
            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.areSame('fooval', params.foo);
            A.areSame('barval', params.bar);
        },
    
        'getFromMerged function: post params are accessible directly': function() {
            var p = create({
                body: {
                    foo: 'fooval',
                    bar: 'barval'
                }
            });

            var params = p.getFromMerged();
        
            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.areSame('fooval', params.foo);
            A.areSame('barval', params.bar);
        },
    
        'getFromMerged function: routes data is accessible directly': function() {
            var p = create({
                route: {
                    foo: 'fooval',
                    bar: 'barval'
                }
            });

            var params = p.getFromMerged();
            
            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.areSame('fooval', params.foo);
            A.areSame('barval', params.bar);
        },

        'merged function: accessing url params': function() {

            var p = create({
                url: {
                    foo: 'fooval',
                    bar: 'barval'
                }
            });
            
            var params = p.merged();
        
            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.areSame('fooval', params.foo);
            A.areSame('barval', params.bar);
        },
    
        'merged function: accessing the post parameters': function() {
            var p = create({
                body: {
                    foo: 'fooval',
                    bar: 'barval'
                }
            });
            var params = p.merged();

            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.areSame('fooval', params.foo);
            A.areSame('barval', params.bar);
        },

        'merged function: accessing the routes data': function() {
            var p = create({
                route: {
                    foo: 'fooval',
                    bar: 'barval'
                }
            });
            
            var params = p.merged();

            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.areSame('fooval', params.foo);
            A.areSame('barval', params.bar);
        },
    
        'merged function: get params override post params': function() {

            var p = create({
                body: {
                    foo: 'postfooval',
                    bar: 'postbarval'
                },
                url: {
                    foo: 'getfooval'
                }
            });

            var params = p.merged();

            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.areSame('getfooval', params.foo);
            A.areSame('postbarval', params.bar);
        },
    
        'merged function: route params override get and post params': function() {
            var p = create({
                body: {
                    foo: 'postfooval',
                    bar: 'postbarval',
                    baz: 'postbazval'
                },
                url: {
                    foo: 'getfooval',
                    bar: 'getbarval'
                },
                route: {
                    foo: 'routefooval'
                }
            });

            var params = p.merged();

            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.isNotUndefined(params.baz);
            A.areSame('routefooval', params.foo);
            A.areSame('getbarval', params.bar);
            A.areSame('postbazval', params.baz);
        },

        'merged function: get params are accessible directly': function() {

            var p = create({
                url: {
                    foo: 'fooval',
                    bar: 'barval'
                }
            });

            var params = p.merged();

        
            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.areSame('fooval', params.foo);
            A.areSame('barval', params.bar);
        },
    
        'merged function: post params are accessible directly': function() {
            var p = create({
                body: {
                    foo: 'fooval',
                    bar: 'barval'
                }
            });

            var params = p.merged();
        
            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.areSame('fooval', params.foo);
            A.areSame('barval', params.bar);
        },
    
        'merged function: routes data is accessible directly': function() {
            var p = create({
                route: {
                    foo: 'fooval',
                    bar: 'barval'
                }
            });

            var params = p.merged();
            
            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.areSame('fooval', params.foo);
            A.areSame('barval', params.bar);
        },

        'getFromRoute function: accessing route params': function() {
            var p = create({
                body: {
                    foo: 'postfooval',
                    bar: 'postbarval',
                    baz: 'postbazval',
                    boo: 'postbooval'
                },
                url: {
                    foo: 'getfooval',
                    bar: 'getbarval',
                    baz: 'getbazval',
                },
                route: {
                    foo: 'routefooval',
                    bar: 'routebarval'
                }
            });

            var params = p.getFromRoute();

            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);

            A.areSame('routefooval', params.foo);
            A.areSame('routebarval', params.bar);
        },

        'route function: accessing route params': function() {
            var p = create({
                body: {
                    foo: 'postfooval',
                    bar: 'postbarval',
                    baz: 'postbazval',
                    boo: 'postbooval'
                },
                url: {
                    foo: 'getfooval',
                    bar: 'getbarval',
                    baz: 'getbazval',
                },
                route: {
                    foo: 'routefooval',
                    bar: 'routebarval'
                }
            });

            var params = p.route();

            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);

            A.areSame('routefooval', params.foo);
            A.areSame('routebarval', params.bar);
        },

        'getFromUrl function: accessing url params': function() {
            var p = create({
                body: {
                    foo: 'postfooval',
                    bar: 'postbarval',
                    baz: 'postbazval',
                    boo: 'postbooval'
                },
                url: {
                    foo: 'getfooval',
                    bar: 'getbarval',
                    baz: 'getbazval',
                },
                route: {
                    foo: 'routefooval',
                    bar: 'routebarval'
                }
            });

            var params = p.getFromUrl();

            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.isNotUndefined(params.baz);

            A.areSame('getfooval', params.foo);
            A.areSame('getbarval', params.bar);
            A.areSame('getbazval', params.baz);
        },

        'url function: accessing url params': function() {
            var p = create({
                body: {
                    foo: 'postfooval',
                    bar: 'postbarval',
                    baz: 'postbazval',
                    boo: 'postbooval'
                },
                url: {
                    foo: 'getfooval',
                    bar: 'getbarval',
                    baz: 'getbazval',
                },
                route: {
                    foo: 'routefooval',
                    bar: 'routebarval'
                }
            });

            var params = p.url();

            A.isNotUndefined(params.foo);
            A.isNotUndefined(params.bar);
            A.isNotUndefined(params.baz);

            A.areSame('getfooval', params.foo);
            A.areSame('getbarval', params.bar);
            A.areSame('getbazval', params.baz);
        },

        'TODO files function: accessing file params': function() {
            var p = create({
                body: {
                    foo: 'postfooval',
                    bar: 'postbarval',
                    baz: 'postbazval',
                    boo: 'postbooval'
                },
                url: {
                    foo: 'getfooval',
                    bar: 'getbarval',
                    baz: 'getbazval',
                },
                route: {
                    foo: 'routefooval',
                    bar: 'routebarval'
                }
            });

            //  Currently not implemented
            A.skip();
        },

    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: ['mojito-params-addon']});
