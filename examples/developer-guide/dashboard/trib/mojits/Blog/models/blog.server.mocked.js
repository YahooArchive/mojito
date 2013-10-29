
/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/
YUI.add('BlogMockedModelYQL', function (Y, NAME) {

    Y.mojito.models[NAME] = {
        init: function (config) {
            this.config = config;
            this.data = [ { title: "Blog Test", "link": "http://www.yuiblog.com/", "creator": "YUI blogger", "description": "Test blog post.", "pubDate": new Date() }]; 
        },
        getData: function (params, feedURL, callback) {
           Y.log("Returning mocked data.", "info", NAME);
           callback(null, this.data);
        }
    };
}, '0.0.1', {requires: ['yql', 'substitute']});
