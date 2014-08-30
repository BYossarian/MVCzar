// TO DO:

// editting tasks
// h1 font/something to give it some style
// clean up code

var router = MVCzar.Router.start({
    useHash: true,
    root: window.location.pathname
});

var toDos = new MVCzar.ModelList({
    defaults: {
        completed: false,
        task: "Do something"
    }
});

var appView = new MVCzar.View({

    elem: 'main',

    DOMEvents: [
                    ["keyup", "input", function(e) {
                        // create new todo item

                        var task = e.target.value.trim();

                        if (!(e.keyCode === 13 && task !== "")) {
                            return;
                        }

                        toDos.add({
                            task: task
                        });

                        e.target.value = "";

                    }],
                    ["click", "footer a", function(e) {
                        // change filtering of to do items

                        router.go(e.target.href.replace(/^.+\//, "/"));

                        e.preventDefault();

                    }],
                    ["click", "footer button", function() {
                        // delete all completed to do items

                        // need to filter first to avoid issue of
                        // removing elements whilst looping
                        toDos.filter(function(model) {

                            return model.get("completed");

                        }).forEach(function(model) {

                            toDos.remove(model);

                        });

                    }]
                ],

    setup: function() {

        // cache elements
        this.elemCache = {};
        this.elemCache.toDoList = document.getElementById('toDoList');
        this.elemCache.tasksLeft = this.elem.querySelector('footer .tasksLeft');
        this.elemCache.filters = this.elem.querySelectorAll('.listFilter a');
        this.elemCache.status = document.getElementById('status');

        this.observe(toDos, "add", function(e) {
            // create View and add it to the DOM
            
            this.elemCache.toDoList.appendChild((new ToDoView(e.model)).render().elem);

            this.render();

            this.observe(e.model, "change", saveToDos);

            saveToDos();

        });

        this.observe(toDos, "remove", function() {

            this.render();

            saveToDos();

        });

        this.observe(router, "route", function() {

            this.render().emit("filter");

        });

        this.render();

    },

    render: function() {

        var tasksLeft = toDos.length,
            tasksDone = toDos.filter(function(model) {

                return model.get("completed");

            }).length;

        // update tasks left
        this.elemCache.tasksLeft.innerHTML = "<strong>" + tasksLeft + "</strong> task" + (tasksLeft === 1 ? "" : "s") + " left";

        // highlight correct filter selection
        Array.prototype.forEach.call(this.elemCache.filters, function(elem) {

            elem.className = "";

        });

        this.elemCache.status.className = "hidden";

        switch(router.getPath()) {

            case "/completed":

                this.elemCache.filters[1].className = "selected";

                if (!tasksDone) {

                    this.elemCache.status.innerHTML = "No tasks completed.";
                    this.elemCache.status.className = "";

                }

                break;

            case "/unfinished":

                this.elemCache.filters[2].className = "selected";

                if (tasksDone === tasksLeft) {

                    this.elemCache.status.innerHTML = "No unfinished tasks. :)";
                    this.elemCache.status.className = "";

                }

                break;

            default:

                this.elemCache.filters[0].className = "selected";
                
                if (!tasksLeft) {

                    this.elemCache.status.innerHTML = "No tasks to do.";
                    this.elemCache.status.className = "";

                }

        }

    }

});

function ToDoView(model) {

    // inherit from MVCzar View
    MVCzar.View.call(this, {
        
        elem: document.createElement('li'),
        
        DOMEvents: [
                        ["change", "[type='checkbox']", function(e) {
                            // change completed state

                            this.model.set("completed", !!e.target.checked);

                        }],
                        ["click", "button", function(e) {
                            // delete the to do

                            toDos.remove(this.model);

                        }]
                    ],
        
        model: model,

        render: function() {

            this.elemCache.task.innerHTML = this.model.get("task");

            var className = "",
                filter = router.getPath();

            if (this.model.get("completed")) {
                className += " done";

                if (filter === "/unfinished") {
                    className += " hidden";
                }

            } else {
                
                if (filter === "/completed") {
                    className += " hidden";
                }

            }

            this.elem.className = className;

        },

        setup: function() {

            this.elem.innerHTML = "<label><input type='checkbox'></label><span></span><button></button>";

            this.elemCache = {};
            this.elemCache.task = this.elem.querySelector('span');

            this.observe(model, "change", this.render);

            this.observe(appView, "filter", this.render);

            this.observe(model, "remove", function() {

                // clean up
                this.unobserve(model, "change");
                this.unobserve(model, "remove");
                this.unobserve(appView, "filter");

                this.removeDOMEvent("change");
                this.removeDOMEvent("click");

                this.elem.parentNode.removeChild(this.elem);

            });

        }

    });    

};

// inherit from MVCzar View
ToDoView.prototype = Object.create(MVCzar.View.prototype);

function saveToDos() {

    localStorage.setItem("toDoList", JSON.stringify(toDos));

}

function loadToDos() {

    var toDoList = JSON.parse(localStorage.getItem("toDoList"));

    if (toDoList) {

        toDoList.forEach(function(toDo) {

            toDos.add(toDo);

        });

    }

}

loadToDos();