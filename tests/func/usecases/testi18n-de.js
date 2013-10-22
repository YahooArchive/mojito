/*
 * This is a basic func test for a UseCase application.
 */
YUI.add('usecases-testi18n-de-tests', function (Y) {
    var suite = new Y.Test.Suite("UseCases: i18n-de");

    suite.add(new Y.Test.Case({
        "test i18n-de": function() {
            var title = Y.one('h2').get('innerHTML');
            Y.Assert.areEqual('Hallo!', title.match(/Hallo!/gi)); 
            Y.Assert.areEqual('Sie Ihre Bilder', title.match(/Sie Ihre Bilder/gi)); 
            var imagelink = Y.all('a').item(1).get('href');
            Y.Assert.areEqual('http:', imagelink.match(/http:/gi));
            Y.Assert.areEqual('/static/usecase/assets', imagelink.match(/\/static\/usecase\/assets/gi));

            Y.Intl.add("datatype-date-format", "de", {
                "x":"%d/%m/%Y"
            });
            Y.Intl.setLang("datatype-date-format", "de");
            var mydate = Y.DataType.Date.format(new Date(), {format:"%d/%m/%Y"});
            var expecteddate = mydate.slice(0,6)+mydate.slice(8,10);
            Y.Assert.areEqual(expecteddate.replace(/\//g, "."), title.substr(title.indexOf('-')+2, 8));
        }

    }));

    Y.Test.Runner.add(suite);
}, '0.0.1', {requires: [
    'node', 'node-event-simulate', 'test', 'console', 'intl', 'datatype-date-format'
]});
