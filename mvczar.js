MVCzar = (function() {

    "use strict";

    var exports = {};

    // ***************************************
    // Event Emitter Interface
    // ***************************************

    function Emitter(events) {

        this._handlers = {};
        this._observers = {};

        if (events) {
            // add initial events
            for (var event in events) {
                if (events.hasOwnProperty(event)) {
                    this.on(event, events[event]);
                }
            }
        }

    };

    Emitter.prototype.on = function(event, handler) {

        if (this._handlers[event]) {
            this._handlers[event].push(handler);
        } else {
            this._handlers[event] = [handler];
        }

        return this;

    };

    Emitter.prototype.off = function(event, handler) {
        
        if (this._handlers[event]) {
            if (handler) {
                // remove all instances of handler

                var i = this._handlers[event].length;

                while (i--) {
                    if (this._handlers[event][i] === handler) {
                        this._handlers[event].splice(i,1);
                    }
                }

            } else {
                // clear out all event handlers for stated event
                while (this._handlers[event].length) {
                    this._handlers[event].pop();
                }
            } 
        }

        return this;

    };

    Emitter.prototype.addObserver = function(event, observer, handler) {

        if (this._observers[event]) {
            this._observers[event].push({
                observer: observer,
                handler: handler
            });
        } else {
            this._observers[event] = [{
                observer: observer,
                handler: handler
            }];
        }

        return this;

    };

    Emitter.prototype.removeObserver = function(event, observer, handler) {

        if (this._observers[event]) {

            var i = this._observers[event].length;
            
            while (i--) {
                
                // check observer
                if (this._observers[event][i].observer === observer) {

                    // if no specific handler is listed, or if the handlers match, remove it
                    if (typeof handler === "undefined" || this._observers[event][i].handler === handler) {
                        this._observers[event].splice(i,1);
                    }

                }

            }

        }

        return this;

    };

    Emitter.prototype.emit = function(event, eventData) {

        // the event object
        var e = {
            target: this,
            type: event
        };

        if (typeof eventData !== "undefined") {
            e.data = eventData;
        }

        // call all handlers for stated event
        if (this._handlers[event]) {

            for (var i = 0, l = this._handlers[event].length; i<l; i++) {
                this._handlers[event][i].call(this, e);
            }


        }

        // inform all observers of stated event
        if (this._observers[event]) {

            for (var j = 0, k = this._observers[event].length; j<k; j++) {
                this._observers[event][j].handler.call(this._observers[event][j].observer, e);
            }

        }

        return this;

    };

    exports.Emitter = Emitter;

    // ***************************************
    // Model Interface
    // ***************************************

    function Model(setup) {

        setup = setup || {};

        // set any events 
        Emitter.call(this, setup.events);

        this._props = {};

        // set initial values (silently - i.e. without triggering event handlers)
        if (setup.initial) {
            this.set(setup.initial, true);
        }

    }

    // Model inherits from Emitter
    Model.prototype = Object.create(Emitter.prototype);
    Model.prototype.constructor = Model;

    Model.prototype.set = function(a, b, c) {

        // accepts an object and a boolean (silent) or
        // a property name, a value and a boolean (silent)

        if (a instanceof Object) {
            // set multiple properties

            var changed = false;

            for (var prop in a) {
                if (a.hasOwnProperty(prop)) {

                    // only fire change event if value actually changes
                    if (this._props[prop] !== a[prop]) {
                        this._props[prop] = a[prop];
                        if (!b) {
                            // silent flag is false
                            this.emit('change:' + prop);
                        }
                        changed = true;
                    }

                }
            }

            if (changed && !b) {
                this.emit('change');
            }

        } else {
            // set a single property

            // only fire change event if value actually changes
            if (this._props[a] !== b) {
                this._props[a] = b;
                if (!c) {
                    this.emit('change:' + a);
                    this.emit('change');
                }
            }
        }

        return this;

    };

    Model.prototype.get = function(property) {
        
        if (typeof property === "string") {
            return this._props[property];
        } else {
            // return a copy of the _props object
            return JSON.parse(JSON.stringify(this._props));
        }

    };

    Model.prototype.unset = function(property, silent) {

        if (typeof this._props[property] !== "undefined") {
            
            delete this._props[property];
            
            if (!silent) {
                this.emit("change:" + property);
                this.emit('change');
            }

        }

        return this;

    };

    Model.prototype.toJSON = function() {

        // return a copy of the _props object to be used in JSON.stringify
        return this.get();

    };

    exports.Model = Model;

    // ***************************************
    // Router Interface
    // ***************************************

    // there'll only be one Router instance so no need to set up a constructor
    var Router = (function() {

        var useHistory = false,
            Router = Object.create(Emitter.prototype);

        Emitter.call(Router);

        var initialPath = 0,  // webkit bug: use initial path to bypass popstate firing on page load
            currentPath = "",    // used to pass the old path to the route event
            root = "";

        // methods to be defined once .start() has been called
        var getNormalisedPath, go, replace;

        function getHash() {
            // return hash with starting "#/" and trailing slash removed

            return window.location.hash.replace(/^#/, '').replace(/^\//, '').replace(/\/$/, '');
        };

        function getPath() {
            // return path with root and trailing slash removed

            var pathname = window.location.pathname.replace(/\/$/, ''); // removing trailing slash

            if (pathname.indexOf(root) === 0) {
                return pathname.slice(root.length).replace(/^\//, '');  // remove root from pathname & starting /
            }

            return pathname.replace(/^\//, '');
        };

        function refresh(e) {

            var path = getNormalisedPath(),
                route = path.split('/');

            // webkit bug: use initial path to bypass popstate firing on page load
            // basically, it's used so that the 2nd call to refresh after page load
            // will be ignored if the current path is still the same as the first
            // call to refresh. Also, checks for the existance of a passed argument
            // so second refresh is only ignored if it comes from a state change event
            // as opposed to calling router.refresh()
            if (path === initialPath && e) {
                initialPath = 0;
                return;
            }
            initialPath = 0;

            Router.emit("route", {
                oldPath: currentPath,
                path: "/" + path,
                route: route
            });

            currentPath = "/" + path;

        };

        function start(options) {
            
            options = options || {};

            // root defaults to current path
            root = options.root || window.location.pathname;
            // normalise root so that it starts with a slash but doesn't end with one
            // also a root of "/" will be converted to ""
            root = root.replace(/^\/?/, '/').replace(/\/?$/, '');

            var hash = getHash(),
                path = getPath();

            useHistory = !options.useHash;

            // define methods based on useHistory flag

            // gets path (relative to root) without starting or trailing /
            getNormalisedPath = useHistory ? getPath : getHash;

            // navigate to a particular URL
            go = useHistory ? 
                    function(newPath) {
                        window.history.pushState(null, document.title, root + newPath);

                        // pushState doesn't trigger a popstate event so have to trigger manually:
                        refresh();
                    } :
                    function(newPath) {
                        window.location.hash = "#" + newPath;
                    };

            // replace the current URL
            replace = useHistory ? 
                    function(newPath) {
                        window.history.replaceState(null, document.title, root + newPath);

                        // replaceState doesn't trigger a popstate event so have to trigger manually:
                        refresh();
                    } :
                    function(newPath) {
                        window.location.replace("#" + newPath);
                    };

            // normalise current (i.e. initial) url
            if (hash && path) {
                // both a hash and a path
                // in this case, use path and ignore hash
                if (useHistory) {

                    window.history.replaceState(null, document.title, root + "/" + path);

                } else {
                    
                    window.location.replace((root || "/") + "#/" + path); // may trigger page reload

                }

            } else if (hash && useHistory) {
                // has a hash, not a path in a browser with history support

                window.history.replaceState(null, document.title, root + "/" + hash);

            } else if (path && !useHistory) {
                // has a path, not a hash in a browser without history support

                window.location.replace((root || "/") + "#/" + path); // may trigger page reload

            }

            // load current (i.e. initial) page content
            refresh(true);   // need to send true value here to sidestep webkit bug

            // webkit bug: use initial path to bypass popstate firing on page load
            initialPath = getNormalisedPath();

            // event handlers for url change
            if (useHistory) {
                window.addEventListener('popstate', refresh, false);
            } else {
                window.addEventListener('hashchange', refresh, false);
            }

            // make methods publicly available
            Router.go = go;
            Router.replace = replace;
            Router.refresh = refresh;
            Router.getPath = function() {
                return "/" + getNormalisedPath();
            };

            return Router;

        }

        Router.start = start;

        return Router;

    })();

    exports.Router = Router;

    return exports;

})();