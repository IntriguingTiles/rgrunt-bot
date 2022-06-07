const { Client, CommandInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");
const flags = require("../utils/flags.js");

const choices = [{ name: "All - All log types.", value: "all" }];

// dynamically build the log choices
for (let i = 0; i < flags.logs.TOTAL; i++) {
    const str = flags.logsStrings(1 << i);
    const name = str.split(" - ")[0];
    const desc = str.split(" - ")[1];
    choices.push({ name: `${name.slice(0, 1).toUpperCase()}${name.slice(1)} - ${desc.slice(0, 1).toUpperCase()}${desc.slice(1)}.`, value: name });
}

exports.commands = [
    new SlashCommandBuilder()
        .setName("logs")
        .setDescription("Configures the logging feature.")
        .addSubcommand(cmd =>
            cmd.setName("enable")
                .setDescription("Enables a log type.")
                .addStringOption(option =>
                    option.setName("type")
                        .setDescription("The log type to enable.")
                        .addChoices(...choices)
                        .setRequired(true)))
        .addSubcommand(cmd =>
            cmd.setName("disable")
                .setDescription("Disable a log type.")
                .addStringOption(option =>
                    option.setName("type")
                        .setDescription("The log type to disable.")
                        .addChoices(...choices)
                        .setRequired(true)))
        .addSubcommand(cmd =>
            cmd.setName("show")
                .setDescription("View the currently enabled/disabled log types."))
        .addSubcommandGroup(cmdGroup =>
            cmdGroup.setName("channel")
                .setDescription("Manage the channel RGrunt will log to.")
                .addSubcommand(cmd =>
                    cmd.setName("set")
                        .setDescription("Sets the channel used for logs.")
                        .addChannelOption(option =>
                            option.setName("channel")
                                .setDescription("The channel to log to.")
                                .setRequired(true)))
                .addSubcommand(cmd =>
                    cmd.setName("clear")
                        .setDescription("Unsets the logging channel.")))
];

exports.requireAdmin = true;

/**
 * @param {Client} client
 * @param {CommandInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, intr, guildSettings) => {
    switch (intr.options.getSubcommandGroup(false) ? intr.options.getSubcommandGroup() : intr.options.getSubcommand()) {
        case "enable": {
            if (!guildSettings.logChannel) return intr.reply({ content: "Use `/logs channel` to set the log channel first.", ephemeral: true });

            const type = intr.options.getString("type");

            if (type === "all") {
                for (let i = 0; i < flags.logs.TOTAL; i++) {
                    guildSettings.logFlags |= 1 << i;
                }
                client.guildSettings.set(intr.guild.id, guildSettings);
                intr.reply("Enabled all log types.");
                return;
            }

            if (flags.logs[type.toUpperCase()]) {
                guildSettings.logFlags |= flags.logs[type.toUpperCase()];
                client.guildSettings.set(intr.guild.id, guildSettings);
                intr.reply(`Enabled ${type} logs.`);
            } else {
                intr.reply({ content: "Log type not found. Use `/logs list` to see the available log types.", ephemeral: true });
            }

            break;
        }
        case "disable": {
            if (!guildSettings.logChannel) return intr.reply({ content: "Use `/logs channel` to set the log channel first.", ephemeral: true });

            const type = intr.options.getString("type");

            if (type === "all") {
                guildSettings.logFlags = 0;
                client.guildSettings.set(intr.guild.id, guildSettings);
                intr.reply("Disabled all log types.");
                return;
            }

            if (flags.logs[type.toUpperCase()]) {
                if (guildSettings.logFlags & flags.logs[type.toUpperCase()]) {
                    guildSettings.logFlags ^= flags.logs[type.toUpperCase()];
                    client.guildSettings.set(intr.guild.id, guildSettings);
                    intr.reply(`Disabled ${type} logs.`);
                } else {
                    intr.reply({ content: "That log type wasn't enabled.", ephemeral: true });
                }
            } else {
                intr.reply({ content: "Log type not found. Use `/logs list` to see the available log types.", ephemeral: true });
            }

            break;
        } case "show": {
            let enabledList = "";
            let availableList = "";

            for (let i = 0; i < flags.logs.TOTAL; i++) {
                if (guildSettings.logFlags & 1 << i) {
                    enabledList += `${flags.logsStrings(1 << i)}\n`;
                } else {
                    availableList += `${flags.logsStrings(1 << i)}\n`;
                }
            }

            intr.reply({ content: `Logging to: ${guildSettings.logChannel ? `<#${guildSettings.logChannel}>` : "nowhere"}\n\nEnabled log types:\n\`\`\`${enabledList.length !== 0 ? enabledList : "None"}\`\`\`\nAvailable log types:\n\`\`\`${availableList.length !== 0 ? availableList : "None"}\`\`\``, ephemeral: true });
            break;
        }
        case "channel": {
            if (intr.options.getSubcommand() === "clear") {
                guildSettings.logChannel = null;
                client.guildSettings.set(intr.guild.id, guildSettings);
                intr.reply("Successfully cleared the logging channel.");
                return;
            }

            const ch = intr.options.getChannel("channel");

            if (!ch) return intr.reply({ content: "Channel not found.", ephemeral: true });
            if (ch.type !== "GUILD_TEXT") return intr.reply({ content: "Not a text channel.", ephemeral: true });
            if (!ch.permissionsFor(client.user).has("SEND_MESSAGES")) return intr.reply({ content: `I don't have permission to send messages in ${ch}.`, ephemeral: true });
            if (!ch.permissionsFor(client.user).has("EMBED_LINKS")) return intr.reply({ content: `I don't have permission to send embeds in ${ch}.`, ephemeral: true });

            guildSettings.logChannel = ch.id;
            client.guildSettings.set(intr.guild.id, guildSettings);

            intr.reply(`Successfully set the logging channel to ${ch}.`);
            break;
        }
    }
};