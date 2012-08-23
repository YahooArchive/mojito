YUI.add('mojito-testutils', function(Y, NAME) {

    /**
     * @param {string} relpath relative to repo base directory
     * @return {string} absolute path
     */
    Y.namespace('u').projpath = function(relpath) {
        return require('path').resolve(__dirname, '../../../../../' + relpath);
    };

});
