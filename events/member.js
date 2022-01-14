const { Client, GuildMember, MessageEmbed, Guild, User, GuildBan } = require("discord.js"); // eslint-disable-line no-unused-vars

const flags = require("../utils/flags.js");
const colors = require("../utils/colors.js");
const moment = require("moment");
const sleep = require("util").promisify(setTimeout);

/** @type {Client} */
let client;

/**
 * @param {Client} c
 */
exports.register = c => {
    client = c;
    c.on("guildMemberAdd", guildMemberAdd);
    c.on("guildMemberUpdate", guildMemberUpdate);
    c.on("guildMemberRemove", guildMemberRemove);
    c.on("guildMemberRemove", guildMemberKick);
    c.on("guildBanAdd", guildBanAdd);
    c.on("guildBanRemove", guildBanRemove);
};

/**
 * @param {Client} c
 */
exports.deregister = c => {
    c.removeListener("guildMemberAdd", guildMemberAdd);
    c.removeListener("guildMemberUpdate", guildMemberUpdate);
    c.removeListener("guildMemberRemove", guildMemberRemove);
    c.removeListener("guildMemberRemove", guildMemberKick);
    c.removeListener("guildBanAdd", guildBanAdd);
    c.removeListener("guildBanRemove", guildBanRemove);
};

/**
 * @param {GuildMember} member 
 */
async function guildMemberAdd(member) {
    const guildSettings = client.guildSettings.get(member.guild.id);

    if (guildSettings.logFlags & flags.logs.JOIN && guildSettings.logChannel && member.guild.channels.cache.has(guildSettings.logChannel)) {
        const embed = new MessageEmbed();

        embed.setAuthor({ name: "Member Joined", iconURL: member.user.displayAvatarURL({ dynamic: true }) });
        embed.addField("Account Created", `${moment(member.user.createdTimestamp).fromNow()}`);
        embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true }));
        embed.setColor(colors.GREEN);
        embed.setDescription(`${member.user} ${member.user.tag}`);
        embed.setFooter(`ID: ${member.id}`);
        embed.setTimestamp();

        member.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });
    }
}

/** 
 * @param {GuildMember} oldMember 
 * @param {GuildMember} newMember 
 */
