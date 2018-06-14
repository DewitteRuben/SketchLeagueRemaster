// const Game = (function() {
//     function Game(sketch, chat, socket) {
//         this.sketch = sketch;
//         this.chat = chat;
//         this.socket = socket;
//     }
//
//     Game.prototype.waitForPlayers = function() {
//
//     };

// /*        this.socket = io();
//         this.socket.on("client-msg", data => {
//             this.printInChatbox(data);
//         });
//         this.socket.on("correctGuess", data => {
//             this.printInChatbox(data);
//         });*/
//
//
//
//     return Game;
//
// })();

(function() {

    var socket = new Domain.Socket();
    socket.setListener("game", function(data) {
        console.log(data);
    });


    socket.socket.emit("game", "test");
})();
