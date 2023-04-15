const { GuildMember, EmbedBuilder, Guild, User, GuildBan, PermissionsBitField, AuditLogEvent, GuildAuditLogsEntry } = require("discord.js"); // eslint-disable-line no-unused-vars

const flags = require("../utils/flags.js");
const colors = require("../utils/colors.js");
const moment = require("moment");
const sleep = require("util").promisify(setTimeout);

/** @type {import("../types").ClientExt} */
let client;

/**
 * @param {import("../types").ClientExt} c
 */
exports.register = c => {
    client = c;
    c.on("guildMemberAdd", guildMemberAdd);
    c.on("guildMemberUpdate", guildMemberUpdate);
    c.on("guildMemberRemove", guildMemberRemove);
    c.on("guildAuditLogEntryCreate", guildMemberKick);
    c.on("guildBanAdd", guildBanAdd);
    c.on("guildBanRemove", guildBanRemove);
};

/**
 * @param {import("../types").ClientExt} c
 */
exports.deregister = c => {
    c.removeListener("guildMemberAdd", guildMemberAdd);
    c.removeListener("guildMemberUpdate", guildMemberUpdate);
    c.removeListener("guildMemberRemove", guildMemberRemove);
    c.removeListener("guildAuditLogEntryCreate", guildMemberKick);
    c.removeListener("guildBanAdd", guildBanAdd);
    c.removeListener("guildBanRemove", guildBanRemove);
};

/**
 * @param {GuildMember} member 
 */
async function guildMemberAdd(member) {
    const guildSettings = client.guildSettings.get(member.guild.id);

    if (guildSettings.logFlags & flags.logs.JOIN && guildSettings.logChannel && member.guild.channels.cache.has(guildSettings.logChannel) &&
        member.guild.channels.cache.get(guildSettings.logChannel).permissionsFor(member.guild.members.me).has(PermissionsBitField.Flags.ViewChannel | PermissionsBitField.Flags.SendMessages | PermissionsBitField.Flags.EmbedLinks)) {
        const embed = new EmbedBuilder();

        embed.setAuthor({ name: "Member Joined", iconURL: member.user.displayAvatarURL() });
        embed.addFields([{ name: "Account Created", value: `${moment(member.user.createdTimestamp).fromNow()}` }]);
        embed.setThumbnail(member.user.displayAvatarURL());
        embed.setColor(colors.GREEN);
        embed.setDescription(`${member.user} ${member.user.tag}`);
        embed.setFooter({ text: `ID: ${member.id}` });
        embed.setTimestamp();

        member.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });
    }
}

/** 
 * @param {GuildMember} oldMember 
 * @param {GuildMember} newMember 
 */
