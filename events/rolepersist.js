const { GuildMember, PermissionsBitField } = require("discord.js"); // eslint-disable-line no-unused-vars
const xp = require("../utils/xp.js");

/** @type {import("../types").ClientExt} */
let client;

/**
 * @param {import("../types").ClientExt} c
 */
exports.register = c => {
    client = c;
    c.on("guildMemberAdd", guildMemberAdd);
};

/**
 * @param {import("../types").ClientExt} c
 */
exports.deregister = c => {
    c.removeListener("guildMemberAdd", guildMemberAdd);
};

/**
 * @param {GuildMember} member 
 */
async function guildMemberAdd(member) {
    const guildSettings = client.guildSettings.get(member.guild.id);

    if (guildSettings.jailedUsers.includes(member.id) && member.guild.roles.cache.has(guildSettings.jailRole)) {
        member.roles.add(guildSettings.jailRole, "Jail persist").catch(() => { });
    }

    if (guildSettings.levels.filter(l => l.id === member.id).length !== 0) {
        if (member.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            const level = xp.levelFromXP(guildSettings.levels.filter(l => l.id === member.id)[0].xp);

            guildSettings.levelRoles.filter(l => l.level <= level && member.guild.roles.cache.has(l.id)).forEach(l => {
                const role = member.guild.roles.cache.get(l.id);

                if (!member.roles.cache.has(l.id) && member.guild.members.me.roles.highest.position >= role.position) {
                    member.roles.add(role, "Reward persist");
                }
            });
        }
    }
}