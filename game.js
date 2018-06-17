let championsData = require('./champion.json');
let Timer = require('easytimer.js');

function getChampions() {
    let champions = [];
    for (let key in championsData.data) {
        if (championsData.data.hasOwnProperty(key)) {
            champions.push(championsData.data[key]);
        }
    }
    return champions;
}

function getRandomChampion() {
    let champions = getChampions();
    return champions[getRandomIntIncl(champions.length)];
}

// range: [min, max[
function getRandomIntIncl(max) {
    return Math.floor(Math.random() * max);
}

function Score() {
    this.score = {};
}

Score.prototype.increase = function (playerid, amount, position) {
    this.score[playerid] += amount - (position * 100);
};

Game.prototype.getRandomPlayer = function () {
    let players = Object.keys(this.players);
    let randomIndex = getRandomIntIncl(players.length);
    return players[randomIndex];
};

Game.prototype.startNextRound = function () {
    this.round++;
    this.played = [];
    this.correctGuesses = [];
    this.io.sockets.emit("chat-message", {message: `Round ${this.round}`, sender: "Server", type: "server"});
    this.waitAndSwitchToNextPlayer();
    this.getNewWord();
};

Game.prototype.getNextPlayer = function () {
    let nextPlayer = this.players.getRandomPlayer().id;
    while (this.played.includes(nextPlayer)) {
        nextPlayer = this.players.getRandomPlayer().id;
    }
    return nextPlayer;
};


Game.prototype.isNextRound = function () {
    return this.players.getLength() === this.played.length;
};

Game.prototype.passControls = function (player) {
    let playerObj = this.players.findById(player);
    this.players.setAsArtist(player);
    this.io.sockets.emit("updateStatus", this.players.getList());
    this.io.sockets.emit("wait", playerObj.name);
    this.io.to(player).emit("play", {word: this.word, image: this.image});
    this.io.sockets.emit("chat-message", {
        message: `${playerObj.name} is now drawing!`,
        sender: "Server",
        type: "server"
    });
};

function PlayerRepo() {
    this.players = [];
}

PlayerRepo.prototype.setAsArtist = function (id) {
    this.players.forEach(p => p.isDrawing = false);
    this.findById(id).isDrawing = true;
};

PlayerRepo.prototype.getList = function () {
    return this.players;
};

PlayerRepo.prototype.getLength = function () {
    return this.players.length;
};

PlayerRepo.prototype.getRandomPlayer = function () {
    let randomIndex = getRandomIntIncl(this.players.length);
    return this.players[randomIndex];
};

PlayerRepo.prototype.add = function (player) {
    this.players.push(player);
};

PlayerRepo.prototype.findById = function (id) {
    return this.players.filter(p => p.id === id)[0];
};

function Player(id, name) {
    this.id = id;
    this.name = name;
    this.score = 0;
    this.isDrawing = false;
}

Player.prototype.addScore = function (score, position) {
    this.score += score - (100 * position);
};

Game.prototype.switchToNextPlayer = function () {
    if (!this.isNextRound()) {
        this.getNewWord();
        let nextPlayer = this.getNextPlayer();
        this.played.push(nextPlayer);
        this.passControls(nextPlayer);
        this.timer.reset();
    } else {
        this.startNextRound();
    }
};

function Game() {
    this.started = false;
    this.players = null;
    this.io = null;
    this.roundTime = 120;
    this.score = new Score();
    this.played = [];
    this.correctGuesses = [];
    this.timer = new Timer();
    this.round = 1;
    this.word = null;
}

Game.prototype.hasAlreadyAnswered = function (id) {
    return this.correctGuesses.includes(id);
};

Game.prototype.wasCorrectlyAnsweredBy = function (playerid) {
    this.players.findById(playerid).addScore(1000, this.correctGuesses.length);
    this.correctGuesses.push(playerid);
    if (this.haveAllGuessedCorrectly()) {
        this.startNextRound();
    }
};

Game.prototype.haveAllGuessedCorrectly = function () {
    return this.correctGuesses.length === this.players.getLength() - 1;
};

Game.prototype.isPlaying = function (id) {
    return this.players.findById(id).isDrawing;
};

Game.prototype.enableSuddenDeath = function () {

};

Game.prototype.initTimer = function () {
    this.timer.start({countdown: true, startValues: {seconds: this.roundTime}});

    this.timer.addEventListener('secondsUpdated', (e) => {
        this.io.sockets.emit("time", this.timer.getTimeValues().toString(['minutes', 'seconds']))
    });
    this.timer.addEventListener('targetAchieved', (e) => {
        this.waitAndSwitchToNextPlayer();
    });
};

Game.prototype.waitAndSwitchToNextPlayer = function () {
    this.timer.pause();
    this.io.sockets.emit("nextPlayer");
    this.io.sockets.emit("chat-message", {
        message: `The correct answer was: ${this.word}!`,
        sender: "Server",
        type: "server"
    });
    setTimeout(() => {
        this.switchToNextPlayer();
    }, 3500);
};

Game.prototype.getNewWord = function () {
    let champion = getRandomChampion();
    this.word = champion.name;
    this.image = `http://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champion.id}_0.jpg`;
};

Game.prototype.reset = function () {
    this.started = false;
    this.players = new PlayerRepo();
    this.played = [];
    this.round = 0;
    this.image = null;
    this.word = null;
};

Game.prototype.stop = function () {
    if (this.started) {
        this.reset();
        this.timer.stop();
        this.io.sockets.emit("chat-message", {message: "The game has been stopped!", sender: "Server", type: "server"});
    }
};

function users2players(users) {
    let players = new PlayerRepo();
    for (let socketID in users) {
        if (users.hasOwnProperty(socketID)) {
            players.add(new Player(socketID, users[socketID]));
        }
    }
    return players;
}

Game.prototype.start = function (users) {
    if (!this.started) {
        this.started = true;
        this.players = users2players(users);
        this.initTimer();
        this.switchToNextPlayer();
    }
};

module.exports = Game;