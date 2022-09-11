const { Message, PermissionsBitField, ChannelType } = require("discord.js"); // eslint-disable-line no-unused-vars
const xp = require("../utils/xp.js");

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

const cooldowns = new Set();

/**
 * @param {Message} msg
 */
async function messageCreate(msg) {
    if (msg.channel.type === ChannelType.DM) return;
    if (msg.author.bot) return;
    if (msg.system) return;
    if (msg.content.length === 0) return;
    if (msg.channel.topic && msg.channel.topic.includes("[NO-XP]")) return;
    if (cooldowns.has(msg.author.id)) return;

    const guildSettings = client.guildSettings.get(msg.guild.id);

    if (!guildSettings.levelSystem) return;
    if (guildSettings.verifyRole && !msg.member.roles.cache.has(guildSettings.verifyRole)) return;
    if (guildSettings.jailRole && msg.member.roles.cache.has(guildSettings.jailRole)) return;
    if (guildSettings.levels.filter(l => l.id === msg.author.id).length === 0) guildSettings.levels.push({ id: msg.author.id, xp: 0 });

    const level = guildSettings.levels.find(l => l.id === msg.author.id);
    const prevLevel = xp.levelFromXP(level.xp);
    level.xp += (Math.random() * 10) + 15;
    const newLevel = xp.levelFromXP(level.xp);

    if (newLevel > prevLevel) {
        if (msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            guildSettings.levelRoles.filter(l => l.level <= newLevel && msg.guild.roles.cache.has(l.id)).forEach(l => {
                const role = msg.guild.roles.cache.get(l.id);

                if (!msg.member.roles.cache.has(l.id) && msg.guild.members.me.roles.highest.position >= role.position) {
                    msg.member.roles.add(role, "Role rewards");
                }
            });
        }
    }

    cooldowns.add(msg.author.id);

    setTimeout(() => {
        cooldowns.delete(msg.author.id);
    }, 60000);

    client.guildSettings.set(msg.guild.id, guildSettings);
}