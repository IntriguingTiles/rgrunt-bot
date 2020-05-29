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
    if (ch.type === "dm") return;
    const guildSettings = client.guildSettings.get(ch.guild.id);

    if (guildSettings.logFlags & flags.logs.CHANNEL && guildSettings.logChannel && ch.guild.channels.cache.has(guildSettings.logChannel)) {
        const embed = new MessageEmbed();

        embed.setAuthor("Channel Created", ch.guild.iconURL());
        embed.setColor(colors.GREEN);
        embed.addField("Name", ch.name, true);
        embed.setFooter(`ID: ${ch.id}`);
        embed.setTimestamp();

        if (ch.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            await sleep(500);
            const logs = await ch.guild.fetchAuditLogs({ type: "CHANNEL_CREATE", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === ch.id) {
                const log = logs.entries.first();

                if (Date.now() - log.createdTimestamp < 800) {
                    embed.addField("Created by", `${log.executor} ${log.executor.tag}`);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addField("Reason", log.reason);
                }
            }
        }

        ch.guild.channels.cache.get(guildSettings.logChannel).send(embed);
    }
}

/**
 * @param {GuildChannel} oldCh 
 * @param {GuildChannel} newCh 
 */
async function channelUpdate(oldCh, newCh) {
    if (newCh.type === "dm") return;
    const guildSettings = client.guildSettings.get(newCh.guild.id);

    if (guildSettings.logFlags & flags.logs.CHANNEL && guildSettings.logChannel && newCh.guild.channels.cache.has(guildSettings.logChannel)) {
        const embed = new MessageEmbed();
        let shouldPost = false;

        embed.setAuthor("Channel Updated", newCh.guild.iconURL());
        embed.setColor(colors.BLUE);

        if (oldCh.name !== newCh.name) {
            embed.addField("Name", `\`${oldCh.name}\` → \`${newCh.name}\``, true);
            shouldPost = true;
        } else {
            embed.addField("Name", newCh.name, true);
        }

        if ((newCh.type === "text" || newCh.type === "news") && oldCh.topic !== newCh.topic) {
            embed.addField("Topic", `${oldCh.topic ? `\`${oldCh.topic}\`` : "None"} → ${newCh.topic ? `\`${newCh.topic}\`` : "None"}`, true);
            shouldPost = true;
        }

        embed.setFooter(`ID: ${newCh.id}`);
        embed.setTimestamp();

        if (newCh.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            await sleep(500);
            const logs = await newCh.guild.fetchAuditLogs({ type: "CHANNEL_UPDATE", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === newCh.id) {
                const log = logs.entries.first();

                if (Date.now() - log.createdTimestamp < 800) {
                    embed.addField("Created by", `${log.executor} ${log.executor.tag}`);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addField("Reason", log.reason);
                }
            }
        }

        if (shouldPost) newCh.guild.channels.cache.get(guildSettings.logChannel).send(embed);
    }
}

/**
 * @param {GuildChannel} ch 
 */
async function channelDelete(ch) {
    if (ch.type === "dm") return;
    const guildSettings = client.guildSettings.get(ch.guild.id);

    if (guildSettings.logFlags & flags.logs.CHANNEL && guildSettings.logChannel && ch.guild.channels.cache.has(guildSettings.logChannel)) {
        const embed = new MessageEmbed();

        embed.setAuthor("Channel Deleted", ch.guild.iconURL());
        embed.setColor(colors.RED);
        embed.addField("Name", ch.name, true);
        embed.setFooter(`ID: ${ch.id}`);
        embed.setTimestamp();

        if (ch.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            await sleep(500);
            const logs = await ch.guild.fetchAuditLogs({ type: "CHANNEL_DELETE", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === ch.id) {
                const log = logs.entries.first();

                if (Date.now() - log.createdTimestamp < 800) {
                    embed.addField("Deleted by", `${log.executor} ${log.executor.tag}`);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addField("Reason", log.reason);
                }
            }
        }

        ch.guild.channels.cache.get(guildSettings.logChannel).send(embed);
    }
}