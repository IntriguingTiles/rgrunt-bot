const { Client, MessageEmbed, GuildChannel } = require("discord.js"); // eslint-disable-line no-unused-vars

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
    c.on("channelCreate", channelCreate);
    c.on("channelUpdate", channelUpdate);
    c.on("channelDelete", channelDelete);
};

/**
 * @param {Client} c
 */
exports.deregister = c => {
    c.removeListener("channelCreate", channelCreate);
    c.removeListener("channelUpdate", channelUpdate);
    c.removeListener("channelDelete", channelDelete);
};

/**
 * @param {GuildChannel} ch 
 */
async function channelCreate(ch) {
    if (ch.type === "DM") return;
    const guildSettings = client.guildSettings.get(ch.guild.id);

    if (guildSettings.logFlags & flags.logs.CHANNEL && guildSettings.logChannel && ch.guild.channels.cache.has(guildSettings.logChannel)) {
        const embed = new MessageEmbed();

        embed.setAuthor({ name: "Channel Created", iconURL: ch.guild.iconURL({ dynamic: true }) });
        embed.setColor(colors.GREEN);
        embed.addField("Name", ch.name, true);
        embed.setFooter(`ID: ${ch.id}`);
        embed.setTimestamp();

        const msg = await ch.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (ch.guild.me.permissions.has("VIEW_AUDIT_LOG")) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await ch.guild.fetchAuditLogs({ type: "CHANNEL_CREATE", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === ch.id) {
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
 * @param {GuildChannel} oldCh 
 * @param {GuildChannel} newCh 
 */
async function channelUpdate(oldCh, newCh) {
    if (newCh.type === "DM") return;
    const guildSettings = client.guildSettings.get(newCh.guild.id);

    if (guildSettings.logFlags & flags.logs.CHANNEL && guildSettings.logChannel && newCh.guild.channels.cache.has(guildSettings.logChannel)) {
        if (newCh.topic && newCh.topic.includes("[NO-LOGS]")) return;
        const embed = new MessageEmbed();
        let shouldPost = false;

        embed.setAuthor({ name: "Channel Updated", iconURL: newCh.guild.iconURL({ dynamic: true }) });
        embed.setColor(colors.BLUE);

        if (oldCh.name !== newCh.name) {
            embed.addField("Name", `\`${oldCh.name}\` → \`${newCh.name}\``, true);
            shouldPost = true;
        } else {
            embed.addField("Name", newCh.name, true);
        }

        if (oldCh.topic !== newCh.topic) {
            embed.addField("Topic", `${oldCh.topic ? `\`${oldCh.topic}\`` : "None"} → ${newCh.topic ? `\`${newCh.topic}\`` : "None"}`, true);
            shouldPost = true;
        }

        if (!shouldPost) return;

        embed.setFooter(`ID: ${newCh.id}`);
        embed.setTimestamp();

        const msg = await newCh.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (newCh.guild.me.permissions.has("VIEW_AUDIT_LOG")) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await newCh.guild.fetchAuditLogs({ type: "CHANNEL_UPDATE", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === newCh.id) {
                const log = logs.entries.first();

                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addField("Updated by", `${log.executor} ${log.executor.tag}`);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addField("Reason", log.reason);
                    msg.edit({ embeds: [embed] });
                }
            }
        }

    }
}

/**
 * @param {GuildChannel} ch 
 */
async function channelDelete(ch) {
    if (ch.type === "DM") return;
    const guildSettings = client.guildSettings.get(ch.guild.id);

    if (guildSettings.logFlags & flags.logs.CHANNEL && guildSettings.logChannel && ch.guild.channels.cache.has(guildSettings.logChannel)) {
        const embed = new MessageEmbed();

        embed.setAuthor({ name: "Channel Deleted", iconURL: ch.guild.iconURL({ dynamic: true }) });
        embed.setColor(colors.ORANGE);
        embed.addField("Name", ch.name, true);
        embed.setFooter(`ID: ${ch.id}`);
        embed.setTimestamp();

        const msg = await ch.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (ch.guild.me.permissions.has("VIEW_AUDIT_LOG")) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await ch.guild.fetchAuditLogs({ type: "CHANNEL_DELETE", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === ch.id) {
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