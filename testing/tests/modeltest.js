describe("The Model Class", function() {
    
    it("Inherits from Emitter", function() {

        var model = new MVCzar.Model();

        expect(model instanceof MVCzar.Emitter).toBe(true);

    });

    it("Allows events to be set on initialisation", function() {

        var result = false,
            that = null;

        var model = new MVCzar.Model({
            events: {
                someEvent: function() {
                    result = true;
                    that = this;
                }
            }
        });

        model.emit('someEvent');

        expect(result).toBe(true);
        expect(that).toBe(model);

    });

    it("Has a getter and setter", function() {

        var model = new MVCzar.Model();

        var obj = {
            qwe: 123
        };

        // setting a single property
        model.set("someProp", "someValue");

        expect(model.get("someProp")).toBe("someValue");
        expect(model.get("anotherProp")).toBeUndefined();

        // setting many properties
        model.set({
            anotherProp: "hey",
            moreProp: true
        });

        expect(model.get("someProp")).toBe("someValue");
        expect(model.get("anotherProp")).toBe("hey");
        expect(model.get("moreProp")).toBe(true);

        // setting an object
        model.set("object", obj);

        expect(model.get("object")).toBe(obj);

    });

    it("Allows properties to be set on initialisation", function() {

        var model = new MVCzar.Model({
            initial: {
                someProp: "hey",
                someNum: 42
            }
        });

        expect(model.get("someProp")).toBe("hey");
        expect(model.get("someNum")).toBe(42);
        expect(model.get("anotherProp")).toBeUndefined();

    });

    it("Emits change events when changing properties", function() {

        var changeAny = 0,
            changeParticular = 0;

        var model = new MVCzar.Model({
            events: {
                change: function() {
                    changeAny++;
                },
                "change:someProp": function() {
                    changeParticular++;
                }
            }
        });

        model.set("aProp", "value");
        expect(changeAny).toBe(1);

        // setting the same value shouldn't trigger a change event
        model.set("aProp", "value");
        expect(changeAny).toBe(1);

        model.set("someProp", "someValue");
        expect(changeAny).toBe(2);
        expect(changeParticular).toBe(1);

        model.set("aProp", "different");
        expect(changeAny).toBe(3);
        expect(changeParticular).toBe(1);

        // setting multiple properties at once
        // should only trigger change event once
        // also maintaining same value for someProp
        // so shouldn't trigger that particular handler
        model.set({
            someProp: "someValue",
            tooManyProps: 10
        });
        expect(changeAny).toBe(4);
        expect(changeParticular).toBe(1);

    });

    it("allows you to set properties silently", function() {

        var changeAny = 0,
            changeParticular = 0;

        var model = new MVCzar.Model({
            events: {
                change: function() {
                    changeAny++;
                },
                "change:someProp": function() {
                    changeParticular++;
                }
            }
        });

        // check handlers are attached
        model.set("aProp", "value");
        expect(changeAny).toBe(1);

        model.set("someProp", "someValue");
        expect(changeAny).toBe(2);
        expect(changeParticular).toBe(1);

        // silently change a single value
        model.set("aProp", "value2", true);
        model.set("someProp", "someValue2", true);
        expect(changeAny).toBe(2);
        expect(changeParticular).toBe(1);

        // silently change multiple values
        model.set({
            someProp: "someValue",
            tooManyProps: 10
        }, true);
        expect(changeAny).toBe(2);
        expect(changeParticular).toBe(1);

    });

});