async function guildMemberUpdate(oldMember, newMember) {
    /** @type {import("../types").Settings} */
    const guildSettings = client.guildSettings.get(newMember.guild.id);

    if (guildSettings.logFlags & flags.logs.USER && guildSettings.logChannel && newMember.guild.channels.cache.has(guildSettings.logChannel)) {
        const embed = new MessageEmbed();

        // i'm not sure if we get member update events for boosts so we're doing this
        let shouldPost = false;

        embed.setAuthor({ name: "Member Updated", iconURL: newMember.user.displayAvatarURL({ dynamic: true }) });
        embed.setColor(colors.BLUE);
        embed.addField("Member", `${newMember.user} ${newMember.user.tag}`);

        if (oldMember.nickname !== newMember.nickname) {
            embed.addField("Nickname", `${oldMember.nickname ? `\`${oldMember.nickname}\`` : "None"} → ${newMember.nickname ? `\`${newMember.nickname}\`` : "None"}`, true);
            shouldPost = true;
        }

        if (!oldMember.roles.cache.equals(newMember.roles.cache)) {
            if (oldMember.roles.cache.size < newMember.roles.cache.size) {
                let rolesAdded = "";
                shouldPost = true;

                oldMember.roles.cache.difference(newMember.roles.cache).forEach(role => {
                    rolesAdded += role.name;
                });

                embed.addField("Roles Added", rolesAdded, true);
            } else {
                let rolesRemoved = "";
                shouldPost = true;

                oldMember.roles.cache.difference(newMember.roles.cache).forEach(role => {
                    if (role.deleted) shouldPost = false;
                    rolesRemoved += role.name;
                });

                embed.addField("Roles Removed", rolesRemoved, true);
            }
        }

        if (!shouldPost) return;

        embed.setFooter(`ID: ${newMember.id}`);
        embed.setTimestamp();

        const msg = await newMember.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (newMember.guild.me.permissions.has("VIEW_AUDIT_LOG")) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await newMember.guild.fetchAuditLogs({ limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === newMember.id && logs.entries.first().executor.id !== newMember.id) {
                const log = logs.entries.first();
                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addField("Updated by", `${log.executor} ${log.executor.tag}`);
                    if (log.reason) embed.addField("Reason", log.reason);
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

    if (guildSettings.logFlags & flags.logs.LEAVE && guildSettings.logChannel && member.guild.channels.cache.has(guildSettings.logChannel)) {
        const embed = new MessageEmbed();

        embed.setAuthor({ name: "Member Left", iconURL: member.user.displayAvatarURL({ dynamic: true }) });

        if (member.joinedTimestamp) embed.addField("Member For", moment(member.joinedTimestamp).fromNow(true));

        embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true }));
        embed.setColor(colors.ORANGE);
        embed.setDescription(`${member.user} ${member.user.tag}`);
        embed.setFooter(`ID: ${member.id}`);
        embed.setTimestamp();

        member.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });
    }
}

/**
 * @param {GuildMember} member 
 */
async function guildMemberKick(member) {
    const guildSettings = client.guildSettings.get(member.guild.id);

    if (guildSettings.logFlags & flags.logs.KICK && guildSettings.logChannel && member.guild.channels.cache.has(guildSettings.logChannel) && member.guild.me.permissions.has("VIEW_AUDIT_LOG")) {
        const timestamp = Date.now();
        await sleep(900);
        await member.user.fetch();

        const embed = new MessageEmbed();
        const logs = await member.guild.fetchAuditLogs({ type: "MEMBER_KICK", limit: 1 });

        embed.setAuthor({ name: "Member Kicked", iconURL: member.user.displayAvatarURL({ dynamic: true }) });
        embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true }));
        embed.setColor(colors.ORANGE);
        embed.addField("Member", `${member.user} ${member.user.tag}`, true);

        if (logs.entries.first() && logs.entries.first().target.id === member.user.id && Math.abs(timestamp - logs.entries.first().createdTimestamp) < 1400) {
            const log = logs.entries.first();
            embed.addField("Kicked by", `${log.executor} ${log.executor.tag}`, true);
            if (log.reason) embed.addField("Reason", log.reason);
        } else {
            return;
        }

        embed.setFooter(`ID: ${member.user.id}`);
        embed.setTimestamp();

        member.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });
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

        const embed = new MessageEmbed();

        embed.setAuthor({ name: "Member Banned", iconURL: user.displayAvatarURL({ dynamic: true }) });
        embed.setThumbnail(user.displayAvatarURL({ dynamic: true }));
        embed.setColor(colors.ORANGE);
        embed.addField("Member", `${user} ${user.tag}`, true);
        embed.setFooter(`ID: ${user.id}`);
        embed.setTimestamp();

        const msg = await guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (guild.me.permissions.has("VIEW_AUDIT_LOG")) {
            const timestamp = Date.now();
            await sleep(900);
            const logs = await guild.fetchAuditLogs({ type: "MEMBER_BAN_ADD", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === user.id) {
                const log = logs.entries.first();
                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addField("Banned by", `${log.executor} ${log.executor.tag}`, true);
                    if (log.reason) embed.addField("Reason", log.reason);
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

        const embed = new MessageEmbed();

        embed.setAuthor({ name: "Member Unbanned", iconURL: user.displayAvatarURL({ dynamic: true }) });
        embed.setThumbnail(user.displayAvatarURL({ dynamic: true }));
        embed.setColor(colors.GREEN);
        embed.addField("Member", `${user} ${user.tag}`, true);

        embed.setFooter(`ID: ${user.id}`);
        embed.setTimestamp();

        const msg = await guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (guild.me.permissions.has("VIEW_AUDIT_LOG")) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await guild.fetchAuditLogs({ type: "MEMBER_BAN_REMOVE", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === user.id) {
                const log = logs.entries.first();
                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addField("Unbanned by", `${log.executor} ${log.executor.tag}`, true);
                    if (log.reason) embed.addField("Reason", log.reason);
                    msg.edit({ embeds: [embed] });
                }
            }
        }
    }
}