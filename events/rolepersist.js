const { Client, GuildMember } = require("discord.js"); // eslint-disable-line no-unused-vars

/** @type {Client} */
let client;

/**
 * @param {Client} c
 */
exports.register = c => {
    client = c;
    c.on("guildMemberAdd", guildMemberAdd);
};

/**
 * @param {Client} c
 */
exports.deregister = c => {
    c.removeListener("guildMemberAdd", guildMemberAdd);
};

/**
 * @param {GuildMember} member 
 */
async function guildMemberAdd(member) {
    /** @type {import("../types").Settings} */
    const guildSettings = client.guildSettings.get(member.guild.id);

    if (guildSettings.jailedUsers.includes(member.id) && member.guild.roles.cache.has(guildSettings.jailRole)) {
        member.roles.add(guildSettings.jailRole, "Jail persist").catch(() => { });
    }
}