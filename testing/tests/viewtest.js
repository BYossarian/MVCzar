describe("The View Class", function() {
    
    it("inherits from Emitter", function() {

        var view = new MVCzar.View();

        expect(view instanceof MVCzar.Emitter).toBe(true);

    });

    it("has a linked DOM element that can be selected on initialisation", function() {

        var div = document.createElement('div'),
            para = document.createElement('p');

        div.appendChild(para);
        div.id="testDiv";

        document.body.appendChild(div);

        // initialise a view without an explicit element results in a new div
        var view1 = new MVCzar.View();

        expect(view1.elem.tagName).toBe('DIV');

        // initialise a view with a direct reference to a DOM element
        var view2 = new MVCzar.View({
            elem: div
        });

        expect(view2.elem).toBe(div);

        // initialise a view with a selector for a DOM element
        var view3 = new MVCzar.View({
            elem: '#testDiv p'
        });

        expect(view3.elem).toBe(para);

        // initialise a view with a selector for a DOM element that doesn't exist
        // results in a new div element being used instead
        var view4 = new MVCzar.View({
            elem: '#testDiv .notARealClass ul'
        });

        expect(view4.elem.tagName).toBe('DIV');

    });

    it("has a render function to draw the contents of it's element, in which 'this' is set to the view", function() {

        var para = document.createElement('p'),
            view = new MVCzar.View({
                elem: para
            });

        // initial call is fine but shouldn't throw an error
        view.render();

        // doesn't do anything initialially
        expect(para.innerHTML).toBe("");

        // use setRender to change function
        view.setRender(function() {
            this.elem.innerHTML = "Testing this real good";
        });

        view.render();

        // doesn't do anything initialially
        expect(para.innerHTML).toBe("Testing this real good");

        // render can be set on initialisation
        var para2 = document.createElement('p'),
            view2 = new MVCzar.View({
                elem: para2,
                render: function() {
                    this.elem.innerHTML = "Watch the magic happen"
                }
            });

        view2.render();

        expect(para2.innerHTML).toBe("Watch the magic happen");

    });

    it("can be linked to particular model on initialisation", function() {

        var model = new MVCzar.Model(),
            view = new MVCzar.View({
                model: model
            });

        expect(view.model).toBe(model);

    });

    it("can listen to events on Event Emitters with 'this' referencing the view", function() {

        var model = new MVCzar.Model(),
            view = new MVCzar.View({
                model: model
            }),
            that = null,
            theOther = null,
            result = 0;

        view.observe(model, "change", function(e) {
            that = this;
            theOther = e.target;
            result++;
        });

        model.set("someProp", 123);

        expect(that).toBe(view);
        expect(theOther).toBe(model);
        expect(result).toBe(1);

        // unobserve model
        view.unobserve(model, "change");

        model.set("someProp", 12345);

        expect(result).toBe(1);

    });

    it("can listen to DOM events from within it's element with 'this' referencing the view", function() {

        var div = document.createElement('div'),
            para = document.createElement('p'),
            that = null;

        div.appendChild(para);
        div.id="testDiv2";

        document.body.appendChild(div);

        var view = new MVCzar.View({
            elem: para
        });

        view.addDOMEvent("click", "#testDiv2 p", function() {
            that = this;
        });

        para.click();

        expect(that).toBe(view);

    });

});