MVCzar = (function() {

    var exports = {};

    // ***************************************
    // Event Emitter Interface
    // ***************************************

    function Emitter(events) {

        this._handlers = {};

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

    Emitter.prototype.emit = function(event) {

        // call all handlers for stated event
        if (this._handlers[event]) {
            for (var i=0, l=this._handlers[event].length; i<l; i++) {
                this._handlers[event][i].call(this);
            }
        }

        return this;

    };

    exports.Emitter = Emitter;

    return exports;

})();