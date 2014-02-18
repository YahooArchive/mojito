
module.exports = function (midConfig) {
    console.log('------ mojito-foo init');
    return function (req, res, next) {
        res.midConfig = midConfig;
        console.log('------ mojito-foo exec');
        next();
    };
};
