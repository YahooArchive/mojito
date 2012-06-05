/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


module.exports = {

    version: '2.0.0',

    DEFAULT: '*',
    SEPARATOR: '/',
    SUBMATCH: /\$\$[a-zA-Z0-9.-_]*\$\$/,

    /*
     * Processes an Object representing a YCB 2.0 Bundle as defined in the spec.
     *
     *
     * @method read
     * @param {object} bundle
     * @param {object} context
     * @param {boolean} validate
     * @param {boolean} debug
     * @return {object}
     */
    read: function(bundle, context, validate, debug){

        var rawConfig, lookupPaths,
            path, config = {};

        if(!context){
            context = {};
        }

        rawConfig = this._processRawBundle(bundle);
        lookupPaths = this._getLookupPaths(rawConfig.dimensions, context);

        if(debug){
            console.log(JSON.stringify(context,null,4));
            console.log(JSON.stringify(rawConfig,null,4));
            console.log(JSON.stringify(lookupPaths,null,4));
        }

        // Now we simply merge each macting settings section we find into the config
        for(path=0; path<lookupPaths.length; path++){
            if(rawConfig.settings[lookupPaths[path]]){
                if (debug) {
                    console.log('----USING---- ' + lookupPaths[path]);
                    console.log(JSON.stringify(rawConfig.settings[lookupPaths[path]],null,4));
                }
                config = objectMerge(rawConfig.settings[lookupPaths[path]], config);
            }
        }

        this._applySubstitutions(config);

        if(validate){
            console.log('The YCB option "validate" is not implemented yet.');
        }

        return config;
    },

    /*
     * This is a first pass at hairball of a funciton.
     *
     *
     * @private
     * @method _applySubstitutions
     * @param {object} config
     * @param {object} base
     * @param {object} parent
     * @return void
     */
    _applySubstitutions: function(config, base, parent){

        var key, sub, find, item;

        if(!base){
            base = config;
        }

        if(!parent){
            parent = {ref: config, key: null};
        }

        for (key in config) {
            if (config.hasOwnProperty(key)) {
                // If the value is an "Object" or an "Array" drill into it
                if(config[key] && (config[key].constructor === Object || config[key].constructor === Array)) {
                    // The whole {ref: config, key: key} is needed only when replacing "keys"
                    this._applySubstitutions(config[key], base, {ref: config, key: key});
                }else{
                    // Test if the key is a "substitution" key
                    if(this.SUBMATCH.test(key)){
                        // We have a matching so lets do some work
                        sub = this.SUBMATCH.exec(key);
                        // Is it the whole key or just something odd
                        if(sub[0] === key){
                            // Pull out he key to "find"
                            find = extract(base, sub[0].slice(2,-2), null);

                            if(find.constructor === Object){
                                // Remove the "substitution" key
                                delete config[key];
                                // Add the keys founds
                                // This should be inline at the point where the "substitution" key was.
                                // Currently they will be added out of order on the end of the map.
                                for(item in find){
                                    if(find.hasOwnProperty(item)){
                                        if(!parent.ref[parent.key]){
                                            parent.ref[item] = find[item];
                                        }else{
                                            parent.ref[parent.key][item] = find[item];
                                        }
                                    }
                                }
                            }
                            else{
                                config[key] = 'error';
                            }
                        }
                    }
                    // Test if the value is a "substitution" value
                    else if(this.SUBMATCH.test(config[key])){
                        // We have a match so lets use it
                        sub = this.SUBMATCH.exec(config[key]);
                        // Pull out he key to "find"
                        find = sub[0].slice(2,-2);
                        // First see if it is the whole value
                        if(sub[0] === config[key]){
                            // Replace the whole value with the value found by the sub string
                            find = extract(base, find, null);
                            // If we have an array in an array do it "special like"
                            if(find.constructor === Array && config.constructor === Array){
                                // This has to be done on the parent or the referance is lost
                                // The whole {ref: config, key: key} is needed only when replacing "keys"
                                parent.ref[parent.key] = config.slice(0, parseInt(key, 10))
                                    .concat(find)
                                    .concat(config.slice(parseInt(key, 10)+1));
                            }
                            else{
                                config[key] = find;
                            }
                        }
                        else{ // If not it's just part of the whole value
                            config[key] = config[key].replace(sub[0], extract(base, find, null));
                        }
                    }
                }
            }
        }
    },

    /*
     * @private
     * @method _processRawBundle
     * @param {object} bundle
     * @return {object}
     */
    _processRawBundle: function(bundle){

        var pos,
            settings = {},
            dimensions = {},
            schema = {},
            part, kv, context, key;

        // Extract each section from the bundle
        for(pos=0; pos<bundle.length; pos++){
            if(bundle[pos].dimensions){
                dimensions = bundle[pos].dimensions;
            }
            else if(bundle[pos].schema){
                schema = bundle[pos].schema;
            }
            else if(bundle[pos].settings){
                context = {};

                for(part=0; part<bundle[pos].settings.length; part++){
                    kv = bundle[pos].settings[part].split(':');
                    context[kv[0]] = kv[1];
                }
                // Remove the settings key now we are done with it
                delete bundle[pos].settings;

                // Build the full context path
                key = this._getLookupPath(dimensions, context);

                // Add the section to the settings list with it's full key
// IMY Bug 5439377 configuration does not accept neither null nor false values?
                if(!settings[key]){
                    settings[key] = bundle[pos];
                }
                else{
                    throw new Error("The settings group '"+JSON.stringify(context)+"' has already been added.");
                }
            }
        }

        return {
            dimensions: dimensions,
            settings: settings,
            schema: schema
        };
    },

    /*
     * @private
     * @method _getContextPath
     * @param {object} dimensions A YCB dimension structured object
     * @param {object} context Key/Value list
     * @result {string}
     */
    _getLookupPaths: function(dimensions, context){

        var lookupList = objectToList(this._makeOrderedLookupList(dimensions, context)),
            path = [], paths = [], pos,
            current = lookupList.length-1,
            combination = [];

        // This is our combination that we will tubmle over
        for(pos=0; pos<lookupList.length; pos++){
            combination.push({
                current: 0,
                total: lookupList[pos].length-1
            });
        }

        function tumble(combination, location){

            // If the location is not found return
            if(!combination[location]){
                return false;
            }

            // Move along to the next item
            combination[location].current++;

            // If the next item is not found move to the prev location
            if(combination[location].current > combination[location].total){

                combination[location].current = 0;

                return tumble(combination, location-1);
            }

            return true;
        }

        do{
            path = [];

            for(pos=0; pos<lookupList.length; pos++){
                path.push(lookupList[pos][combination[pos].current]);
            }

            paths.push(path.join(this.SEPARATOR));
        }
        while(tumble(combination, current));

        return paths.reverse();
    },

    /*
     * @private
     * @method _getContextPath
     * @param {object} dimensions A YCB dimension structured object
     * @param {object} context Key/Value list
     * @result {string}
     */
    _getLookupPath: function(dimensions, context){

        var lookupList = this._makeOrderedLookupList(dimensions, context),
            name, list, lookup = {}, item, path = [];

        for(name in lookupList){
            if(lookupList.hasOwnProperty(name)){

                if(context[name]){
                    for(list=0; list<lookupList[name].length; list++){
                        if(lookupList[name][list] === context[name]){
                            lookup[name] = lookupList[name][list];
                        }
                    }
                }

                // If there was no match set to default
                if(!lookup[name]){
                    lookup[name] = this.DEFAULT;
                }
            }
        }

        for(item in lookup){
            if(lookup.hasOwnProperty(item)){
                path.push(lookup[item]);
            }
        }

        return path.join(this.SEPARATOR);
    },

    /*
     * @private
     * @method _makeOrderedLookupList
     * @param {object} dimensions A YCB dimension structured object
     * @param {object} context Key/Value list
     * @result {object} list of lists
     */
    _makeOrderedLookupList: function(dimensions, context){

        var dimensionPaths = this._flattenDimensions(dimensions),
            pos, name, path,
            chains = {};

        for(pos=0; pos<dimensions.length; pos++){
            for(name in dimensions[pos]){
                if(dimensions[pos].hasOwnProperty(name)){

                    for(path in dimensionPaths[name]){

                        if(dimensionPaths[name].hasOwnProperty(path)
                            && dimensionPaths[name][path] === context[name]){

                                chains[name] = path;
                            }
                    }

                    if(chains[name]){
                        // Convert to an ordered list
                        chains[name] = reverseList(chains[name].split(this.SEPARATOR)).concat(this.DEFAULT);
                    }
                    else{
                        // If there was no match set to default
                        chains[name] = [this.DEFAULT];
                    }
                }
            }
        }

        return chains;
    },

    /*
     * @private
     * @method _flattenDimensions
     * @param {object} dimensions A YCB dimension structured object
     * @result {object} k/v map
     */
    _flattenDimensions: function(dimensions){

        var dimensionPaths = {},
            pos, name;

        for(pos=0; pos<dimensions.length; pos++){
            for(name in dimensions[pos]){
                if(dimensions[pos].hasOwnProperty(name)) {
                    dimensionPaths[name] = this._flattenDimension('', dimensions[pos][name]);
                }
            }
        }//console.log(JSON.stringify(dimensionPaths,null,4));

        return dimensionPaths;
    },

    /*
     * @private
     * @method _flattenDimension
     * @param {string} prefix
     * @param {object} dimension A single YCB dimension structured object
     * @param {string} build
     * @result {object} k/v map
     */
    _flattenDimension: function(prefix, dimension, build){

        var key, newPrefix, nextDimension;

        if(!build){
            build = {};
        }

        if(typeof dimension === 'object'){

            for(key in dimension){
                if(dimension.hasOwnProperty(key)){

                    nextDimension = dimension[key];
                    newPrefix = (prefix?prefix+this.SEPARATOR+key:key);
                    build[newPrefix] = key;

                    if(typeof nextDimension === 'object'){
                        build = this._flattenDimension(newPrefix, nextDimension, build);
                    }
                }
            }
        }

        return build;
    }
};

function reverseList(from){
    var to = [],
        pos = from.length;

    while(pos){
        to.push(from[--pos]);
    }

    return to;
}

function objectToList(from){
    var to = [],
        pos = 0,
        key = '';

    for(key in from) {
        if(from.hasOwnProperty(key)){
            to[pos] = from[key];
            pos++;
        }
    }

    return to;
}

function objectMerge(from, to) {
    var key;
    for (key in from) {
        if (from.hasOwnProperty(key)) {
            try {
                // Property in destination object set; update its value.
                if ( from[key].constructor === Object ) {
                    to[key] = objectMerge(from[key], to[key]);
                } else {
                    to[key] = from[key];
                }
            } catch(err) {
                // Property in destination object not set; create it and set its value.
                to[key] = from[key];
            }
        }
    }
    return to;
}

function extract(bag, key, def) {
    if(!key){
        return bag || {};
    }

    var keys = key.split('.'),
        cur  = bag,
        i;

    for(i = 0; i < keys.length; i++){
        if(cur[keys[i]]){
            cur = cur[keys[i]];
        }else{
            return def;
        }
    }

    return cur;
}


