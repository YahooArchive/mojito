/*
* Copyright (c) 2011 Yahoo! Inc. All rights reserved.
*/
YUI.add('PagedFlickr5Model', function(Y, NAME) {

/**
 * The PagedFlickr5Model module.
 *
 * @module PagedFlickr5Model
 */

    /**
     * Constructor for the PagedFlickrModelFlickr class.
     *
     * @class PagedFlickr5Model
     * @constructor
     */
    Y.mojito.models[NAME] = {

        /**
         * Method that will be invoked by the mojit controller to obtain data.
         *
         * @param callback {Function} The callback function to call when the
         *        data has been retrieved.
         */
        getFlickrImages: function(queryString, start, count, callback) {
            var APP_KEY = '84921e87fb8f2fc338c3ff9bf51a412e';
            var q;
            start = parseInt(start) || 0;
            count = parseInt(count) || 10;
            // The YQL docs say that the second number is the end, but in practice
            // it appears to be the count.
            // http://developer.yahoo.com/yql/guide/paging.html#remote_limits
            q = 'select * from flickr.photos.search(' + start + ',' + count + ') where text="' + queryString + '" and api_key="' + APP_KEY + '"';
            Y.YQL(q, function(rawYqlData) {
                if (!rawYqlData.query.results) {
                    callback([]);
                    return;
                }
                var rawPhotos = rawYqlData.query.results.photo,
                    rawPhoto = null
                    photos = [],
                    photo = null,
                    i = 0;

                for (; i<rawPhotos.length; i++) {
                    rawPhoto = rawPhotos[i];
                    photo = {
                        id: rawPhoto.id,
                        title: rawPhoto.title,
                        url: buildFlickrUrlFromRecord(rawPhoto)
                    };
                    // some flickr photos don't have titles, so force them
                    if (!photo.title) {
                        photo.title = "[" + queryString + "]";
                    }
                    photos.push(photo);
                }
                callback(photos);
            });
        }

    };

    function buildFlickrUrlFromRecord(record) {
        return 'http://farm' + record.farm 
            + '.static.flickr.com/' + record.server 
            + '/' + record.id + '_' + record.secret + '.jpg';
    }

}, '0.0.1', {requires: ['yql','jsonp-url']});
