let UserStorage = require("./UserStorage");
let ChatHelper = require("./ChatHelper");
let constants = require("./messages");
let SOCKET_EVENTS = require("./shared-js/socket-events");

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

        socket.emit(SOCKET_EVENTS.NEW, "");

        socket.on(SOCKET_EVENTS.NEW, function (data) {

            self.userstorage.add(data.id, data.user);

            io.sockets.emit(SOCKET_EVENTS.USER_LIST, {
                message: self.userstorage.users,
                host: self.userstorage.getHost(),
            });

            io.sockets.emit(SOCKET_EVENTS.CHAT_MESSAGE,
                constants.PARAMETER_MESSAGES(data.user, self.userstorage.amount).USER_DISCONNECT_MESSAGE);

            if (self.userstorage.amount >= 2) {
                io.sockets.emit(SOCKET_EVENTS.CHAT_MESSAGE, constants.SERVER_MESSAGES.GAME_HOST_CAN_START);
            }
        });

        socket.on("disconnecting", function (reason) {


            console.log("disconnecting", socket.id, reason);
            // on disconnect get the disconnecting user from storage using it's socketID
            let user = self.userstorage.users[socket.id];

            // decrease the amount of users (since it's going to be -1 after we drop it's connection)
            let newAmount = self.userstorage.amount - 1;

            // send using a chat message to all the clients that the user will be disconnected
            io.sockets.emit(SOCKET_EVENTS.CHAT_MESSAGE,
                constants.PARAMETER_MESSAGES(user, newAmount, true).USER_DISCONNECT_MESSAGE);

            // drop the user from storage
            self.userstorage.drop(socket.id);

            // update the active user list
            io.sockets.emit(SOCKET_EVENTS.USER_LIST, {
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
            let send = true;

            if (self.game.started) {
                let chathelper = new ChatHelper(self.game.word, data.message);

                if (chathelper.isEqual() && self.game.isGuessing(socket.id)) {

                    io.sockets.emit(SOCKET_EVENTS.CHAT_MESSAGE, constants.PARAMETER_MESSAGES(data.user).GAME_FOUND_ANSWER);
                    self.game.wasCorrectlyAnsweredBy(socket.id);
                    send = false;
                } else if (!chathelper.isEqual() && self.game.isGuessing(socket.id)) {

                    let lettersOff = chathelper.getLettersOff();
                    if (lettersOff <= 2) {
                        socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, constants.PARAMETER_MESSAGES(lettersOff).GAME_LETTERS_OFF);
                    }

                }
            }

            if (send) {
                socket.broadcast.emit(SOCKET_EVENTS.CHAT_MESSAGE, constants.userMessage(data.message, data.user));
            }

        });

        function isHost() {
            return socket.id === Object.keys(self.userstorage.users)[0];
        }

        socket.on("startServer", function (settings) {
            if (self.userstorage.amount < 2) {
                socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, constants.SERVER_MESSAGES.GAME_TWO_PLAYERS_TO_START);
                return;
            }

            // check if clicker is actually the host!
            if (isHost()) {
                self.game.start(self.userstorage.users, settings);
            } else if (isHost() && self.game.started) {
                socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, constants.SERVER_MESSAGES.GAME_ALREADY_STARTED);
            } else {
                socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, constants.SERVER_MESSAGES.GAME_NOT_HOST);
            }
        });

        socket.on(SOCKET_EVENTS.DRAW, function (data) {
            socket.broadcast.emit(SOCKET_EVENTS.DRAW, data);
        });
        socket.on(SOCKET_EVENTS.UNDO, function (data) {
            socket.broadcast.emit(SOCKET_EVENTS.UNDO, data);
        });
    });
}


module.exports = ServerSocket;