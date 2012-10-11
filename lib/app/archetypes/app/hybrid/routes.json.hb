[
  {
    "settings": [ "master" ],

    "root": {
        "verbs": ["get"],
        "path": "/",
        "call": "frame.index"
    },

    "yahoo.application.{{name}}": {
        "verbs": ["get"],
        "path": "/yahoo.application.{{name}}/index.html",
        "call": "frame.index"
    },

    "any mojit/action": {
        "verbs": [ "GET" ],
        "path": "/:module/:action",
        "call": "{module}.{action}"
    }
  }
]
