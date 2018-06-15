let champions = require('./champion.json');
let Timer = require('easytimer');


function getChampionNames() {
    return Object.keys(champions.data);
}

function getRandomChampionName() {
    let names = getChampionNames();
    return names[getRandomIntIncl(0, names.length)]
}


// range: [min, max[
function getRandomIntIncl(min, max) {
    return Math.random() * (max - min) + min;
}

Game.prototype.selectNextPlayer = function () {
    let players = this.players.keys();
    let randomIndex = getRandomIntIncl(0, players.length);
    let nextPlayer = players[randomIndex];
    while (this.played.includes(nextPlayer)) {
        randomIndex = getRandomIntIncl(0, players.length);
        nextPlayer = players[randomIndex];
    }
    this.currentPlayer = nextPlayer;
};

function Game(players) {
    this.roundTime = 120;
    this.players = players;
    this.played = [];
    this.currentPlayer = null;
    this.timer = new Timer();
    this.round = 0;
    this.word = null;
}

Game.prototype.initTimer = function () {
    this.timer.start({countdown: true, startValues: {seconds: this.roundTime}});
    timer.addEventListener('secondsUpdated', function (e) {
    });
    timer.addEventListener('targetAchieved', function (e) {
    });
};

Game.prototype.start = function () {
    this.word = getRandomChampionName();

};

Game.prototype.getRandomWord = function () {

};

module.exports = Game;