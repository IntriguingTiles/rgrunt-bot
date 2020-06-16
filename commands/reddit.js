const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "reddit",
    usage: "reddit <add|remove|list|channel> [args]",
    info: "Sets the subreddit settings",
    requireAdmin: true
};

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args, guildSettings) => {
    if (args.length === 0) return msg.channel.send(`Usage: ${guildSettings.prefix}${exports.help.usage}`, { code: "" });

    switch (args[0]) {
        case "add": {
            if (args.length !== 2) return msg.channel.send(`Usage: ${guildSettings.prefix}reddit add <subreddit>`, { code: "" });
            if (!guildSettings.subredditChannel) return msg.channel.send(`Use \`${guildSettings.prefix}reddit channel\` to set the subreddit channel first.`);

            const subreddit = args[1].replace(/^\/?r?\//, "").toLowerCase();

            if (guildSettings.subreddits.includes(subreddit)) return msg.channel.send("That subreddit is already being watched.");

            guildSettings.subreddits.push(subreddit);
            client.guildSettings.set(msg.guild.id, guildSettings);

            msg.channel.send(`Now watching \`/r/${subreddit}\`.`);
            client.updateWatchedSubreddits = true;
            break;
        }
        case "remove": {
            if (args.length !== 2) return msg.channel.send(`Usage: ${guildSettings.prefix}reddit remove <subreddit>`, { code: "" });
            if (!guildSettings.subredditChannel) return msg.channel.send(`Use \`${guildSettings.prefix}reddit channel\` to set the subreddit channel first.`);

            const subreddit = args[1].replace(/^\/?r?\//, "").toLowerCase();

            if (!guildSettings.subreddits.includes(subreddit)) return msg.channel.send("That subreddit is not being watched.");

            guildSettings.subreddits = guildSettings.subreddits.filter(sub => sub !== subreddit);
            client.guildSettings.set(msg.guild.id, guildSettings);

            msg.channel.send(`No longer watching \`/r/${subreddit}\`.`);
            client.updateWatchedSubreddits = true;
            break;
        }
        case "list": {
            let subredditList = "";

            guildSettings.subreddits.forEach(sub => subredditList += `/r/${sub}\n`);

            msg.channel.send(`Watched subreddits:\n\`\`\`${subredditList.length !== 0 ? subredditList : "None"}\`\`\``);
            break;
        }
        case "channel": {
            if (args.length !== 2) return msg.channel.send(`Usage: ${guildSettings.prefix}reddit channel <channel>`, { code: "" });

            if (args[1] === "clear") {
                guildSettings.subredditChannel = null;
                client.guildSettings.set(msg.guild.id, guildSettings);
                msg.channel.send("Successfully cleared the subreddit channel");
                return;
            }

            let channelID;

            if (msg.mentions.channels.size !== 0) channelID = msg.mentions.channels.first().id;
            else if (/[0-9]+/g.test(args[1])) channelID = args[1].match(/[0-9]+/g);

            const ch = msg.guild.channels.cache.get(channelID);

            if (!ch) return msg.channel.send("Channel not found");
            if (ch.type !== "text") return msg.channel.send("Not a text channel");

            guildSettings.subredditChannel = channelID;
            client.guildSettings.set(msg.guild.id, guildSettings);

            msg.channel.send(`Successfully set the subreddit channel to ${ch}.`);
            break;
        }
        default:
            msg.channel.send(`Usage: ${guildSettings.prefix}${exports.help.usage}`, { code: "" });
            break;
    }
};