const { Client, Message, GuildMember } = require("discord.js"); // eslint-disable-line no-unused-vars

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
    if (msg.partial) return;
    if (msg.channel.type === "dm") return;
    if (msg.author.bot) return;
    if (!msg.member.manageable) return;
    if (msg.member.hasPermission("MANAGE_GUILD")) return;
    if (!msg.guild.me.hasPermission("MANAGE_ROLES")) return;
    if (msg.mentions.members.filter(member => !member.user.bot).size < 5) return;
    if (client.guildSettings.get(msg.guild.id).antiSpam)
    if (!client.guildSettings.get(msg.guild.id).jailRole) return;
    if (!msg.guild.roles.cache.has(client.guildSettings.get(msg.guild.id).jailRole)) return;

    msg.member.roles.add(client.guildSettings.get(msg.guild.id).jailRole);
    
    if (msg.channel.permissionsFor(client.user).has("SEND_MESSAGES")) msg.channel.send("Jailed.");
}