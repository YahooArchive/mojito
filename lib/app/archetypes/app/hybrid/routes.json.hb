[
  {
    "settings": [ "master" ],

    "/": {
      "verbs": ["get"],
      "path": "/",
      "call": "topFrame.index"
    },

    "default-for-html5app": {
        "verbs": ["get"],
        "path": "/yahoo.application.{{name}}/index.html",
        "call": "topFrame.index"
    },

    "by-mojit-action": {
        "verbs": [ "GET" ],
        "path": "/:module/:action",
        "call": "{module}.{action}"
    }
  }
]
