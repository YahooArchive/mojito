/*
 * Copyright (c) 2012 Yahoo! Inc. All rights reserved.
 */

YUI.add('myMojit-tests', function(Y) {

    var suite = new YUITest.TestSuite('myMojit-tests'),
        controller = null,
        A = YUITest.Assert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'myMojit user tests',
        
        setUp: function() {
            controller = Y.mojito.controllers.myMojit;
        },
        tearDown: function() {
            controller = null;
        },
        'test mojit': function() {
           var ac,
                doneResults;
            ac = {
                done: function(data) {
                    doneResults = data;
                }
            };
            A.isNotNull(controller);
            A.isFunction(controller.index);
            A.isFunction(controller.default_ve);
            A.isFunction(controller.added_ve);
        },        
        'test index': function() {
            var ac,
                doneResults;
            ac = {
                done: function(data) {
                    doneResults = data;
                }
            };
            controller.index(ac);
            A.isString(doneResults);
            A.areSame('Mojito is working.', doneResults);
        },
        'test default_ve': function() {
            var ac,
                doneResults;
            ac = {
                done: function(data) {
                    doneResults = data;
                }
            };
            controller.default_ve(ac);
            A.isObject(doneResults);
            var test_data = { 
              "title": "Mustache at work!",
              "view_engines": [
                {"name": "Handlebars"},
                {"name": "EJS"},
                {"name": "Jade"},
                {"name": "dust"},
                {"name": "underscore" }
              ],
              "ul": { "title": 'Here are some of the other available rendering engines:' }
             };
             A.areSame(test_data.title,doneResults.title);
             A.areSame(test_data.view_engines.length,doneResults.view_engines.length);
             var arr_size = test_data.view_engines.length;
             for(var i=0;i<arr_size;i++){
               A.areSame(test_data.view_engines[i].name,doneResults.view_engines[i].name);
             }
            // A.areSame(test_data.ul.title,doneResults.ul.title);
         },
         'test added_ve': function() {
            var ac,
                doneResults;
            ac = {
                done: function(data) {
                    doneResults = data;
                }
            }; 
            controller.added_ve(ac);
            var test_data =  {
             "title": "Handlebars at work!",
             "view_engines": [ "Mustache","EJS","Jade", "dust","underscore" ],
             "ul": { "title": 'Here are some of the other available rendering engines:' }
            };
            A.isObject(doneResults);
            A.areSame(test_data.title,doneResults.title);
            A.areSame(test_data.view_engines.length,doneResults.view_engines.length);
            var arr_size = test_data.view_engines.length;
            for(var i=0;i<arr_size;i++){
               A.areSame(test_data.view_engines[i],doneResults.view_engines[i]);
            }
            A.areSame(test_data.ul.title,doneResults.ul.title);
          }
    }));
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojito-test', 'myMojit','json-stringify']});
