
/**
 * Object containing helper methods.
 * @namespace YUITest
 * @class Util
 * @static
 */
YUITest.Util = {

    /**
     * Mixes the own properties from the supplier onto the
     * receiver.
     * @param {Object} receiver The object to receive the properties.
     * @param {Object} supplier The object to supply the properties.
     * @return {Object} The receiver that was passed in.
     * @method mix
     * @static
     */
    mix: function(receiver, supplier){
    
        for (var prop in supplier){
            if (supplier.hasOwnProperty(prop)){
                receiver[prop] = supplier[prop];
            }
        }
        
        return receiver;    
    },
    
    /**
     * Stub for JSON functionality. When the native JSON utility
     * is available, it will be used. Otherwise, a stub object
     * is created. Developers should override YUITest.Util.JSON
     * when attempting to use it in environments where a native
     * JSON utility is unavailable.
     * @property JSON
     * @type JSON
     * @static
     */
    JSON: typeof JSON != "undefined" ? JSON : {
        stringify: function(){
            //TODO: Should include code to do this?
            throw new Error("No JSON utility specified.");
        }    
    }

};
    
