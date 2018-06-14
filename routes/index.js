var express = require('express');
var router = express.Router();
let UserStorage = require("../UserStorage");
let newStore = new UserStorage();

const MESSAGES = {
    USER_CORRECT: "You correctly guessed the answer: ",
    BROADCAST_CORRECT:" correctly guessed the answer: ",
};

var currentWordToGuess = "Ekko";



router.post("/join", function (req, res, next) {
    newStore.add(req.body.username);
    console.log(newStore.users);
    res.redirect("/login.html");
});

module.exports = function (io) {
    io.on('connection', function (socket) {

        io.sockets.emit("waiting", newStore.users.length);

        // console.log(io.sockets.connected);
        socket.on("game", function(data) {
            // console.log(socket);
            socket.emit("game", "ok");
        });

        // socket.on("draw", function (data) {
        //     socket.broadcast.emit("draw", data);
        // });
        // socket.on("undo", function (data) {
        //     socket.broadcast.emit("undo", data);
        // });

        // socket.on("client-msg", function (data, cb) {
        //     cb(data);
        //     socket.broadcast.emit("client-msg", data);
        //     if (data.msg === currentWordToGuess) {
        //         socket.emit("correctGuess", {user:"Server", msg:MESSAGES.USER_CORRECT + currentWordToGuess});
        //         socket.broadcast.emit("client-msg",
        //             {user:"Server", msg:data.user + MESSAGES.BROADCAST_CORRECT + currentWordToGuess})
        //     }
        // });

    });
    return router;
};
