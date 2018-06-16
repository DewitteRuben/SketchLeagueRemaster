function ChatHelper(word, guess) {
    this.word = word;
    this.guess = guess;
}

ChatHelper.prototype.getLongest = function() {
    return this.word.length > this.guess.length ? this.word: this.guess;
};

// ignores case and accent
ChatHelper.prototype.isEqual = function() {
    return this.word.localeCompare(this.guess, {sensitivity: 'base'}) === 0;
};

ChatHelper.prototype.getLettersOff = function() {
    let max = this.getLongest().length;
    let amount = 0;
    for (let i = 0; i < max; i++) {
        if (this.isEqual(this.guess[i], this.word[i])) {
            amount++;
        }
    }
    return amount;
};

module.exports = ChatHelper;