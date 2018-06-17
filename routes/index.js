var express = require('express');
var router = express.Router();
let ServerSocket = require("../ServerSocket");
let Game = require("../game");

module.exports = function (io) {
    let game = new Game();
    let serverSocket = new ServerSocket(io, game);

    router.get("/*", function(req, res, next) {
        res.render("login");
    });

    router.get("/login", function (req, res, next) {
        res.render("login");
    });

    router.post("/join", function (req, res, next) {
        let exists = serverSocket.userstorage.exists(req.body.username);
        if (!exists) {
            res.redirect("/index.html");
        } else {
            res.render("login", {error: `Username ${req.body.username} already exists!`});
        }
    });


    return router;
};
