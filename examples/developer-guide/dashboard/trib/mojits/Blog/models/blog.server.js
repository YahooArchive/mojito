
/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/
YUI.add('BlogModelYQL', function (Y, NAME) {

    Y.mojito.models[NAME] = {
        init: function (config) {
            this.config = config;
        },
        getData: function (params, feedURL, callback) {
            Y.log("blogmojit getData called");
            Y.log(this.config);

            var query = "select title,link,pubDate, description, dc:creator from feed where url='{feed}' limit 5",
                queryParams = {
                    feed: feedURL
                },
                cookedQuery = Y.Lang.sub(query, queryParams);

            Y.log("blog cookedQuery: " + cookedQuery);

            if (this._isCached()) {
                //Y.log("blogData! skip YQL");
                //Y.log(Y.blogData);

                callback(Y.blogData);
            } else {
                Y.namespace("blogData");
                Y.log("blogmodel calling YQL");
                Y.YQL(cookedQuery, Y.bind(this.onDataReturn, this, callback));
            }

        },
        onDataReturn: function (cb, result) {
            Y.log("blog.server onDataReturn called");
            var results = [];
            results.view = "index";
            if (result.query && result.query.results === null) {
                // Handle the case where no results are returned.
                Y.log("No results.", "info");
                results.view = "none";
            } else if (result.error === undefined) {

                if (result.query.results.item) {
                    results = result.query.results.item;
                }

                Y.log("result.query.results.item = results: ");
                Y.log(results);

                Y.blogData = results;
                Y.blogCacheTime = new Date().getTime();

            } else {
                results = result;
                results.view = "error";
            }
            cb(results);
        },
        _isCached: function() {
            var updateTime = this.config.feedCacheTime * 60 * 1000;
            return Y.blogData && (new Date().getTime() - Y.blogCacheTime) < updateTime;
        }
    };

}, '0.0.1', {requires: ['yql', 'substitute']});
