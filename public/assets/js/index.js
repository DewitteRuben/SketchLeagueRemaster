(function () {

    let username = sessionStorage.getItem("name");
    if (!username) {
        window.location = "login";
    } else {
        let controller = new Domain.Controller(username);
        document.getElementById("formSendMessage").addEventListener("submit", function (e) {
            e.preventDefault();

            if (this[0].value.trim().length > 0) {
                controller.chat.send(this[0].value);
            }

            this[0].value = "";
        });

        $(".start").on("click", function () {
            controller.startGame();
        });
    }
})();