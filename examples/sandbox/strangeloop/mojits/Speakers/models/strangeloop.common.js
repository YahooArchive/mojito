/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('strangeloop', function(Y) {

    var cache = {};
    
    Y.mojito.models.strangeloop = {

        getSpeakerData: function(callback) {
            var q = "select * from html where url='https://thestrangeloop.com/sessions' and xpath='//div[@class=\"grid_6 p3 speaker\" or @class=\"grid_3 speaker\"]'";

            if (cache.speakers) {
                return callback(null, cache.speakers);
            }

            Y.YQL(q, function(rawYqlData) {
                var speakerDivs = rawYqlData.query.results.div;
                cache.raw = speakerDivs;
                callback(null, toArray(extractSpeakerList(speakerDivs)));
            });
        }

    };
    
    function extractSpeakerList(speakerDivs) {
        var output = {};

        Y.Array.each(speakerDivs, function(div) {
            var speaker, name, talk, img, twitter;

            // for keynote speakers
            if (div.h4) {
                name = div.h4[0].a.content;
                talk = div.h4[1].a.em;
                twitter = div.a[1] ? div.a[1].strong : undefined;
            }
            // for other speakers
            else {
                name = div.div.h5.a.content;
                talk = div.div.h4.a.content;
                twitter = div.div.a ? div.div.a.span : undefined;
            }
            if (Y.Lang.isArray(div.a)) {
                img = div.a[0].img.src;
            } else {
                img = div.a.img.src;
            }
            if (! output[name]) {
                output[name] = {
                    talks: []
                };
            }
            speaker = output[name];
            speaker.talks.push(talk);
            speaker.img = img;
            speaker.twitter = twitter;
        });

        return output;
    }

    function toArray(obj) {
        var name, out = [];
        for (name in obj) {
            if (obj.hasOwnProperty(name)) {
                obj[name].name = name;
                obj[name].talks = obj[name].talks.join(', ');
                out.push(obj[name]);
            }
        }
        cache.speakers = out;
        return out;
    }

}, '0.0.1', {requires: ['yql', 'jsonp']});
