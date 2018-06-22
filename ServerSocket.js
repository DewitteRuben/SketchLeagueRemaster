let UserStorage = require("./UserStorage");
let ChatHelper = require("./ChatHelper");

function userConnectMessage(user, amount, disconnect) {
    let status = disconnect ? "disconnected" : "connected";
    return `${user} ${status}, current users: ${amount}`;
}


function ServerSocket(io, game) {
    this.userstorage = new UserStorage();
    this.io = io;
    this.game = game;
    this.game.io = io;
    let self = this;
    io.on('connection', function (socket) {
        io.sockets.emit("all", socket.id);


        socket.emit("new", "");

        socket.on("new", function (data) {

            self.userstorage.add(data.id, data.user);

            io.sockets.emit("userList", {
                message: self.userstorage.users,
                host: self.userstorage.getHost(),
            });

            io.sockets.emit("chat-message", {
                sender: "Server",
                message: userConnectMessage(data.user, self.userstorage.amount),
                type: "server"
            });

            if (self.userstorage.amount >= 2) {
                io.sockets.emit("chat-message", {
                    sender: "Server",
                    message: "The host has the ability to start the game!",
                    type: "server"
                });
            }
        });

        socket.on("disconnecting", function (reason) {


            console.log("disconnecting", socket.id, reason);
            // on disconnect get the disconnecting user from storage using it's socketID
            let user = self.userstorage.users[socket.id];

            // decrease the amount of users (since it's going to be -1 after we drop it's connection)
            let newAmount = self.userstorage.amount - 1;

            // send using a chat message to all the clients that the user will be disconnected
            io.sockets.emit("chat-message", {
                sender: "Server",
                message: userConnectMessage(user, newAmount, true),
                type: "server"
            });

            // drop the user from storage
            self.userstorage.drop(socket.id);

            // update the active user list
            io.sockets.emit("userList", {
                message: self.userstorage.users,
                host: self.userstorage.getHost(),
            });

        });

        socket.on("disconnect", function (reason) {
            // stop the current game if someone disconnects

            console.log("disconnected", socket.id, reason);

            if (self.game.started) {
                self.game.stop();
            }
        });

        socket.on("client", function (data, cb) {
            socket.broadcast.emit("chat-message", {sender: data.user, message: data.message, type: "other"});

            if (self.game.started) {
                let chathelper = new ChatHelper(self.game.word, data.message);
                if (chathelper.isEqual() && !self.game.isPlaying(socket.id) && !self.game.hasAlreadyAnswered(socket.id)) {
                    io.sockets.emit("chat-message", {
                        sender: "Server",
                        message: `${data.user} found the answer!`,
                        type: "server"
                    });
                    self.game.wasCorrectlyAnsweredBy(socket.id);
                } else if (!chathelper.isEqual() && !self.game.isPlaying(socket.id) && !self.game.hasAlreadyAnswered(socket.id)) {
                    let lettersOff = chathelper.getLettersOff();
                    if (lettersOff <= 2) {
                        socket.emit("chat-message", {
                            sender: "Server",
                            message: `You are ${lettersOff} ${lettersOff > 1 ? "letters" : "letter"} off`,
                            type: "server"
                        });
                    }
                }
            }
        });

        function isHost() {
            return socket.id === Object.keys(self.userstorage.users)[0];
        }

        socket.on("startServer", function () {

            if (self.userstorage.amount < 2) {
                socket.emit("chat-message", {
                    sender: "Server",
                    message: "You need at least 2 players to start!",
                    type: "server"
                });
                return;
            }

            // check if clicker is actually the host!
            if (isHost()) {
                self.game.start(self.userstorage.users);
            } else if (isHost() && self.game.started) {
                socket.emit("chat-message", {sender: "Server", message: "The game already started!", type: "server"});
            } else {
                socket.emit("chat-message", {
                    sender: "Server",
                    message: "You're not the host of this room!",
                    type: "server"
                })
            }
        });

        socket.on("draw", function (data) {
            socket.broadcast.emit("draw", data);
        });
        socket.on("undo", function (data) {
            socket.broadcast.emit("undo", data);
        });
    });
}


module.exports = ServerSocket;