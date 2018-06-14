const Controller = (function () {
    function Controller(name) {
        this.socket = new Domain.Socket();
        this.chat = new Domain.Chat("chatbox", name, this.socket);
        this.initChatListeners();

    }

    Controller.prototype.initChatListeners = function () {
        this.socket.setListener("new", () => {
            this.socket.emit("new", {user: this.chat.user, id: this.socket.getID()});
        });
        this.socket.setListener("chat-message", (data) => {
            this.chat.printInChatbox(data.sender, data.message);
        });

        this.socket.setListener("userList", (data) => {
            this.chat.updateUserList(data.message);
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
            console.log(game.chat);
            game.chat.send(this[0].value);
        }

        this[0].value = "";
    });


    $(".start").on("click", function () {
        game.socket.emit("start");
    });

})();
