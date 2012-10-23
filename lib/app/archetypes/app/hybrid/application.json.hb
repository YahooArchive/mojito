[
    {
        "settings": [ "master" ],

        "appPort": {{port}},

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
            "hybridapp": {
                "forceRelativePaths": true,
                "urls": ["/yahoo.application.{{name}}/index.html"]
            }
        },

        "yui": {
            "dependencyCalculations": "precomputed+ondemand",
            "base": "/yahoo.libs.yui/",
            "url": "$$yui.base$$yui/yui-min.js",
            "loader": "loader/loader-min.js"
        }
    }
]
