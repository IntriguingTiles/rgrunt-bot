const { Role, EmbedBuilder, PermissionsBitField, AuditLogEvent } = require("discord.js"); // eslint-disable-line no-unused-vars

const flags = require("../utils/flags.js");
const colors = require("../utils/colors.js");
const sleep = require("util").promisify(setTimeout);

/** @type {import("../types").ClientExt} */
let client;

/**
 * @param {import("../types").ClientExt} c
 */
exports.register = c => {
    client = c;
    c.on("roleCreate", roleCreate);
    c.on("roleUpdate", roleUpdate);
    c.on("roleDelete", roleDelete);
};

/**
 * @param {import("../types").ClientExt} c
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
        const embed = new EmbedBuilder();

        embed.setAuthor({ name: "Role Created", iconURL: role.guild.iconURL() });
        embed.setColor(colors.GREEN);
        embed.addFields([{ name: "Name", value: role.name, inline: true }]);
        embed.addFields([{ name: "Permissions", value: `\`${role.permissions.bitfield}\``, inline: true }]);
        embed.setFooter({ text: `ID: ${role.id}` });
        embed.setTimestamp();

        const msg = await role.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (role.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate, limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === role.id) {
                const log = logs.entries.first();

                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addFields([{ name: "Created by", value: `${log.executor} ${log.executor.tag}` }]);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addFields([{ name: "Reason", value: log.reason }]);
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
        const embed = new EmbedBuilder();
        let shouldPost = false;

        embed.setAuthor({ name: "Role Updated", iconURL: newRole.guild.iconURL() });
        embed.setColor(colors.BLUE);

        if (oldRole.name !== newRole.name) {
            embed.addFields([{ name: "Name", value: `\`${oldRole.name}\` → \`${newRole.name}\``, inline: true }]);
            shouldPost = true;
        } else {
            embed.addFields([{ name: "Name", value: newRole.name, inline: true }]);
        }

        if (oldRole.color !== newRole.color) {
            embed.addFields([{ name: "Color", value: `\`${oldRole.hexColor}\` → \`${newRole.hexColor}\``, inline: true }]);
            embed.setColor(newRole.color);
            shouldPost = true;
        }

        if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
            embed.addFields([{ name: "Permissions", value: `\`${oldRole.permissions.bitfield}\` → \`${newRole.permissions.bitfield}\``, inline: true }]);
            shouldPost = true;
        }

        if (oldRole.hoist !== newRole.hoist) {
            embed.addFields([{ name: "Hoisted", value: `\`${oldRole.hoist}\` → \`${newRole.hoist}\``, inline: true }]);
            shouldPost = true;
        }

        if (oldRole.mentionable !== newRole.mentionable) {
            embed.addFields([{ name: "Mentionable", value: `\`${oldRole.mentionable}\` → \`${newRole.mentionable}\``, inline: true }]);
            shouldPost = true;
        }

        if (!shouldPost) return;

        embed.setFooter({ text: `ID: ${newRole.id}` });
        embed.setTimestamp();

        const msg = await newRole.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (newRole.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await newRole.guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate, limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === newRole.id) {
                const log = logs.entries.first();
                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addFields([{ name: "Changed by", value: `${log.executor} ${log.executor.tag}` }]);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addFields([{ name: "Reason", value: log.reason }]);
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
        const embed = new EmbedBuilder();

        embed.setAuthor({ name: "Role Deleted", iconURL: role.guild.iconURL() });
        embed.setColor(colors.ORANGE);
        embed.addFields([{ name: "Name", value: role.name, inline: true }]);
        embed.setFooter({ text: `ID: ${role.id}` });
        embed.setTimestamp();

        const msg = await role.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (role.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === role.id) {
                const log = logs.entries.first();

                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addFields([{ name: "Deleted by", value: `${log.executor} ${log.executor.tag}` }]);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addFields([{ name: "Reason", value: log.reason }]);
                    msg.edit({ embeds: [embed] });
                }
            }
        }

    }
}