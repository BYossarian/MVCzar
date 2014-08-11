function Emitter(events) {

    this.handlers = {};

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

    if (this.handlers[event]) {
        this.handlers[event].push(handler);
    } else {
        this.handlers[event] = [handler];
    }

    return this;

};

Emitter.prototype.off = function(event, handler) {
    
    if (this.handlers[event]) {
        if (handler) {
            // remove all instances of handler

            var i = this.handlers[event].length;

            while (i--) {
                if (this.handlers[event][i] === handler) {
                    this.handlers[event].splice(i,1);
                }
            }

        } else {
            // clear out all event handlers for stated event
            while (this.handlers[event].length) {
                this.handlers[event].pop();
            }
        } 
    }

    return this;

};

Emitter.prototype.emit = function(event) {

    // call all handlers for stated event
    if (this.handlers[event]) {
        for (var i=0, l=this.handlers[event].length; i<l; i++) {
            this.handlers[event][i].call(this);
        }
    }

    return this;

};