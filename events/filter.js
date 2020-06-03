const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

/** @type {Client} */
let client;

/**
 * @param {Client} c
 */
exports.register = c => {
    client = c;
    c.on("message", message);
    c.on("messageUpdate", messageUpdate);
};

/**
 * @param {Client} c
 */
exports.deregister = c => {
    c.removeListener("message", message);
    c.removeListener("messageUpdate", messageUpdate);
};

/**
 * @param {Message} msg 
 */
async function message(msg) {
    if (msg.channel.type === "dm") return;
    if (msg.author.bot) return;
    if (msg.content.length === 0) return;
    if (!msg.deletable) return;
    if (msg.member.hasPermission("MANAGE_GUILD")) return;

    const badWords = client.badWords.get(msg.guild.id);

    if (badWords.length === 0) return;

    badWords.forEach(word => {
        if (msg.content.match(word)) {
            msg.delete();
            msg.badWords = true;
        }
    });
}

/**
 * @param {Message} oldMsg 
 * @param {Message} newMsg 
 */
async function messageUpdate(oldMsg, newMsg) {
    if (newMsg.channel.type === "dm") return;
    if (newMsg.author.bot) return;
    if (newMsg.content.length === 0) return;
    if (!newMsg.deletable) return;
    if (newMsg.member.hasPermission("MANAGE_GUILD")) return;

    const badWords = client.badWords.get(newMsg.guild.id);

    if (badWords.length === 0) return;

    badWords.forEach(word => {
        if (newMsg.content.match(word)) {
            newMsg.delete();
            newMsg.badWords = true;
        }
    });
}