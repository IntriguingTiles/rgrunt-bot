const { Client, Role, MessageEmbed } = require("discord.js"); // eslint-disable-line no-unused-vars

const flags = require("../utils/flags.js");
const colors = require("../utils/colors.js");
const sleep = require("util").promisify(setTimeout);

/** @type {Client} */
let client;

/**
 * @param {Client} c
 */
exports.register = c => {
    client = c;
    c.on("roleCreate", roleCreate);
    c.on("roleUpdate", roleUpdate);
    c.on("roleDelete", roleDelete);
};

/**
 * @param {Client} c
 */
exports.deregister = c => {
    c.removeListener("roleCreate", roleCreate);
    c.removeListener("roleUpdate", roleUpdate);
    c.removeListener("roleDelete", roleDelete);
};

/**
 * @param {Role} role 
 */
async function roleCreate(role) {
    const guildSettings = client.guildSettings.get(role.guild.id);

    if (guildSettings.logFlags & flags.logs.ROLE && guildSettings.logChannel && role.guild.channels.cache.has(guildSettings.logChannel)) {
        const embed = new MessageEmbed();

        embed.setAuthor("Role Created", role.guild.iconURL());
        embed.setColor(colors.GREEN);
        embed.addField("Name", role.name, true);
        embed.addField("Permissions", `\`${role.permissions.bitfield}\``, true);
        embed.setFooter(`ID: ${role.id}`);
        embed.setTimestamp();

        if (role.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            await sleep(500);
            const logs = await role.guild.fetchAuditLogs({ type: "ROLE_CREATE", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === role.id) {
                const log = logs.entries.first();

                if (Date.now() - log.createdTimestamp < 800) {
                    embed.addField("Created by", `${log.executor} ${log.executor.tag}`);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addField("Reason", log.reason, true);
                }
            }
        }

        role.guild.channels.cache.get(guildSettings.logChannel).send(embed);
    }
}

/**
 * @param {Role} oldRole 
 * @param {Role} newRole 
 */
async function roleUpdate(oldRole, newRole) {
    const guildSettings = client.guildSettings.get(newRole.guild.id);

    if (guildSettings.logFlags & flags.logs.ROLE && guildSettings.logChannel && newRole.guild.channels.cache.has(guildSettings.logChannel)) {
        const embed = new MessageEmbed();
        let shouldPost = false;

        embed.setAuthor("Role Updated", newRole.guild.iconURL());
        embed.setColor(colors.BLUE);

        if (oldRole.name !== newRole.name) {
            embed.addField("Name", `\`${oldRole.name}\` → \`${newRole.name}\``, true);
            shouldPost = true;
        } else {
            embed.addField("Name", newRole.name, true);
        }

        if (oldRole.color !== newRole.color) {
            embed.addField("Color", `\`${oldRole.hexColor}\` → \`${newRole.hexColor}\``, true);
            embed.setColor(newRole.color);
            shouldPost = true;
        }

        if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
            embed.addField("Permissions", `\`${oldRole.permissions.bitfield}\` → \`${newRole.permissions.bitfield}\``, true);
            shouldPost = true;
        }

        if (oldRole.hoist !== newRole.hoist) {
            embed.addField("Hoisted", `\`${oldRole.hoist}\` → \`${newRole.hoist}\``, true);
            shouldPost = true;
        }

        if (oldRole.mentionable !== newRole.mentionable) {
            embed.addField("Mentionable", `\`${oldRole.mentionable}\` → \`${newRole.mentionable}\``, true);
            shouldPost = true;
        }

        embed.setFooter(`ID: ${newRole.id}`);
        embed.setTimestamp();

        if (newRole.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            await sleep(500);
            const logs = await newRole.guild.fetchAuditLogs({ type: "ROLE_UPDATE", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === newRole.id) {
                const log = logs.entries.first();
                if (Date.now() - log.createdTimestamp < 800) {
                    embed.addField("Changed by", `${log.executor} ${log.executor.tag}`);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addField("Reason", log.reason, true);
                }
            }
        }

        if (shouldPost) newRole.guild.channels.cache.get(guildSettings.logChannel).send(embed);
    }
}

/**
 * @param {Role} role 
 */
async function roleDelete(role) {
    const guildSettings = client.guildSettings.get(role.guild.id);

    if (guildSettings.logFlags & flags.logs.ROLE && guildSettings.logChannel && role.guild.channels.cache.has(guildSettings.logChannel)) {
        const embed = new MessageEmbed();

        embed.setAuthor("Role Deleted", role.guild.iconURL());
        embed.setColor(colors.RED);
        embed.addField("Name", role.name, true);
        embed.setFooter(`ID: ${role.id}`);
        embed.setTimestamp();

        if (role.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            await sleep(500);
            const logs = await role.guild.fetchAuditLogs({ type: "ROLE_DELETE", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === role.id) {
                const log = logs.entries.first();

                if (Date.now() - log.createdTimestamp < 800) {
                    embed.addField("Deleted by", `${log.executor} ${log.executor.tag}`);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addField("Reason", log.reason, true);
                }
            }
        }

        role.guild.channels.cache.get(guildSettings.logChannel).send(embed);
    }
}