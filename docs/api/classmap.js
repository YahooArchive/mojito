YAHOO.env.classMap = {"Partial.common": "ActionContextAddon", "Meta.common": "ActionContextAddon", "OutputHandler": "MojitoServer", "I13n.server": "ActionContextAddon", "OutputAdapter.common": "ActionContextAddon", "Url.common": "ActionContextAddon", "Y.mojito.MojitoDispatcher": "MojitoClient", "MojitProxy": "MojitoClient", "Intl.common": "ActionContextAddon", "ResourceStore.server": "MojitoServer", "Deploy.server": "ActionContextAddon", "Composite.common": "ActionContextAddon", "Cookie.client": "ActionContextAddon", "MojitoServer": "MojitoServer", "Y.mojito.lib.REST": "CommonLibs", "Http.server": "ActionContextAddon", "MuAdapterClient": "ActionContextAddon", "Y.mojito.Client": "MojitoClient", "Cookie.server": "ActionContextAddon", "Device.common": "ActionContextAddon", "MojitoDispatcher": "ActionContext", "Params.common": "ActionContextAddon", "ActionContext": "ActionContext", "Config.common": "ActionContextAddon", "Assets.common": "ActionContextAddon", "Carrier.common": "ActionContextAddon", "Analytics.common": "ActionContextAddon", "MuAdapterServer": "ActionContextAddon"};

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
