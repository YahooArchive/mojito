/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('YuiTweetsModel', function(Y) {

    var cache = {};
    
    Y.mojito.models.yuiTweets = {

        getTweets: function(cb) {
            var q = "select * from xml where url='http://tweets.yuilibrary.com/recent.rss?type=yui'";

            if (cache.tweets) {
                return cb(null, cache.tweets);
            }

            Y.YQL(q, function(rawYqlData) {
                var tweets = rawYqlData.query.results.rss.channel.item;
                cache.tweets = tweets;
                cb(null, tweets);
            });
            
        }

    };

}, '0.0.1', {requires: ['yql', 'jsonp']});
