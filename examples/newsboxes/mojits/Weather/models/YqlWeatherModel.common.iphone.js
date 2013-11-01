/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, regexp:true*/
/*global YUI*/


YUI.add('YqlWeatherModel', function(Y, NAME) {

    Y.mojito.models[NAME] = {

        fetch: function(location, callback) {
            data = {
                temp: "72",
                text: "clear"
            };
            error = null
            callback(error, data);
        }
    };

}, '0.0.1', {requires: ['mojito', 'yql', 'jsonp-url']});

/*
http://query.yahooapis.com/v1/public/yql?loc=san+francisco,california&env=store://datatables.org/alltableswithkeys&format=json&q=SELECT+item.condition,item.description+FROM+weather.forecast+WHERE+location+IN(SELECT+id+FROM+weather.search+WHERE+query=@loc)+LIMIT+1
*/
