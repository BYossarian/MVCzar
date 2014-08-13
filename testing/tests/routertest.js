describe("The Router", function() {

    var startingPath = window.location.href;
    
    it("inherits from Emitter", function() {

        expect(MVCzar.Router instanceof MVCzar.Emitter).toBe(true);

    });

    it("has a start method to begin the router", function() {

        expect(MVCzar.Router.go).toBeUndefined();
        expect(MVCzar.Router.getPath).toBeUndefined();
        expect(MVCzar.Router.refresh).toBeUndefined();
        expect(MVCzar.Router.replace).toBeUndefined();

        MVCzar.Router.start();

        expect(MVCzar.Router.go).toBeDefined();
        expect(MVCzar.Router.getPath).toBeDefined();
        expect(MVCzar.Router.refresh).toBeDefined();
        expect(MVCzar.Router.replace).toBeDefined();

    });

    it("has a .getPath() method that returns a path relative to the application's root", function() {

        expect(MVCzar.Router.getPath()).toBe("/");

    });

    it("has a .go() method to push a new state to the history stack without page reload", function() {

        var historyStackLength = window.history.length;

        MVCzar.Router.go('/test/path');

        expect(MVCzar.Router.getPath()).toBe('/test/path');
        expect(window.location.href).toBe(startingPath.replace(/\/$/, '') + '/test/path');
        
        expect(window.history.length).toBe(historyStackLength + 1);

    });

    it("has a .refresh() method to refresh the current page without changing the history state", function() {

        MVCzar.Router.go('/test/path');

        var historyStackLength = window.history.length;

        expect(MVCzar.Router.getPath()).toBe('/test/path');
        expect(window.location.href).toBe(startingPath.replace(/\/$/, '') + '/test/path');

        MVCzar.Router.refresh();

        expect(MVCzar.Router.getPath()).toBe('/test/path');
        expect(window.location.href).toBe(startingPath.replace(/\/$/, '') + '/test/path');

        expect(window.history.length).toBe(historyStackLength);

    });

    it("has a .replace() method to refresh the current page without changing the history state", function() {

        MVCzar.Router.go('/test/path');

        var historyStackLength = window.history.length;

        expect(MVCzar.Router.getPath()).toBe('/test/path');
        expect(window.location.href).toBe(startingPath.replace(/\/$/, '') + '/test/path');

        MVCzar.Router.replace('/different/path');

        expect(MVCzar.Router.getPath()).toBe('/different/path');
        expect(window.location.href).toBe(startingPath.replace(/\/$/, '') + '/different/path');

        expect(window.history.length).toBe(historyStackLength);

    });

    it("emits route events when called and passes an event object to the handler with routing information", function() {

        var eventObj = null,
            that = null,
            path = MVCzar.Router.getPath();

        MVCzar.Router.on("route", function(e) {

            eventObj = e;
            that = this;

        });

        // testing for the go function
        MVCzar.Router.go('/new/path');

        expect(eventObj).toEqual({
            type: "route",
            target: MVCzar.Router,
            data: {
                path: "/new/path",
                route: ["new", "path"],
                oldPath: path
            }
        });
        expect(that).toBe(MVCzar.Router);

        // testing for the refresh function
        MVCzar.Router.refresh();

        expect(eventObj).toEqual({
            type: "route",
            target: MVCzar.Router,
            data: {
                path: "/new/path",
                route: ["new", "path"],
                oldPath: "/new/path"
            }
        });

        // testing for the replace function
        MVCzar.Router.replace('/another/new/path');

        expect(eventObj).toEqual({
            type: "route",
            target: MVCzar.Router,
            data: {
                path: "/another/new/path",
                route: ["another", "new", "path"],
                oldPath: "/new/path"
            }
        });

    });

});