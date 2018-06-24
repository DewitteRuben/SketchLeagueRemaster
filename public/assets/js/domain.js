const Domain = (function () {
    var MAPPING_PENCIL_SIZES = {
        DEFAULT: 4,
        NORMAL: 6,
        LARGE: 8,
        BIGGER: 10
    };

    function Socket() {
        this.socket = io({transports: ['websocket'], upgrade: false});
    }

    Socket.prototype.setListener = function (event, fn) {
        this.socket.on(event, fn);
    };

    Socket.prototype.emit = function (key, msg) {
        this.socket.emit(key, msg);
    };

    Socket.prototype.getID = function () {
        return this.socket.id;
    };

    function StrokeStorage() {
        this.strokes = [];
        this.lastStroke = [];
        this.amtDots = 0;
    }

    StrokeStorage.prototype.initStroke = function (color, size) {
        var stroke = {};
        stroke["color"] = color;
        stroke["brushSize"] = size;
        this.strokes.push(stroke);
        this.lastStroke.push(stroke);
    };

    StrokeStorage.prototype.addDot = function (x1, y1, x2, y2) {
        var curStroke = this.strokes[this.strokes.length === 0 ? 0 : this.strokes.length - 1];
        var lastStroke = this.lastStroke[0];
        curStroke[this.amtDots] = [x1, y1, x2, y2];
        lastStroke[this.amtDots] = [x1, y1, x2, y2];
        this.amtDots++;
    };

    StrokeStorage.prototype.endStroke = function () {
        this.amtDots = 0;
        this.lastStroke = [];
    };

    StrokeStorage.prototype.removeLastStroke = function () {
        if (this.strokes.length > 0) {
            this.strokes.pop();
        }
    };

    function SketchPanel(id, socket, width, height) {
        var _this = this;

        this.container = document.getElementById(id);
        this.defaultColor = 'black';
        this.backgroundColor = 'white';
        this.brushSize = MAPPING_PENCIL_SIZES.DEFAULT;
        this.currentColor = this.defaultColor;
        this.drawing = true;
        this.eraser = false;
        this.renderer = null;
        this.strokeStorage = new StrokeStorage();
        this.socket = socket;

        if (this.socket) {
            this.socket.setListener(SOCKET_EVENTS.DRAW, (data) => {
                this.drawOther(data);
            });
            this.socket.setListener(SOCKET_EVENTS.UNDO, (data) => {
                this.clear();
                this.drawOther(data);
            });
        }


        function init(sketch) {
            sketch.setup = function () {
                _this.renderer = sketch.createCanvas(width || _this.container.offsetWidth, height || _this.container.offsetHeight);
                _this.setEventListeners();
                sketch.strokeWeight(_this.brushSize);
                sketch.background(_this.backgroundColor);
                sketch.stroke(_this.defaultColor);
            };

            sketch.mousePressed = function () {
                var brushColor = _this.eraser ? _this.backgroundColor : _this.currentColor;
                sketch.stroke(brushColor);
                _this.strokeStorage.initStroke(brushColor, _this.brushSize);
                sketch.point(sketch.mouseX, sketch.mouseY);
                _this.strokeStorage.addDot(sketch.mouseX, sketch.mouseY);
                _this.emitLastStroke();
                return false;
            };

            sketch.mouseReleased = function () {
                _this.strokeStorage.endStroke();
                return false;
            };

            sketch.mouseDragged = function () {
                sketch.line(sketch.mouseX, sketch.mouseY, sketch.pmouseX, sketch.pmouseY);
                _this.strokeStorage.addDot(sketch.mouseX, sketch.mouseY, sketch.pmouseX, sketch.pmouseY);
                _this.emitLastStroke();
                return false;
            };
        }

        this.reloadSetup = () => {
            init.bind(this, this.p5)();
        };

        this.p5 = new p5(init, this.container);

    }

    SketchPanel.prototype.emitLastStroke = function () {
        if (this.socket) {
            this.socket.emit(SOCKET_EVENTS.DRAW, this.strokeStorage.lastStroke);
        }
    };

// TODO fix that other player can undo everyone else even though he or she is not drawing
    SketchPanel.prototype.undo = function () {
        this.clear();
        this.strokeStorage.removeLastStroke();
        if (this.socket) this.socket.emit(SOCKET_EVENTS.UNDO, this.strokeStorage.strokes);
        this.strokeStorage.strokes.forEach(coordinates => this.draw(coordinates));
    };

    SketchPanel.prototype.clear = function (removeStorage) {
        if (removeStorage) {
            this.strokeStorage = new StrokeStorage();
        }
        this.p5.background(this.backgroundColor);
    };

    SketchPanel.prototype.changeColor = function (color) {
        this.p5.stroke(color);
        this.currentColor = color;
    };

    SketchPanel.prototype.changeSize = function (size) {
        this.p5.strokeWeight(MAPPING_PENCIL_SIZES[size]);
        this.brushSize = MAPPING_PENCIL_SIZES[size];
    };

    SketchPanel.prototype.enableEraser = function () {
        this.eraser = true;
    };

    SketchPanel.prototype.enablePencil = function () {
        this.eraser = false;
    };

    SketchPanel.prototype.disableControls = function () {
        this.resetMouse();
        this.p5.mousePressed = null;
        this.p5.mouseReleased = null;
        this.p5.mouseDragged = null;
        this.drawing = false;
        this.clear(true);
    };

    SketchPanel.prototype.resetMouse = function() {
        $(this.container).trigger("mouseup");
    };

    SketchPanel.prototype.enableControls = function () {
        this.disableControls();
        this.reloadSetup();
        this.drawing = true;
        this.clear(true);
    };

    SketchPanel.prototype.setEventListeners = function () {
        // Unbind all window listeners and set them only on the canvas element
        for (var e in this.p5._events) {
            if (this.p5._events.hasOwnProperty(e)) {
                var f = this.p5._events[e];
                window.removeEventListener(e, f, false);
                this.p5._events[e] = null;
                var f = this.p5['_on' + e];
                if (f) {
                    var m = f.bind(this.p5);
                    this.renderer.elt.addEventListener(e, m, {passive: false});
                    this.p5._events[e] = m;
                }
            }
        }
    };

    SketchPanel.prototype.draw = function (coordinates) {
        this.p5.stroke(coordinates.color ? coordinates.color : this.defaultColor);
        this.p5.strokeWeight(coordinates.brushSize ? coordinates.brushSize : this.brushSize);
        for (var key in coordinates) {
            if (coordinates.hasOwnProperty(key) && !isNaN(parseInt(key))) {
                var x1 = coordinates[key][0];
                var y1 = coordinates[key][1];
                var x2 = coordinates[key][2];
                var y2 = coordinates[key][3];
                if (!x2 || !y2) {
                    this.p5.point(x1, y1);
                } else {
                    this.p5.line(x1, y1, x2, y2);
                }
            }
        }
        this.resetColor();
        this.resetSize();
    };

    SketchPanel.prototype.resetSize = function () {
        this.p5.strokeWeight(this.brushSize);
    };

    SketchPanel.prototype.resetColor = function () {
        this.p5.stroke(this.currentColor);
    };

    SketchPanel.prototype.drawOther = function (arrOfStrokes) {
        arrOfStrokes.forEach(coordinates => this.draw(coordinates));
    };


    function Pallet(sketch) {
        this.sketch = sketch;
        this.setColorClickHandler(this.colorHandler(this.sketch));
        this.setEraserClickHandler(this.eraseHandler(this.sketch));
        this.setBrushClickHandler(this.brushHandler(this.sketch));
        this.setSizeClickHandler(this.sizeHandler(this.sketch));
        this.setUndoClickhandler(this.undoHandler(this.sketch));
    }

    Pallet.prototype.colorHandler = function (sketch) {
        return function () {
            var color = $(this).data("color");
            sketch.changeColor(color);
        }
    };

    Pallet.prototype.eraseHandler = function (sketch) {
        return function () {
            sketch.enableEraser();
            $(this).parents(".tools").find("button").each((i, e) => {
                $(e).removeClass("active");
            });
            $(this).addClass("active");
        }
    };

    Pallet.prototype.brushHandler = function (sketch) {
        return function () {
            sketch.enablePencil();
            $(this).parents(".tools").find("button").each((i, e) => {
                $(e).removeClass("active");
            });
            $(this).addClass("active");
        }
    };

    Pallet.prototype.undoHandler = function (sketch) {
        return function () {
            sketch.undo();
        }
    };


    Pallet.prototype.sizeHandler = function (sketch) {
        return function () {
            var size = $(this).data("size");
            sketch.changeSize(size);
            $(this).parents(".sizes").find("button").each((i, e) => {
                $(e).removeClass("active");
            });
            $(this).addClass("active");
        }
    };

    Pallet.prototype.setColorClickHandler = function (fn) {
        $(".pallet .colors").on("click", "button", fn);
    };

    Pallet.prototype.setEraserClickHandler = function (fn) {
        $(".pallet .tools").on("click", ".eraser", fn);
    };

    Pallet.prototype.setSizeClickHandler = function (fn) {
        $(".pallet .sizes .default").button("toggle"); // set default size on start
        $(".pallet .sizes").on("click", "button", fn);
    };

    Pallet.prototype.setUndoClickhandler = function (fn) {
        $(".pallet .actions").on("click", ".undo", fn);
    };

    Pallet.prototype.setBrushClickHandler = function (fn) {
        $(".pallet .tools .brush").button("toggle"); // enable brush on launch
        $(".pallet .tools").on("click", ".brush", fn);
    };


    function Chat(chatbox, user, socket) {
        this.chatbox = chatbox;
        this.user = user;
        this.socket = socket;
    }


    Chat.prototype.send = function (message) {
        // TODO figure out why the CB gives undefined
        // this.socket.emit("client-msg", message2obj(this.user, message), (data) => {
        //     this.printInChatbox(`${this.user}: ${data.message}`);
        // });

        this.socket.emit("client", message2obj(this.user, message));
        this.printInChatbox(this.user, message, "self");
    };

    Chat.prototype.updateUserList = function (userList, host, me) {
        let $userList = $(".users");
        $userList.html("");
        for (let socketID in userList) {
            if (userList.hasOwnProperty(socketID)) {
                let username = userList[socketID];
                let isMe = socketID === me ? "(me)" : "";
                let isHost = socketID === host ? "<i class='fas fa-key'></i>" : "";
                let HTML = `<div class="user" id="${socketID}">
                   <p class="name">${username} ${isMe}</p><span class="privileges">${isHost} <span class="status"></span> </span>
                   <p class="score">0</p>
                </div>`;
                $userList.append(HTML);
            }
        }
    };

    Chat.prototype.printInChatbox = function (sender, message, type) {
        var chatbox = $(`#${this.chatbox}`);
        chatbox.append(`<li><span class="${type}">${sender}:</span> ${message}</li>`)
        chatbox[0].scrollTop = chatbox[0].scrollHeight;
    };


    function message2obj(user, msg) {
        return {user: user, message: msg};
    }


    function Settings(socket) {
        this.socket = socket;
        this.roundTime = 120;
        this.rounds = 6;
        this.suddenDeath = false;
        this.init();
    }

    Settings.prototype.init = function () {
        let content = `<form id="settingsForm" class="settingsForm">
                                <label for="roundTime">Time / round (secs):</label>
                                <input class="form-control" min="30" max="3600" value="120" type="number" id="roundTime"
                                       name="roundTime"/>
                                <label for="rounds">Amount of rounds:</label>
                                <input class="form-control" min="1" max="99" value="6" type="number" id="rounds"
                                       name="rounds"/>
                                <label for="suddenDeath">Sudden death:</label>
                                <input type="checkbox" id="suddenDeath" name="suddenDeath"/>

                                <button type="submit" class="btn btn-primary" style="display:block">Save</button>
                            </form>`;
        $(".settings").popover({
            placement: 'bottom',
            content: content,
            html: true
        });
        let self = this;
        $("body").on("submit", ".settingsForm", function (e) {
            e.preventDefault();
            let c = $(this).serializeArray().reduce(function (accumulator, currentValue) {
                accumulator.push(parseInt(currentValue.value));
                return accumulator;
            }, []);
            self.roundTime = c[0];
            self.rounds = c[1];
            self.suddenDeath = c.length > 2;
        });
    };

    function Controller(name) {
        this.socket = new Socket();
        this.chat = new Chat("chatbox", name, this.socket);
        this.sketch = new SketchPanel("sketch", this.socket);
        this.pallet = new Pallet(this.sketch);
        this.settings = new Settings();
        this.initChatListeners();
        this.initTimerListeners();
        this.initGameListeners();
    }

    Controller.prototype.initChatListeners = function () {
        this.socket.setListener(SOCKET_EVENTS.NEW, () => {
            this.socket.emit(SOCKET_EVENTS.NEW, {user: this.chat.user, id: this.socket.getID()});
        });
        this.socket.setListener(SOCKET_EVENTS.CHAT_MESSAGE, (data) => {
            this.chat.printInChatbox(data.sender, data.message, data.type);
        });

        this.socket.setListener(SOCKET_EVENTS.USER_LIST, (data) => {
            this.chat.updateUserList(data.message, data.host, this.socket.getID());
        });

        this.socket.setListener(SOCKET_EVENTS.UPDATE_STATUS, (data) => {
            data.forEach(e => {
                let $player = $(`#${e.id}`);
                $player.find(".status").html(e.isDrawing ?
                    "<i class=\"fas fa-paint-brush\"></i>" : "<i class=\"fas fa-eye\"></i>");
                $player.find(".score").text(e.score);
            });
        });
    };

    Controller.prototype.initTimerListeners = function () {
        this.socket.setListener(SOCKET_EVENTS.TIME, (time) => {
            $(".timer").text(time);
        });
    };

    Controller.prototype.startGame = function () {
        this.socket.emit("startServer", this.settings);
    };

    Controller.prototype.initGameListeners = function () {
        let $championSplash = $(".champSplash");

        this.socket.setListener(SOCKET_EVENTS.IDLE, () => {
            $(".champion").text("");
            $(".timer").text("WAITING FOR OTHERS...");
            $championSplash.addClass("hidden");
            this.sketch.disableControls();
            $(".pallet").addClass("hidden");
            $championSplash.popover("hide");
            $(".settings").removeClass("hidden");
            $(".start").removeClass("hidden");
        });

        this.socket.setListener(SOCKET_EVENTS.GAME_STARTED, () => {
            $(".settings").addClass("hidden");
            $(".start").addClass("hidden");
        });

        this.socket.setListener(SOCKET_EVENTS.WAIT, (player) => {
            $(".champion").text(`${player} is currently drawing...`);
            $championSplash.addClass("hidden");
            this.sketch.disableControls();
            $(".pallet").addClass("hidden");
            $championSplash.popover("hide");
            this.sketch.clear();
        });

        this.socket.setListener(SOCKET_EVENTS.PLAY, (data) => {
            $(".champion").text(`You are drawing: ${data.word}`);
            $championSplash.removeClass("hidden");
            let img = `<img src="${data.image}" alt="${data.word}" title="${data.word}" style="width:100%;"/>`;
            $championSplash.popover('dispose').popover({
                placement: 'bottom',
                content: img,
                html: true
            });
            this.sketch.enableControls();
            $(".pallet").removeClass("hidden");
            this.sketch.clear();
        });

        this.socket.setListener(SOCKET_EVENTS.NEXT_PLAYER, data => {
            $(".timer").text("SWITCHING PLAYER...");
        });
    };


    return {
        SketchPanel: SketchPanel,
        Controller: Controller,
        Pallet: Pallet,
        Chat: Chat,
        Socket: Socket,
    }
})();

