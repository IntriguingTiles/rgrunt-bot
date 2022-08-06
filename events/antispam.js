const { Message, PermissionsBitField, ChannelType } = require("discord.js"); // eslint-disable-line no-unused-vars

/** @type {import("../types").ClientExt} */
let client;

/**
 * @param {import("../types").ClientExt} c
 */
exports.register = c => {
    client = c;
    c.on("messageCreate", messageCreate);
};

/**
 * @param {import("../types").ClientExt} c
 */
exports.deregister = c => {
    c.removeListener("messageCreate", messageCreate);
};

/**
 * @param {Message} msg 
 */
async function messageCreate(msg) {
    if (msg.partial) return;
    if (msg.channel.type === ChannelType.DM) return;
    if (msg.author.bot) return;
    if (!msg.member.manageable) return;
    if (msg.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return;
    if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) return;
    if (msg.mentions.members.filter(member => !member.user.bot).size < 5) return;
    if (!client.guildSettings.get(msg.guild.id).antiSpam) return;
    if (!client.guildSettings.get(msg.guild.id).jailRole) return;
    if (!msg.guild.roles.cache.has(client.guildSettings.get(msg.guild.id).jailRole)) return;

    msg.member.roles.add(client.guildSettings.get(msg.guild.id).jailRole);

    if (msg.channel.permissionsFor(client.user).has(PermissionsBitField.Flags.SendMessages)) msg.channel.send("Jailed.");
}