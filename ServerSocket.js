let UserStorage = require("./UserStorage");

function userConnectMessage(user, amount, disconnect) {
    let status = disconnect ? "disconnected" : "connected";
    return `${user} ${status}, current users: ${amount}`;
}


function ServerSocket(io) {
    this.userstorage = new UserStorage();
    this.io = io;
    let self = this;
    io.on('connection', function (socket) {
        socket.emit("new", "");

        socket.on("new", function (data) {
            self.userstorage.add(data.id, data.user);

            io.sockets.emit("userList", {message: self.userstorage.users});
            io.sockets.emit("chat-message", {
                sender: "Server",
                message: userConnectMessage(data.user, self.userstorage.amount)
            });

            if (self.userstorage.amount >= 2) {
                io.sockets.emit("chat-message", {
                    sender: "Server",
                    message: "The host has the ability to start the game!"
                });
            }
        });

        socket.on("disconnect", function (data) {
            // on disconnect get the disconnecting user from storage using it's socketID
            let user = self.userstorage.users[socket.id];

            // decrease the amount of users (since it's going to be -1 after we drop it's connection)
            let newAmount = self.userstorage.amount - 1;

            // send using a chat message to all the clients that the user will be disconnected
            io.sockets.emit("chat-message", {sender: "Server", message: userConnectMessage(user, newAmount, true)});

            // drop the user from storage
            self.userstorage.drop(socket.id);

            // update the active user list
            io.sockets.emit("userList", {message: self.userstorage.users});
        });

        socket.on("client", function (data, cb) {
            socket.broadcast.emit("chat-message", {sender: data.user, message: data.message});
        });

        socket.on("start", function () {

            if (self.userstorage.amount < 2) {
                socket.emit("chat-message", {sender: "Server", message: "You need at least 2 players to start!"})
            }

            // check if clicker is actually the host!
            if (socket.id === Object.keys(self.userstorage.users)[0]) {
                // game can now be started!
            } else {
                socket.emit("chat-message", {sender: "Server", message: "You're not the host of this game!"})
            }
        });
    });
}


module.exports = ServerSocket;