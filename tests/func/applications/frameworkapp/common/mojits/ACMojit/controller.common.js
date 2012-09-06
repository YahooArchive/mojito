YUI.add('ActionContextMojit', function(Y, NAME) {

    Y.namespace('mojito.controllers')[NAME] = {

        /**
         * Method corresponding to the 'index' action.
         *
         * @param actionContext {Object} The action context that provides access
         *        to the Mojito API.
         */
        index: function(ac){
		     ac.done();
		},
        acMojit: function(actionContext) {
            var test = actionContext.params.getFromUrl('test');

            var greetingstring = "Hello Action Context Testing";
            var data1 = {
                greeting:greetingstring
            }
            var myCars=new Array("Saab","Volvo","BMW");
            var data2 = {
                mycars:myCars
            }

            if(test=="done1"){
                actionContext.done(data1);
            }else if(test=="flush1"){
                actionContext.flush(data1);
                actionContext.done();
            }else if(test=="done2"){
                actionContext.done(data1, 'json');
            }else if(test=="flush2"){
                actionContext.flush(data1, 'json');
                actionContext.done();
            }else if(test=="done3"){
                actionContext.done(data1, {name: "json"});
            }else if(test=="flush3"){
                actionContext.flush(data1, {name: "json"});
                actionContext.done();
            }else if(test=="done4"){
                actionContext.done(data2);
            }else if(test=="flush4"){
                actionContext.flush(data2);
                actionContext.done();
            }else if(test=="done5"){
                actionContext.done(data2, 'json');
            }else if(test=="flush5"){
                actionContext.flush(data2, 'json');
                actionContext.done();
            }else if(test=="done6"){
                actionContext.done({data:"Hello, world!--from done"});
            }else if(test=="flush6"){
                actionContext.flush({data:"Hello, world!--from flush"});
                actionContext.done();
            }else if(test=="done7"){
                actionContext.done({data:"Hello, world!"}, 'json');
            }else if(test=="flush7"){
                actionContext.flush({data:"Hello, world!"}, 'json');
                actionContext.done();
            }else if(test=="done8"){
                actionContext.done({data:"Hello, world!--from done"}, {view: {name: "mytemplate"}});
            }else if(test=="done9"){
                actionContext.done({ foo: null }, {view: {name: "mytemplate1"}});
            }else if(test=="done10"){
                actionContext.done({ foo: [ 1, 2, null, 4 ]}, {view: {name: "mytemplate1"}} );
            }else if(test=="flush8"){
                actionContext.flush({data:"Hello, world!--from flush"}, {view: {name: "mytemplate"}});
                actionContext.done();
            }else{
                actionContext.flush("Hello, world!--from flush,");
                actionContext.done("Hello, world!--from done");
            }
        }

    };


}, '0.0.1', {requires: ['mojito']});
