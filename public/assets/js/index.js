(function () {

    let username = sessionStorage.getItem("name");
    if (!username) {
        window.location = "login";
    } else {
        let game = new Domain.Controller(username);
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
    }
})();