async function guildMemberUpdate(oldMember, newMember) {
    const guildSettings = client.guildSettings.get(newMember.guild.id);
    const timestamp = Date.now();

    if (guildSettings.logFlags & flags.logs.USER && guildSettings.logChannel && newMember.guild.channels.cache.has(guildSettings.logChannel) &&
        newMember.guild.channels.cache.get(guildSettings.logChannel).permissionsFor(newMember.guild.members.me).has(PermissionsBitField.Flags.ViewChannel | PermissionsBitField.Flags.SendMessages | PermissionsBitField.Flags.EmbedLinks)) {
        const embed = new EmbedBuilder();

        // i'm not sure if we get member update events for boosts so we're doing this
        let shouldPost = false;

        embed.setAuthor({ name: "Member Updated", iconURL: newMember.user.displayAvatarURL() });
        embed.setColor(colors.BLUE);
        embed.addFields([{ name: "Member", value: `${newMember.user} ${newMember.user.tag}` }]);

        if (oldMember.nickname !== newMember.nickname) {
            embed.addFields([{ name: "Nickname", value: `${oldMember.nickname ? `\`${oldMember.nickname}\`` : "None"} → ${newMember.nickname ? `\`${newMember.nickname}\`` : "None"}`, inline: true }]);
            shouldPost = true;
        }

        if (!oldMember.roles.cache.equals(newMember.roles.cache)) {
            if (oldMember.roles.cache.size < newMember.roles.cache.size) {
                let rolesAdded = "";
                shouldPost = true;

                oldMember.roles.cache.difference(newMember.roles.cache).forEach(role => {
                    rolesAdded += role.name;
                });

                embed.addFields([{ name: "Roles Added", value: rolesAdded, inline: true }]);
            } else {
                await sleep(1000);
                let rolesRemoved = "";
                shouldPost = true;

                oldMember.roles.cache.difference(newMember.roles.cache).forEach(role => {
                    if (!newMember.guild.roles.cache.has(role.id)) shouldPost = false;
                    rolesRemoved += role.name;
                });

                if (rolesRemoved.length === 0) return;

                embed.addFields([{ name: "Roles Removed", value: rolesRemoved, inline: true }]);
            }
        }

        if (!shouldPost) return;

        embed.setFooter({ text: `ID: ${newMember.id}` });
        embed.setTimestamp();

        const msg = await newMember.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (newMember.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            await sleep(800);
            const logs = await newMember.guild.fetchAuditLogs({ limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === newMember.id && logs.entries.first().executor.id !== newMember.id) {
                const log = logs.entries.first();
                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addFields([{ name: "Updated by", value: `${log.executor} ${log.executor.tag}` }]);
                    if (log.reason) embed.addFields([{ name: "Reason", value: log.reason }]);
                    msg.edit({ embeds: [embed] });
                }
            }
        }
    }
}

/**
 * @param {GuildMember} member 
 */
async function guildMemberRemove(member) {
    const guildSettings = client.guildSettings.get(member.guild.id);

    if (guildSettings.logFlags & flags.logs.LEAVE && guildSettings.logChannel && member.guild.channels.cache.has(guildSettings.logChannel) &&
        member.guild.channels.cache.get(guildSettings.logChannel).permissionsFor(member.guild.members.me).has(PermissionsBitField.Flags.ViewChannel | PermissionsBitField.Flags.SendMessages | PermissionsBitField.Flags.EmbedLinks)) {
        const embed = new EmbedBuilder();

        embed.setAuthor({ name: "Member Left", iconURL: member.user.displayAvatarURL() });

        if (member.joinedTimestamp) embed.addFields([{ name: "Member For", value: moment(member.joinedTimestamp).fromNow(true) }]);

        embed.setThumbnail(member.user.displayAvatarURL());
        embed.setColor(colors.ORANGE);
        embed.setDescription(`${member.user} ${member.user.tag}`);
        embed.setFooter({ text: `ID: ${member.id}` });
        embed.setTimestamp();

        member.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });
    }
}

/**
 * @param {GuildAuditLogsEntry} entry
 * @param {Guild} guild 
 */
async function guildMemberKick(entry, guild) {
    const guildSettings = client.guildSettings.get(guild.id);

    if (entry.action === AuditLogEvent.MemberKick && guildSettings.logFlags & flags.logs.KICK && guildSettings.logChannel && guild.channels.cache.has(guildSettings.logChannel) &&
        guild.channels.cache.get(guildSettings.logChannel).permissionsFor(guild.members.me).has(PermissionsBitField.Flags.ViewChannel | PermissionsBitField.Flags.SendMessages | PermissionsBitField.Flags.EmbedLinks)) {
        /** @type {User} */
        const user = entry.target;
        await user.fetch();

        const embed = new EmbedBuilder();
        embed.setAuthor({ name: "Member Kicked", iconURL: user.displayAvatarURL() });
        embed.setThumbnail(user.displayAvatarURL());
        embed.setColor(colors.ORANGE);
        embed.addFields([{ name: "Member", value: `${user} ${user.tag}`, inline: true }]);
        embed.addFields([{ name: "Kicked by", value: `${entry.executor} ${entry.executor.tag}`, inline: true }]);

        if (entry.reason) embed.addFields([{ name: "Reason", value: entry.reason }]);

        embed.setFooter({ text: `ID: ${user.id}` });
        embed.setTimestamp();

        guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });
    }
}

/**
 * @param {GuildBan} ban 
 */
async function guildBanAdd(ban) {
    const guild = ban.guild;
    const user = ban.user;
    const guildSettings = client.guildSettings.get(guild.id);

    if (guildSettings.logFlags & flags.logs.BAN && guildSettings.logChannel && guild.channels.cache.has(guildSettings.logChannel)) {
        await user.fetch();

        const embed = new EmbedBuilder();

        embed.setAuthor({ name: "Member Banned", iconURL: user.displayAvatarURL() });
        embed.setThumbnail(user.displayAvatarURL());
        embed.setColor(colors.ORANGE);
        embed.addFields([{ name: "Member", value: `${user} ${user.tag}`, inline: true }]);
        embed.setFooter({ text: `ID: ${user.id}` });
        embed.setTimestamp();

        const msg = await guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            const timestamp = Date.now();
            await sleep(900);
            const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === user.id) {
                const log = logs.entries.first();
                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addFields([{ name: "Banned by", value: `${log.executor} ${log.executor.tag}`, inline: true }]);
                    if (log.reason) embed.addFields([{ name: "Reason", value: log.reason }]);
                    msg.edit({ embeds: [embed] });
                }
            }
        }
    }
}

/**
 * @param {GuildBan} ban
 */
async function guildBanRemove(ban) {
    const guild = ban.guild;
    const user = ban.user;
    const guildSettings = client.guildSettings.get(guild.id);

    if (guildSettings.logFlags & flags.logs.BAN && guildSettings.logChannel && guild.channels.cache.has(guildSettings.logChannel)) {
        await user.fetch();

        const embed = new EmbedBuilder();

        embed.setAuthor({ name: "Member Unbanned", iconURL: user.displayAvatarURL() });
        embed.setThumbnail(user.displayAvatarURL());
        embed.setColor(colors.GREEN);
        embed.addFields([{ name: "Member", value: `${user} ${user.tag}`, inline: true }]);

        embed.setFooter({ text: `ID: ${user.id}` });
        embed.setTimestamp();

        const msg = await guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === user.id) {
                const log = logs.entries.first();
                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addFields([{ name: "Unbanned by", value: `${log.executor} ${log.executor.tag}`, inline: true }]);
                    if (log.reason) embed.addFields([{ name: "Reason", value: log.reason }]);
                    msg.edit({ embeds: [embed] });
                }
            }
        }
    }
}