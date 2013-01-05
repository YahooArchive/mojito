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
                "forceRelativePaths": false,
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
            "config": {
                "seed": [
                    "/yahoo.libs.yui/yui-base/yui-base-min.js",
                    "/yahoo.libs.yui/loader-base/loader-base-min.js",
                    "loader-yui3-resolved{langPath}",
                    "loader-app",
                    "loader-app-resolved{langPath}"
                ],
                "base": "/yahoo.libs.yui/",
                "combine": false,
                "root": "",
                "groups": {
                    "app": {
                        "combine": false,
                        "base": "//yahoo.com",
                        "root": ""
                    }
                }
            }
        }
    }
]
