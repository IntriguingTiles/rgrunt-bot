const { Client, GuildMember } = require("discord.js"); // eslint-disable-line no-unused-vars
const xp = require("../utils/xp.js");

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

    if (guildSettings.levels.filter(l => l.id === member.id).length !== 0) {
        if (member.guild.me.permissions.has("MANAGE_ROLES")) {
            const level = xp.levelFromXP(guildSettings.levels.filter(l => l.id === member.id)[0].xp);

            guildSettings.levelRoles.filter(l => l.level <= level && member.guild.roles.cache.has(l.id)).forEach(l => {
                const role = member.guild.roles.cache.get(l.id);

                if (!member.roles.cache.has(l.id) && member.guild.me.roles.highest.position >= role.position) {
                    member.roles.add(role, "Reward persist");
                }
            });
        }
    }
}