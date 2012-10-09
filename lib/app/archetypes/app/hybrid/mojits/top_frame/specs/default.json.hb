[
	{
		"settings": [ "master" ],

		"type": "HTMLFrameMojit",
		"config": {
			"deploy": true,
			"title": "{{name}} App",
			"child": {
				"type": "top_frame"
			},
			"assets": {
			    "top": {
			    	"css": ["./index.css"]
			    },
				"bottom": {
					"js": ["/yahoo.ychrome.lib/yui-cfg.js"]
				}
			}
		}
	}
]
