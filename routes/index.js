var express = require('express');
var router = express.Router();
let ServerSocket = require("../ServerSocket");
let Game = require("../game");

const MESSAGES = {
    USER_CORRECT: "You correctly guessed the answer: ",
    BROADCAST_CORRECT: " correctly guessed the answer: ",
};

var currentWordToGuess = "Ekko";

module.exports = function (io) {
    let serverSocket = new ServerSocket(io);

    let game = new Game();
    game.getRandomWord();

    router.post("/join", function (req, res, next) {
        let exists = serverSocket.userstorage.exists(req.body.username);
        if (!exists) {
            res.redirect("/index.html");
        } else {
            res.redirect("/login.html");
        }
    });


    return router;
};
