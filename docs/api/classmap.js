YAHOO.env.classMap = {"Partial.common": "MojitoServer", "Meta.common": "ActionContextAddon", "OutputHandler": "MojitoServer", "I13n.server": "ActionContextAddon", "OutputAdapter.common": "ActionContextAddon", "Url.common": "MojitoServer",  "Y.mojito.MojitProxy": "MojitoClient", "Y.mojito.MojitoDispatcher": "MojitoClient", "Intl.common": "MojitoServer", "Deploy.server": "ActionContextAddon",  "Cookie.client": "MojitoServer", "MojitoServer": "MojitoServer", "Y.mojito.ActionContext": "ActionContext", "Y.mojito.lib.REST": "CommonLibs", "Http.server": "MojitoServer", "MuAdapterClient": "MojitoServer", "Y.mojito.Client": "MojitoClient", "Cookie.server": "MojitoServer", "Y.mojito.lib.MojitoDispatcher": "CommonLibs", "Device.common": "ActionContextAddon", "Params.common": "MojitoServer", "Composite.common": "MojitoServer", "Config.common": "MojitoServer", "Assets.common": "ActionContextAddon", "Carrier.common": "ActionContextAddon",  "Analytics.common": "ActionContextAddon", "ServerStore": "MojitoServer", "MuAdapterServer": "MojitoServer"};

YAHOO.env.resolveClass = function(className) {
    var a=className.split('.'), ns=YAHOO.env.classMap;

    for (var i=0; i<a.length; i=i+1) {
        if (ns[a[i]]) {
            ns = ns[a[i]];
        } else {
            return null;
        }
    }

    return ns;
};
