const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

/** @type {Client} */
let client;

/**
 * @param {Client} c
 */
exports.register = c => {
    client = c;
    c.on("message", message);
};

/**
 * @param {Client} c
 */
exports.deregister = c => {
    c.removeListener("message", message);
};

/**
 * @param {Message} msg 
 */
async function message(msg) {
    if (msg.channel.type === "dm") return;
    if (msg.content.length === 0) return;
    if (!msg.deletable) return;

    const badWords = client.badWords.get(msg.guild.id);

    if (badWords.length === 0) return;

    badWords.forEach(word => {
        if (msg.content.match(word)) msg.delete({ reason: "Word filter" });
    });
}