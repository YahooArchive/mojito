clean::
	find . -type d -name "artifacts" -exec rm -rf {} \;

test:
	mojito test mojito-deploy-addon
	arrow tests/unit/lib/app/autoload/test_descriptor.json --driver=selenium --reuseSession --test mojito-client.client
