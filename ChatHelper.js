let compareBase = require("./util");

function ChatHelper(word, guess) {
    this.word = word;
    this.guess = guess.trim();
}

ChatHelper.prototype.getLongest = function () {
    return this.word.length > this.guess.length ? this.word : this.guess;
};

// ignores case and accent
ChatHelper.prototype.isEqual = function () {
    return this.word.localeCompare(this.guess, undefined, {sensitivity: 'base'}) === 0;
};

ChatHelper.prototype.getLettersOff = function () {
    let max = this.getLongest().length;
    let amount = 0;
    for (let i = 0; i < max; i++) {
        let guess = this.guess[i] === undefined ? "" : this.guess[i];
        let word = this.word[i] === undefined ? "" : this.word[i];
        if (!compareBase(guess, word)) {
            amount++;
        }
    }
    return amount;
};

module.exports = ChatHelper;