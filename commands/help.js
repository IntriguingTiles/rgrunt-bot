const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "help",
    usage: "help [command]",
    info: "View the commands list or get help on a command",
    requireMod: true
};

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args, guildSettings) => {
    const prefix = guildSettings.prefix;
    if (args.length >= 1) {
        const search = args[0].replace(prefix, "");
        for (const command in client.commands) {
            if (command.startsWith(search)) {
                const cmd = client.commands[command];
                if (!cmd.help) continue;
                const helpText = `\nCommand: ${prefix}${cmd.help.name}\nUsage: ${prefix}${cmd.help.usage}\nInfo: ${cmd.help.info}`;

                msg.channel.send(helpText, { code: "" });
                return;
            }
        }

        msg.channel.send("Command not found!");
    } else {
        let final = "Commands list: \n```\n";

        for (const command in client.commands) {
            const cmd = client.commands[command];
            if (cmd.help) {
                final += `${prefix}${command}${cmd.help.requireMod ? " (moderators/administrators only)" : ""}${cmd.help.requireAdmin ? " (administrators only)" : ""}\n`;
            }
        }
        final += `\`\`\`\nTo get more info about a command, use \`${prefix}help [command]\`.`;
        msg.channel.send(final);
    }
};