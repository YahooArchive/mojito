/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, regexp: true*/
/*global YUI*/


YUI.add('ReadModelRss', function(Y, NAME) {

    /**
     * Fetch normalized RSS feed data as JSON via YQL.
     * @class ReadModelRss
     */
    Y.mojito.models[NAME] = {

        /**
         * Initialize the model.
         * @param {Object} config (also available via ac.config.get() in an
         *     action).
         */
        init: function(config) {
            this.limit = config.limit;
        },

        /**
         * Fetch YQL RSS response as normalized json.
         * @param {Object} feedmeta Metadata for the selected feed.
         * @param {Function} callback The callback function to invoke.
         */
        get: function(feedmeta, callback) {

            var my = this,
                query =
                    'SELECT title,link,pubDate,description,enclosure ' +
                    'FROM feed WHERE url=@feedurl ' +
                    'LIMIT @feedlimit OFFSET @feedstart',
                param = {
                    feedurl: feedmeta.url,
                    feedlimit: feedmeta.limit,
                    feedstart: feedmeta.start,
                    format: 'json'
                };

            function afterYql(response) {
                var list = my.processResponse(response) || [],
                    error = null;

                // Error?
                if (!list.length) {
                    error = my.processError(response) ||
                        'Ooo, could not fetch stories for ' + feedmeta.name;
                }

                // Pass feedmeta through.
                callback(error, feedmeta, list);
            }

            Y.YQL(query, afterYql, param);
        },

        /**
         * Handle result data processing.
         * @param {Object} YQL response, i.e.
         *     http://query.yahooapis.com/v1/public/yql
         *         ?q=SELECT+title,link,pubDate,description,
         *         enclosure+FROM+rss+WHERE+url=
         *         "http://feeds.feedburner.com/TechCrunch"
         *         &format=json.
         * @return {Array.<Object>} The 'rows' of result data.
         */
        processResponse: function(response) {
            var stories,
                i,
                story,
                list = [],
                error = null;

            stories = (response.query &&
                response.query.results &&
                response.query.results.item) || [];

            for (i in stories) {
                if (stories.hasOwnProperty(i)) {

                    story = {
                        title: Y.Lang.trim(stories[i].title),
                        link: Y.Lang.trim(stories[i].link),
                        pubDate: +stories[i].pubdate || +new Date(),
                        description: this.getLink(stories[i].enclosure, i) ||
                            this.stripTags(stories[i].description)
                    };

                    if (story.title && story.description && story.link) {
                        list.push(story);
                        if (list.length >= this.limit) {
                            break;
                        }
                    } else {
                        Y.log('skipping story ' + i + ': missing data', 'warn');
                    }
                }
            }

            return list;
        },

        /**
         * Handle error responses.
         * @param {Object} response The YQL response.
         * @return {String} HTTP status message if any.
         */
        processError: function(response) {
            return response.query &&
                response.query.diagnostics &&
                response.query.diagnostics.url &&
                response.query.diagnostics.url['http-status-message'];
        },

        /**
         * Pass video url to player.
         * @param {Object} enclosure An object of the form:
         *     {length:"123", type:"video/mp4", url:".."} | undefined.
         * @param {Number} num int story number, starting from 0.
         * @return {String} An appropriate HTML chunk for the URL.
         */
        getLink: function(enclosure, num) {
            var url = enclosure && enclosure.url,
                pad = new Array(900).join(' '); // For small headline css size.

            return url ?
                    '<div id="videobox' + num + '">' + url + '</div>' + pad :
                    '';
        },

        /**
         * Strip HTML tags from the content string provided.
         * @param {String} content The content, possibly containing markup.
         * @return {String} Plain text.
         */
        stripTags: function(content) {
            // TODO: retain/massage relevant media element(s).
            // i.e. Y.node.convert(content).all(imgs w/ min h x w), pick one.
            return Y.Lang.trim(content.replace(/<\/?\w+[^>]*>/gmi, ' '));
        }

    };

}, '0.0.1', {requires: [
    'mojito',
    'yql',
    'jsonp-url'
]});
