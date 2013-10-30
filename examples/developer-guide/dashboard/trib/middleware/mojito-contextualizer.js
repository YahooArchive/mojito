module.exports = function(config) {
    var url = require('url'),
        query;
    return function(req, res, next) {

        if (!req.context) {
            req.context = {};
        }
        query = url.parse(req.url, true).query || {};
        req.context.runtime = config.context.runtime || 'server';
        req.context.environment = query.environment || 'development';
        next();
    };
};
