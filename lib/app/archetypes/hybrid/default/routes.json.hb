[
  {
    "settings": [ "master" ],

    "top_frame_view": {
      "verbs": ["get"],
      "path": "/",
      "call": "yahoo.{{name}}.top_frame.index"
    },

    "default-for-html5app": {
        "verbs": ["get"],
        "path": "/yahoo.application.{{name}}/index.html",
        "call": "yahoo.{{name}}.top_frame.index"
    },

    "by-mojit-action": {
        "verbs": [ "GET" ],
        "path": "/:module/:action",
        "call": "{module}.{action}"
    }
  }
]
