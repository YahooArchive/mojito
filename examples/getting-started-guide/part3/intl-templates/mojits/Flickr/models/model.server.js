/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, node:true, plusplus: true*/

YUI.add('FlickrModel', function(Y) {
    var API_KEY = '9cc79c8bf1942c683b0d4e30b838ee9c';

/**
 * The FlickrModel module.
 *
 * @module FlickrModel
 */

    function buildFlickrUrlFromRecord(record) {
        return 'http://farm' + record.farm +
            '.static.flickr.com/' + record.server +
            '/' + record.id + '_' + record.secret + '.jpg';
    }

    Y.mojito.models.flickr = {

        /**
         * Method that will be invoked by the mojit controller to obtain data.
         *
         * @param callback {Function} The callback function to call when the
         *        data has been retrieved.
         */
        getFlickrImages: function(queryString, callback) {
            var q = 'select * from flickr.photos.search where text="' + queryString + '" and api_key="' + API_KEY + '"';
            Y.YQL(q, function(rawYqlData) {
                Y.log(rawYqlData);
                var rawPhotos = rawYqlData.query.results.photo,
                    rawPhoto = null,
                    photos = [],
                    photo = null,
                    i;
                for (i = 0; i < rawPhotos.length; i++) {
                    rawPhoto = rawPhotos[i];
                    photo = {
                        title: rawPhoto.title,
                        url: buildFlickrUrlFromRecord(rawPhoto)
                    };
                    // some flickr photos don't have titles, so force them
                    if (!photo.title) {
                        photo.title = "[" + queryString + "]";
                    }
                    photos.push(photo);
                }
                Y.log('calling callback with photos');
                Y.log(photos);
                callback(photos);

            });
        }

    };


// TODO: remove 'jsonp-url' requirement when YUI fix for bug http://yuilibrary.com/projects/yui3/ticket/2530251 is deployed.
}, '0.0.1', {requires: ['yql', 'jsonp-url']});
