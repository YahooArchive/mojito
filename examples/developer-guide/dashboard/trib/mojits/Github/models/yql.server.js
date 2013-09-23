/*jslint anon:true, sloppy:true, nomen:true, indent: 4, white: false*/
/*global YUI*/
YUI.add('StatsModelYQL', function (Y, NAME) {

    function mockData() {
        return [ 
            {
                type: "test_activity",
                username: "test user",
                payload: "test content",
                message: "test message",
                link: "github.com/yahoo/mojito"
            }
        ];
    }
    Y.mojito.models[NAME] = {

        init: function (config) {
            this.config = config;
            // Create cache object
            Y.yqlData = {};
        },
        getData: function (params, yqlTable, id, repo, callback) {
            Y.log(this.config);
            if (this._isCached(repo)) {
                callback(Y.yqlData);
            } else {
                var itemLimit = "10",
                    query = "use '{table}' as github.events; select json.type, json.actor, json.payload from github.events where id='{id}' and repo='{repo}' limit {limit}",
                    queryParams = {
                        table: yqlTable,
                        limit: itemLimit,
                        id: id,
                        repo: repo
                    },
                    cookedQuery = Y.Lang.sub(query, queryParams);
                Y.log("github: yql.server getData called");
                Y.log("github: cookedQuery:" + cookedQuery);
                Y.YQL(cookedQuery, Y.bind(this.onDataReturn, this, callback, repo));
            }
        },
        onDataReturn: function (cb, repo, result) {
            Y.log("github: onDataReturn called");
            if (result.error === undefined) {

                Y.log("github: result:");
                Y.log(result);
                var results = {};
                if (result && result.query && result.query.results && result.query.results.json) {

                    results = result.query.results.json;
                    Y.yqlData[repo] = results;
                    Y.yqlCacheTime = new Date().getTime();
                } else {
                   cb(mockData()); 
                }
                Y.log("github: results.json:");
                Y.log(results);

                cb(results);
            } else {
                cb(result.error);
            }
        },
        _isCached: function(repo) {
            var updateTime = this.config.feedCacheTime * 60 * 1000;
            if (Y.yqlData[repo]) {
                return Y.yqlData[repo] && (new Date().getTime() - Y.yqlCacheTime) < updateTime;
            }
        }
    };
}, '0.0.1', {requires: ['yql', 'substitute']});
