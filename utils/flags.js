exports.logs = {
    JOIN: 1 << 0,
    LEAVE: 1 << 1,
    KICK: 1 << 2,
    BAN: 1 << 3,
    DELETE: 1 << 4,
    EDIT: 1 << 5,
    USER: 1 << 6,
    ROLE: 1 << 7,
    EMOJI: 1 << 8,
    CHANNEL: 1 << 9,
    SERVER: 1 << 10,
    TOTAL: 11
};

exports.logsStrings = (flag) => {
    switch (flag) {
        case this.logs.JOIN:
            return "join - when a user joins";
        case this.logs.LEAVE:
            return "leave - when a user leaves";
        case this.logs.KICK:
            return "kick - when a user is kicked";
        case this.logs.BAN:
            return "ban - when a user is banned/unbanned";
        case this.logs.DELETE:
            return "delete - when a message is deleted";
        case this.logs.EDIT:
            return "edit - when a message is edited";
        case this.logs.USER:
            return "user - when a user is updated (nickname changed/roles updated)";
        case this.logs.ROLE:
            return "role - when a role is created/deleted/modified";
        case this.logs.EMOJI:
            return "emoji - when an emoji is created/deleted/modified";
        case this.logs.CHANNEL:
            return "channel - when a channel is created/deleted/modified";
        case this.logs.SERVER:
            return "server - when the server is updated (name changed/voice region changed)";
        default:
            return "unknown - this is a bug!";
    }
};