/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/
YUI.add('YoutubeModelYQL', function (Y, NAME) {

    Y.mojito.models[NAME] = {
        init: function (config) {
            this.config = config;
        },
        getData: function (params, callback) {
            Y.log("youtube server getData called");

            if (this._isCached()) {
                callback(Y.youtubeData);
            } else {
                var
                    feedURL = "https://gdata.youtube.com/feeds/base/users/yuilibrary/uploads",
                    query = "select id,title,link,published from feed(0,6) where url='{feed}' and link.rel='alternate'",
                    queryParams = {
                        feed: feedURL
                    },
                    cookedQuery = Y.Lang.sub(query, queryParams);

                Y.log("youtube cookedQuery: " + cookedQuery);

                Y.YQL(cookedQuery, Y.bind(this.onDataReturn, this, callback));
            }

        },
        onDataReturn: function (cb, result) {
            Y.log("youtube.server onDataReturn called");
            var results = [];
            results.view = "index";
            if (result && result.query && result.query.results === null) {
                // Handle the case where no results are returned.
                results.view = "none";
            } else if (result.error === undefined) {

                //Y.log("result: ");
                //Y.log(result);

                if (result.query.results.entry) {
                    results = result.query.results.entry;
                    Y.youtubeData = results;
                    Y.youtubeCacheTime = new Date().getTime();
                } 
            } else {
                results = result;
                results.view = "error";
            }
            cb(results);
        },
        _isCached: function() {
            var updateTime = this.config.feedCacheTime * 60 * 1000;
            return Y.youtubeData && (new Date().getTime() - Y.youtubeCacheTime) < updateTime;
        }
    };

}, '0.0.1', {requires: ['yql', 'substitute']});
