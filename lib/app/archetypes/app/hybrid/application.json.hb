[
    {
        "settings": [ "master" ],

        "specs": {
            "frame": {
                "base": "top_frame"
            }
        },

        "staticHandling": {
            "appName": "yahoo.application.{{name}}",
            "prefix": "yahoo.application.{{name}}"
        },

        "builds": {
            "html5app": {
                "forceRelativePaths": true,
                "urls": ["/yahoo.application.{{name}}/index.html"]
            }
        },

        "yui": {
            "dependencyCalculations": "precomputed"
        }
    },

    {
        "settings": [ "environment:dev" ],
        "yui": {
            "base": "/yahoo.libs.yui/",
            "url": "$$yui.base$$yui/yui-min.js",
            "loader": "loader/loader-min.js"
        }
    }
]
