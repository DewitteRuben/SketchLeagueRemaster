const Controller = (function () {
    function Controller(name) {
        this.socket = new Domain.Socket();
        this.chat = new Domain.Chat("chatbox", name, this.socket);
        this.sketch = new Domain.SketchPanel("sketch", this.socket);
        this.pallet = new Domain.Pallet(this.sketch);
        this.initChatListeners();
        this.initTimerListeners();
        this.initGameListeners();
    }

    Controller.prototype.initChatListeners = function () {
        this.socket.setListener("new", () => {
            this.socket.emit("new", {user: this.chat.user, id: this.socket.getID()});
        });
        this.socket.setListener("chat-message", (data) => {
            this.chat.printInChatbox(data.sender, data.message, data.type);
        });

        this.socket.setListener("userList", (data) => {
            this.chat.updateUserList(data.message, data.host, this.socket.getID());
        });

        this.socket.setListener("updateStatus", (data) => {
            data.forEach(e => {
                let $player = $(`#${e.id}`);
                $player.find(".status").html(e.isDrawing ?
                    "<i class=\"fas fa-paint-brush\"></i>" : "<i class=\"fas fa-eye\"></i>");
                $player.find(".score").text(e.score);
            });
        });
    };

    Controller.prototype.initTimerListeners = function () {
        this.socket.setListener("time", (time) => {
            $(".timer").text(time);
        });
    };

    function setStatusEveryOtherUser(status) {
        $(".users").each(function (index, el) {
            $(el).find(".status").html(status);
        });
    }

    Controller.prototype.initGameListeners = function () {
        this.socket.setListener("wait", (player) => {
            $(".champion").text(`${player} is currently drawing...`);
            this.sketch.disableControls();
            $(".pallet").addClass("hidden");
        });

        this.socket.setListener("play", (word) => {
            $(".champion").text(`You are drawing: ${word}`);
            this.sketch.enableControls();
            $(".pallet").removeClass("hidden");
        });

        this.socket.setListener("nextPlayer", data => {
            $(".timer").text("SWITCHING PLAYER...");
        });
    };

    return Controller;

})();

(function () {

    let username = sessionStorage.getItem("name");

    if (!username)
        window.location = "login.html";

    let game = new Controller(username);

    document.getElementById("formSendMessage").addEventListener("submit", function (e) {
        e.preventDefault();

        if (this[0].value.trim().length > 0) {
            game.chat.send(this[0].value);
        }

        this[0].value = "";
    });


    $(".start").on("click", function () {
        game.socket.emit("startServer");
    });

})();
