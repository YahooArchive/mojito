/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true*/
/*global YUI*/


YUI.add('ReadController', function(Y, NAME) {

    /**
     * Display feed data in a horizontally flickable scrollview.
     * @class ReadController
     */
    Y.namespace('mojito.controllers')[NAME] = {

        /**
         * Load feed metadata for feed named in url, get data, display.
         * @param {ActionContext} ac The action context to operate on.
         */
        index: function(ac) {
            var id = ac.params.merged('id'),
                // TODO: JSLint won't let this pass.
                //start = ~~ac.params.url('start') || 1,
                start = +(ac.params.url('start')) || 1,
                feedmeta = ac.config.getDefinition('feeds')[id],
                error = null,
                my = this;

            this.config = ac.config.get();

            if (feedmeta) {
                feedmeta.id = id;
                feedmeta.start = start;
                feedmeta.limit = this.config.limit;
            } else {
                error = 'configs for feed "' + id + '" not found';
            }

            // Process feed data.
            function afterQuery(error, feedmeta, response) {
                return error ?
                        my.fail(error, ac) :
                        ac.done(my.compose(feedmeta, response));
            }

            // Ask model for feed data, or display error.
            return error ?
                    my.fail(error, ac) :
                    ac.models.get('ReadModelRss').get(feedmeta, afterQuery);
        },

        /**
         * Compose the data for the view.
         * @param {Object} feedmeta Feed metadata.
         * @param {Array.<Object>} stories The list of stories.
         * @return {Object} Data for view renderer (mustache.js).
         */
        compose: function(feedmeta, stories) {
            var my = this,
                vu = {
                    feedname: feedmeta.name,
                    // NOTE that this will only work if index() has already been
                    // called since we need an ac.config reference to set
                    // config.
                    spaceid: this.config.spaceid,
                    stories: stories || [],
                    navdots: []
                },
                n = Math.max(0, vu.stories.length);

            Y.each(stories, function(story, i) {
                var curr = feedmeta.start + i,
                    prev = curr - 1 < 1 ? n : curr - 1,
                    next = curr + 1 > n ? 1 : curr + 1;

                if (Y.Lang.trim(story.title) &&
                        Y.Lang.trim(story.description) && story.link) {
                    story.prev = '&start=' + prev;
                    story.next = '&start=' + next;
                    story.css_style = my.size(story.title.length,
                        story.description.length);
                    vu.navdots.push({});

                } else {
                    Y.log('story ' + i + ' is missing data', 'warn');
                }
            });

            return vu;
        },

        /**
         * Choose text display size.
         * @param {Number} tlen Story title character count.
         * @param {Number} dlen Story description character count.
         * @return {String} Predefined css class.
         */
        size: function(tlen, dlen) {
            var weighted = (tlen * 1.4) + dlen;
            return ((weighted > 850) && 'medium') ||
                ((weighted > 500) && 'large') ||
                ((weighted > 300) && 'x-large') || 'xx-large';
        },

        /**
         * Something went wrong, render something.
         * @param {String} error The error message.
         * @param {ActionContext} ac The action context.
         */
        fail: function(error, ac) {
            ac.done({title: 'oh noes!', stories: [{description: error}]});
        }
    };

}, '0.0.1', {requires: [
    'mojito',
    'mojito-params-addon',
    'mojito-config-addon',
    'mojito-models-addon',
    'ReadModelRss'
]});
