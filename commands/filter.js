const { ChatInputCommandInteraction, PermissionsBitField } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("filter")
        .setDescription("Configures the word filter.")
        .addSubcommand(cmd =>
            cmd.setName("add")
                .setDescription("Adds a word to the word filter.")
                .addStringOption(option =>
                    option.setName("word")
                        .setDescription("The word to add to the filter.")
                        .setRequired(true)))
        .addSubcommand(cmd =>
            cmd.setName("remove")
                .setDescription("Removes a word from the word filter.")
                .addStringOption(option =>
                    option.setName("word")
                        .setDescription("The word to remove from the filter.")
                        .setRequired(true)))
        .addSubcommand(cmd =>
            cmd.setName("show")
                .setDescription("View the list of words in the filter."))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setDMPermission(false)
];

/**
 * @param {import("../types").ClientExt} client
 * @param {ChatInputCommandInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, intr, guildSettings) => {
    if (!intr.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) return intr.reply({ content: "I need the \"Manage Messages\" permission in order to filter messages.", ephemeral: true });

    const word = intr.options.getString("word", false);

    switch (intr.options.getSubcommand()) {
        case "add":
            if (guildSettings.badWords.includes(word)) return intr.reply({ content: "That word is already in the filter.", ephemeral: true });

            guildSettings.badWords.push(word);
            client.guildSettings.set(intr.guild.id, guildSettings);
            client.regenWordRegex(intr.guild.id);

            intr.reply(`Successfully added \`${word}\` to the word filter.`);
            break;
        case "remove":
            if (!guildSettings.badWords.includes(word)) return intr.reply({ content: "Word not found in filter.", ephemeral: true });

            guildSettings.badWords = guildSettings.badWords.filter(word2 => word2 !== word);
            client.guildSettings.set(intr.guild.id, guildSettings);
            client.regenWordRegex(intr.guild.id);

            intr.reply(`Successfully removed \`${word}\` from the word filter.`);
            break;
        case "show": {
            let final = "";

            guildSettings.badWords.forEach(word => final += `${word}\n`);

            intr.reply({ content: `Word filter:\n\`\`\`${final.length === 0 ? "None" : final}\`\`\``, ephemeral: true });
            break;
        }
    }
};