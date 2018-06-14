function UserStorage() {
    this.users = [];

}

UserStorage.prototype.add = function (user) {
    if (!this.users.includes(user)) {
        this.users.push(user);
    } else {
        throw "User already exists!";
    }
};

module.exports = UserStorage;
