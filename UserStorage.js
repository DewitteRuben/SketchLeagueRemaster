let compareBase = require("./util");

function UserStorage() {
    this.users = {};
    this.amount = 0;
}

UserStorage.prototype.add = function (socketID, user) {
    if (!(this.users[socketID]) && !Object.values(this.users).includes(user)) {
        this.users[socketID] = user;
        this.amount++;
    } else {
        console.error("Connection has already been saved!");
    }
};

UserStorage.prototype.getHost = function () {
    return Object.keys(this.users)[0];
};


UserStorage.prototype.drop = function (socketID) {

    if (socketID in this.users) {
        delete this.users[socketID];
        this.amount--;
    } else {
        console.error("Connection does not exist!");
    }
};

UserStorage.prototype.exists = function (username) {
    for (let key in this.users) {
        if (compareBase(this.users[key], username)) {
            return true;
        }
    }
    return false;
};

module.exports = UserStorage;
