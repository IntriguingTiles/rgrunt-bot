const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars
const flags = require("../utils/flags.js");

exports.help = {
    name: "logs",
    usage: "logs <enable|disable|list|channel> [args]",
    info: "Sets the logging settings"
};

exports.requireAdmin = true;

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, msg, args, guildSettings) => {
    if (args.length === 0) return msg.channel.send(`Usage: \`${guildSettings.prefix}${exports.help.usage}\``);

    switch (args[0]) {
        case "enable":
            if (args.length !== 2) return msg.channel.send(`\`\`\`Usage: ${guildSettings.prefix}logs enable <log type>\`\`\`\nUse \`${guildSettings.prefix}logs list\` to see the available log types.`);
            if (!guildSettings.logChannel) return msg.channel.send(`Use \`${guildSettings.prefix}logs channel\` to set the log channel first.`);

            if (args[1] === "all") {
                for (let i = 0; i < flags.logs.TOTAL; i++) {
                    guildSettings.logFlags |= 1 << i;
                }
                client.guildSettings.set(msg.guild.id, guildSettings);
                msg.channel.send("Enabled all log types.");
                return;
            }

            if (flags.logs[args[1].toUpperCase()]) {
                guildSettings.logFlags |= flags.logs[args[1].toUpperCase()];
                client.guildSettings.set(msg.guild.id, guildSettings);
                msg.channel.send(`Enabled ${flags.logsStrings(flags.logs[args[1].toUpperCase()]).split(" - ")[0]} logs.`);
            } else {
                msg.channel.send(`Log type not found. Use \`${guildSettings.prefix}logs list\` to see the available log types.`);
            }

            break;
        case "disable":
            if (args.length !== 2) return msg.channel.send(`\`\`\`Usage: ${guildSettings.prefix}logs disable <log type>\`\`\`\nUse \`${guildSettings.prefix}logs list\` to see the available log types.`);
            if (!guildSettings.logChannel) return msg.channel.send(`Use \`${guildSettings.prefix}logs channel\` to set the log channel first.`);

            if (args[1] === "all") {
                guildSettings.logFlags = 0;
                client.guildSettings.set(msg.guild.id, guildSettings);
                msg.channel.send("Disabled all log types.");
            }

            if (flags.logs[args[1].toUpperCase()]) {
                guildSettings.logFlags ^= flags.logs[args[1].toUpperCase()];
                client.guildSettings.set(msg.guild.id, guildSettings);
                msg.channel.send(`Disabled ${flags.logsStrings(flags.logs[args[1].toUpperCase()]).split(" - ")[0]} logs.`);
            } else {
                msg.channel.send(`Log type not found. Use \`${guildSettings.prefix}logs list\` to see the available log types.`);
            }

            break;
        case "list": {
            let enabledList = "";
            let availableList = "";

            for (let i = 0; i < flags.logs.TOTAL; i++) {
                if (guildSettings.logFlags & 1 << i) {
                    enabledList += `${flags.logsStrings(1 << i)}\n`;
                } else {
                    availableList += `${flags.logsStrings(1 << i)}\n`;
                }
            }

            msg.channel.send(`Enabled log types:\n\`\`\`${enabledList.length !== 0 ? enabledList : "None"}\`\`\`\nAvailable log types:\n\`\`\`${availableList.length !== 0 ? availableList : "None"}\`\`\``);
            break;
        }
        case "channel": {
            if (args.length !== 2) return msg.channel.send(`Usage: ${guildSettings.prefix}logs channel <channel>`, { code: "" });

            if (args[1] === "clear") {
                guildSettings.logChannel = null;
                client.guildSettings.set(msg.guild.id, guildSettings);
                msg.channel.send("Successfully cleared the logging channel.");
                return;
            }

            let channelID;

            if (msg.mentions.channels.size !== 0) channelID = msg.mentions.channels.first().id;
            else if (/[0-9]+/g.test(args[1])) channelID = args[1].match(/[0-9]+/g);

            const ch = msg.guild.channels.cache.get(channelID);

            if (!ch) return msg.channel.send("Channel not found.");
            if (ch.type !== "GUILD_TEXT") return msg.channel.send("Not a text channel.");
            if (!ch.permissionsFor(client.user).has("SEND_MESSAGES")) return msg.channel.send(`I don't have permission to send messages in ${ch}.`);
            if (!ch.permissionsFor(client.user).has("EMBED_LINKS")) return msg.channel.send(`I don't have permission to send embeds in ${ch}.`);

            guildSettings.logChannel = channelID;
            client.guildSettings.set(msg.guild.id, guildSettings);

            msg.channel.send(`Successfully set the logging channel to ${ch}.`);
            break;
        }
        default:
            msg.channel.send(`Usage: \`${guildSettings.prefix}${exports.help.usage}\``);
            break;
    }
};