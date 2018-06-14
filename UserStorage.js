function UserStorage() {
    this.users = {};
    this.amount = 0;
}

UserStorage.prototype.add = function (socketID, user) {
    if (!(this.users[socketID])) {
        this.users[socketID] = user;
        this.amount++;
    } else {
        console.error("Connection has already been saved!");
    }
};


UserStorage.prototype.drop = function(socketID) {
    if (socketID in this.users) {
        delete this.users[socketID];
        this.amount--;
    } else {
        console.error("Connection does not exist!");
    }
};

UserStorage.prototype.exists = function(username) {
    for (let key in this.users) {
        if (this.users[key].includes(username)) {
            return true;
        }
    }
    return false;
};

module.exports = UserStorage;
