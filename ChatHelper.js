let compareBase = require("./util");

function ChatHelper(word, guess) {
    this.word = word;
    this.guess = guess;
}

ChatHelper.prototype.getShortest = function () {
    return this.word.length < this.guess.length ? this.word : this.guess;
};

// ignores case and accent
ChatHelper.prototype.isEqual = function () {
    return this.word.localeCompare(this.guess, undefined, {sensitivity: 'base'}) === 0;
};

ChatHelper.prototype.getLettersOff = function () {
    let max = this.getShortest().length;
    let amount = 0;
    for (let i = 0; i < max; i++) {
        if (compareBase(this.guess[i], this.word[i])) {
            amount++;
        }
    }
    return this.word.length - amount;
};

module.exports = ChatHelper;