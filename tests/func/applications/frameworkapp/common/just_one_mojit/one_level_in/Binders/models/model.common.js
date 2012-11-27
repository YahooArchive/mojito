/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('BindersModel', function(Y) {

/**
 * The BindersModel module.
 *
 * @module BindersModel
 */

    /**
     * Constructor for the Model class.
     *
     * @class Model
     * @constructor
     */
    Y.mojito.models.Binders = {

        init: function(mojitSpec) {
            this.spec = mojitSpec;
        },

        /**
         * Method that will be invoked by the mojit controller to obtain data.
         *
         * @param callback {Function} The callback function to call when the
         *        data has been retrieved.
         */
	    getData: function(callback) {

	        callback({
	            message: 'Hello, chicken.',
	            imageurl: randomChicken()
	        });

	    },

	    getTaco: function(callback) {
	        callback({message: 'taco'});
	    }

    };

	function randomChicken() {

	    var chickens = [
	        'http://scienceblogs.com/gregladen/chicken.jpg',
	        'http://www.ecorazzi.com/wp-content/uploads/2008/02/chicken_baby_large.jpg',
	        'http://www.city-data.com/forum/attachments/new-jersey/44238d1246317620-what-everyones-plans-4th-july-finished_chicken.jpg',
	        'http://blogs.chesterchronicle.co.uk/and-finally/chicken-0011.jpg',
	        'http://www.world-agriculture.com/images/chicken.jpg',
	        'http://www.nextnature.net/wp-content/uploads/2006/10/chicken3~.jpg',
	        'http://bernardoh.files.wordpress.com/2007/04/chicken.jpg',
	        'http://www.nandosusa.com/images/barkChicken.gif',
	        'http://4.bp.blogspot.com/_2b-Ntp4vckw/SgggFZpkrYI/AAAAAAAADfg/BCJ6OaZPKM8/s400/chicken.jpg',
	        'http://veganica.com/works/a1/p1360_chicken-tude.jpg'
	    ];

	    return chickens[Math.floor(Math.random()*10)];
	}

}, '0.0.1', {requires: ['mojito']});
