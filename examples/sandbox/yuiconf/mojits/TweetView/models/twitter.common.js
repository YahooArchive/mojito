/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('twitter', function(Y) {

    var cache = {};

    Y.mojito.models.twitter = {

        getTweetsFor: function(screenName, callback) {
            var q = "SELECT * FROM twitter.user.timeline WHERE screen_name='" + screenName + "'";

            if (cache[screenName]) {
                return callback(null, cache[screenName]);
            }

            Y.YQL(q, function(rawYqlData) {
                var tweets = rawYqlData.query.results.statuses.status;
                cache[screenName] = tweets;
                callback(null, tweets);
            });
        }

    };

}, '0.0.1', {requires: ['yql', 'jsonp']});
