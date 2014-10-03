describe("The Router", function() {

    var startingPath = window.location.href;
    
    it("inherits from Emitter", function() {

        expect(MVCzar.Router instanceof MVCzar.Emitter).to.be.true;

    });

    it("has a start method to begin the router", function() {

        expect(MVCzar.Router.go()).to.be.undefined;
        expect(MVCzar.Router.getPath()).to.be.undefined;
        expect(MVCzar.Router.refresh()).to.be.undefined;
        expect(MVCzar.Router.replace()).to.be.undefined;

        MVCzar.Router.start({
            root: window.location.pathname
        });

        //expect(MVCzar.Router.go).to.not.be.undefined;
        expect(MVCzar.Router.getPath()).to.not.be.undefined;
        //expect(MVCzar.Router.refresh).to.not.be.undefined;
        //expect(MVCzar.Router.replace).to.not.be.undefined;

    });

    it("has a .getPath() method that returns a path relative to the application's root", function() {

        expect(MVCzar.Router.getPath()).to.equal("/");

    });

    it("has a .go() method to push a new state to the history stack without page reload", function() {

        var historyStackLength = window.history.length;

        MVCzar.Router.go('/test/path');

        expect(MVCzar.Router.getPath()).to.equal('/test/path');
        expect(window.location.href).to.equal(startingPath.replace(/\/$/, '') + '/test/path');
        
        // NOTE: some broswers limit history stack length doing lots 
        // of repeating testing will cause this limit to be reached
        // and hence this test will unfairly fail - just start testing
        // again in a new window/tab
        expect(window.history.length).to.equal(historyStackLength + 1);

    });

    it("has a .refresh() method to refresh the current page without changing the history state", function() {

        MVCzar.Router.go('/test/path');

        var historyStackLength = window.history.length;

        expect(MVCzar.Router.getPath()).to.equal('/test/path');
        expect(window.location.href).to.equal(startingPath.replace(/\/$/, '') + '/test/path');

        MVCzar.Router.refresh();

        expect(MVCzar.Router.getPath()).to.equal('/test/path');
        expect(window.location.href).to.equal(startingPath.replace(/\/$/, '') + '/test/path');

        expect(window.history.length).to.equal(historyStackLength);

    });

    it("has a .replace() method to refresh the current page without changing the history state", function() {

        MVCzar.Router.go('/test/path');

        var historyStackLength = window.history.length;

        expect(MVCzar.Router.getPath()).to.equal('/test/path');
        expect(window.location.href).to.equal(startingPath.replace(/\/$/, '') + '/test/path');

        MVCzar.Router.replace('/different/path');

        expect(MVCzar.Router.getPath()).to.equal('/different/path');
        expect(window.location.href).to.equal(startingPath.replace(/\/$/, '') + '/different/path');

        expect(window.history.length).to.equal(historyStackLength);

    });

    it("emits 'route' events when called and passes an event object to the handler with routing information", function() {

        var eventObj = null,
            that = null,
            path = MVCzar.Router.getPath();

        MVCzar.Router.on("route", function(e) {

            eventObj = e;
            that = this;

        });

        // testing for the go function
        MVCzar.Router.go('/new/path');

        expect(eventObj).to.deep.equal({
            type: "route",
            target: MVCzar.Router,
            path: "/new/path",
            route: ["new", "path"],
            oldPath: path
        });
        expect(that).to.equal(MVCzar.Router);
        
        // testing for the refresh function
        MVCzar.Router.refresh();

        expect(eventObj).to.deep.equal({
            type: "route",
            target: MVCzar.Router,
            path: "/new/path",
            route: ["new", "path"],
            oldPath: "/new/path"
        });

        // testing for the replace function
        MVCzar.Router.replace('/another/new/path');

        expect(eventObj).to.deep.equal({
            type: "route",
            target: MVCzar.Router,
            path: "/another/new/path",
            route: ["another", "new", "path"],
            oldPath: "/new/path"
        });

    });

    it("emits 'pathchange' events when the URL actually changes", function() {

        var routeEvents = 0,
            pathchangeEvents = 0;

        MVCzar.Router.go("/a/path");

        MVCzar.Router.on("pathchange", function() {

            pathchangeEvents++;

        }).on("route", function() {

            routeEvents++;

        });

        // change URL
        MVCzar.Router.go('/new/path');
        expect(routeEvents).to.equal(1);
        expect(pathchangeEvents).to.equal(1);

        // refresh
        MVCzar.Router.refresh();
        expect(routeEvents).to.equal(2);
        expect(pathchangeEvents).to.equal(1);

        // go, but to same URL
        MVCzar.Router.go('/new/path');
        expect(routeEvents).to.equal(3);
        expect(pathchangeEvents).to.equal(1);

        // replace
        MVCzar.Router.replace('/different/path');
        expect(routeEvents).to.equal(4);
        expect(pathchangeEvents).to.equal(2);

        // replace, but with same URL
        MVCzar.Router.replace('/different/path');
        expect(routeEvents).to.equal(5);
        expect(pathchangeEvents).to.equal(2);


        // reset path *****************
        MVCzar.Router.go("/");

    });

});