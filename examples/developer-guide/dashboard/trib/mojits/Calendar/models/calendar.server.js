/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/
YUI.add('CalendarModelYQL', function (Y, NAME) {

    function mockData() {
        return {
                   entry: [ 
                       {  
                           summary: { content: "Test Calendar Event" }, 
                           link: { href: "http://yuilibrary.com/projects/yui3/calendar" },
                           title: { content: "Test Event" }
                        }
                   ]
        };
    }        
    Y.mojito.models[NAME] = {
        init: function (config) {
            this.config = config;
        },
        getData: function (params, callback) {
            Y.log("getData called");
            var
                feedURL = "https://www.google.com/calendar/feeds/fcde7kbrqnu7iccq9ofi9lqqf8%40group.calendar.google.com/public/basic",
                query = "select entry.title, entry.summary, entry.link from xml where url='{feed}' and entry.link.rel='alternate' limit 10",
                queryParams = {
                    feed: feedURL
                },
                cookedQuery = Y.Lang.sub(query, queryParams);
            Y.log("calendar cookedQuery: " + cookedQuery);

            if (this._isCached()) {
                Y.log("calendarData! skip YQL");
                callback(Y.calendarData);
            } else {
                Y.namespace("calendarData");
                Y.log("calendarModel calling YQL");
                Y.YQL(cookedQuery, Y.bind(this.onDataReturn, this, callback));
            }
        },
        onDataReturn: function (cb, result) {
            Y.log("calendar.server onDataReturn called");
            var results = [];
            if (result.error === undefined) {

                Y.log("onDataReturn: CalendarModelYQL...");
                Y.log("result: ");
                Y.log(result);

                if (result && result.query && result.query.results && result.query.results.feed) {
                    results = result.query.results.feed;
                }


                //Y.log("results 0 summary . content");
                //Y.log(results[0].entry.summary.content);
                Y.Array.each(results, function (val, key, obj) {
                    Y.log(val.entry.summary.content);
                    var tempDate = val.entry.summary.content;
                    // strip off 'br', 'When:'' and 'to' elements to get date
                    tempDate = tempDate.split("<")[0].split("When:")[1].split("to ")[0];

                    val.entry.summary.content = tempDate;

                    Y.log(val.entry.summary.content);
                });

                Y.calendarData = results;
                Y.calendarCacheTime = new Date().getTime();
                //Y.log("results: ");
                //Y.log(results);


                cb(results);
            } else {
                cb(result.error);
            }
        },
        _isCached: function() {
            var updateTime = this.config.feedCacheTime * 60 * 1000;
            return Y.calendarData && (new Date().getTime() - Y.calendarCacheTime) < updateTime;
        }
    };
}, '0.0.1', {requires: ['yql', 'substitute']});
