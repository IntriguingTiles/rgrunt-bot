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

        embed.setAuthor({ name: "Role Created", iconURL: role.guild.iconURL({ dynamic: true }) });
        embed.setColor(colors.GREEN);
        embed.addField("Name", role.name, true);
        embed.addField("Permissions", `\`${role.permissions.bitfield}\``, true);
        embed.setFooter(`ID: ${role.id}`);
        embed.setTimestamp();

        const msg = await role.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (role.guild.me.permissions.has("VIEW_AUDIT_LOG")) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await role.guild.fetchAuditLogs({ type: "ROLE_CREATE", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === role.id) {
                const log = logs.entries.first();

                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addField("Created by", `${log.executor} ${log.executor.tag}`);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addField("Reason", log.reason);
                    msg.edit({ embeds: [embed] });
                }
            }
        }

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

        embed.setAuthor({ name: "Role Updated", iconURL: newRole.guild.iconURL({ dynamic: true }) });
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

        if (!shouldPost) return;

        embed.setFooter(`ID: ${newRole.id}`);
        embed.setTimestamp();

        const msg = await newRole.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (newRole.guild.me.permissions.has("VIEW_AUDIT_LOG")) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await newRole.guild.fetchAuditLogs({ type: "ROLE_UPDATE", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === newRole.id) {
                const log = logs.entries.first();
                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addField("Changed by", `${log.executor} ${log.executor.tag}`);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addField("Reason", log.reason);
                    msg.edit({ embeds: [embed] });
                }
            }
        }

    }
}

/**
 * @param {Role} role 
 */
async function roleDelete(role) {
    const guildSettings = client.guildSettings.get(role.guild.id);

    if (guildSettings.logFlags & flags.logs.ROLE && guildSettings.logChannel && role.guild.channels.cache.has(guildSettings.logChannel)) {
        const embed = new MessageEmbed();

        embed.setAuthor({ name: "Role Deleted", iconURL: role.guild.iconURL({ dynamic: true }) });
        embed.setColor(colors.ORANGE);
        embed.addField("Name", role.name, true);
        embed.setFooter(`ID: ${role.id}`);
        embed.setTimestamp();

        const msg = await role.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (role.guild.me.permissions.has("VIEW_AUDIT_LOG")) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await role.guild.fetchAuditLogs({ type: "ROLE_DELETE", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === role.id) {
                const log = logs.entries.first();

                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addField("Deleted by", `${log.executor} ${log.executor.tag}`);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addField("Reason", log.reason);
                    msg.edit({ embeds: [embed] });
                }
            }
        }

    }
}