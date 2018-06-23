const SENDERS = {
    SERVER:"Server"
};

const MESSAGE_TYPES = {
    SERVER:"server",
    OTHER:"other"
};

function userConnectMessage(user, amount, disconnect) {
    let status = disconnect ? "disconnected" : "connected";
    return `${user} ${status}, current users: ${amount}`;
}


function PARAMETER_MESSAGES(x1, x2, x3) {
    return {
        GAME_FOUND_ANSWER:serverMessage(`${x1} found the answer!`),
        GAME_LETTERS_OFF:serverMessage(`You are ${x1} ${x1 > 1 ? "letters" : "letter"} off`),
        USER_DISCONNECT_MESSAGE:serverMessage(userConnectMessage(x1, x2, x3)),
        GAME_CORRECT_ANSWER:serverMessage(`The correct answer was: ${x1}!`),
        GAME_ROUND:serverMessage(`Round ${x1}`),
        GAME_IS_DRAWING:serverMessage(`${x1} is now drawing!`),
    }
}


function userMessage(message, sender) {
    return {
        sender: sender,
        message: message,
        type: MESSAGE_TYPES.OTHER
    };
}

function serverMessage(message) {
    return {
        sender: SENDERS.SERVER,
        message: message,
        type: MESSAGE_TYPES.SERVER
    };
}


const MESSAGES = {
    GAME_ALREADY_STARTED:"The game already started!",
    GAME_NOT_HOST:"You're not the host of this room!",
    GAME_HOST_CAN_START:"The host has the ability to start the game!",
    GAME_TWO_PLAYERS_TO_START:"You need at least 2 players to start!",
};

const SERVER_MESSAGES = {
    GAME_STOPPED:serverMessage("The game has been stopped!"),
    GAME_ALREADY_STARTED:serverMessage(MESSAGES.GAME_ALREADY_STARTED),
    GAME_NOT_HOST:serverMessage(MESSAGES.GAME_NOT_HOST),
    GAME_HOST_CAN_START:serverMessage(MESSAGES.GAME_HOST_CAN_START),
    GAME_TWO_PLAYERS_TO_START:serverMessage(MESSAGES.GAME_TWO_PLAYERS_TO_START),
    GAME_ROUND_LIMIT_REACHED:serverMessage("The round limit has been reached!"),
};


module.exports = {
    serverMessage:serverMessage,
    SERVER_MESSAGES:SERVER_MESSAGES,
    MESSAGES:MESSAGES,
    PARAMETER_MESSAGES:PARAMETER_MESSAGES,
    userMessage:userMessage,
};