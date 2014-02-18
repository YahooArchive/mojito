
module.exports = function (req, res, next) {
    console.log('--------- foo exec');
    next();
};
