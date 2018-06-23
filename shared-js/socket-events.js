const SOCKET_EVENTS = {
    NEW:"new",
    USER_LIST:"userList",
    CHAT_MESSAGE:"chat-message",
    UPDATE_STATUS:"updateStatus",
    DRAW:"draw",
    TIME:"time",
    WAIT:"wait",
    PLAY:"play",
    NEXT_PLAYER:"nextPlayer",
    UNDO:"undo"
};

if (typeof window !== 'object')
    module.exports = SOCKET_EVENTS;