function compareBase (word1, word2) {
    return word1.localeCompare(word2, undefined, {sensitivity: 'base'}) === 0;
}

module.exports = compareBase;