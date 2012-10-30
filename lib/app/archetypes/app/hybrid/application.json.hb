[
    {
        "settings": [ "master" ],

        "appPort": "{{port}}",

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
                "urls": ["/yahoo.application.{{name}}/index.html"],
                "packages": {
                    "yahoo.libs.yui": "*"
                }
            }
        }
    },

    {
        "settings": ["build:debug"],

        "yui": {
            "dependencyCalculations": "precomputed",
            "base": "/yahoo.libs.yui/",
            "url": "$$yui.base$$yui/yui-debug.js",
            "loader": "loader/loader-debug.js"
        }
    }
]
