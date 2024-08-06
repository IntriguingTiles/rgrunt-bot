const { ChatInputCommandInteraction, PermissionsBitField, AutocompleteInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("namefilter")
        .setDescription("Configures the (nick)name filter.")
        .addSubcommand(cmd =>
            cmd.setName("add")
                .setDescription("Adds a word to the name filter.")
                .addStringOption(option =>
                    option.setName("word")
                        .setDescription("The word to match.")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName("replacement")
                        .setDescription("What to replace the nickname with.")))
        .addSubcommand(cmd =>
            cmd.setName("remove")
                .setDescription("Removes a word from the name filter.")
                .addStringOption(option =>
                    option.setName("word")
                        .setDescription("The word to remove from the filter.")
                        .setAutocomplete(true)
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
    if (!intr.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageNicknames)) return intr.reply({ content: "I need the \"Manage Nicknames\" permission in order to filter (nick)names!", ephemeral: true });

    const word = intr.options.getString("word", false);
    const replacement = intr.options.getString("replacement", false);

    switch (intr.options.getSubcommand()) {
        case "add": {
            if (guildSettings.badNames.includes(word.toLowerCase())) return intr.reply({ content: "That name is already in the name filter.", ephemeral: true });

            replacement ? guildSettings.badNames.push([word.toLowerCase(), replacement]) : guildSettings.badNames.push([word.toLowerCase()]);
            client.guildSettings.set(intr.guild.id, guildSettings);
            client.regenNameRegex(intr.guild.id);
            await intr.reply(`Successfully added \`${word}\` to the name filter.`);

            const badNames = client.badNames.get(intr.guild.id);

            intr.guild.members.cache.forEach(async member => {
                if (!member.manageable) return;
                badNames.forEach(name => {
                    if (member.displayName.match(name[0])) {
                        if (name[1]) member.setNickname(name[1], "Name filter");
                        else {
                            if (member.displayName.replace(name[0], "").trim().length === 0 && member.user.username.match(name[0])) member.setNickname("unnamed", "Name filter");
                            else if (member.displayName.replace(name[0], "").trim().length === 0) member.setNickname("", "Name filter");
                            else member.setNickname(member.displayName.replace(name[0], ""), "Name filter");
                        }
                    }
                });
            });

            break;
        }
        case "remove": {
            if (guildSettings.badNames.filter(name => name[0] === word.toLowerCase()).length === 0) return intr.reply({ content: "Name not found in filter.", ephemeral: true });

            guildSettings.badNames = guildSettings.badNames.filter(name => name[0] !== word.toLowerCase());
            client.guildSettings.set(intr.guild.id, guildSettings);
            client.regenNameRegex(intr.guild.id);

            intr.reply(`Successfully removed \`${word}\` from the name filter.`);
            break;
        }
        case "show": {
            let final = "";

            guildSettings.badNames.forEach(word => final += `${word[0]}${word.length > 1 ? ` → ${word[1]}` : ""}\n`);

            intr.reply({ content: `Name filter:\n\`\`\`${final.length === 0 ? "None" : final}\`\`\``, ephemeral: true });
            break;
        }
    }
};

/**
 * @param {Client} client 
 * @param {AutocompleteInteraction} intr 
 * @param {import("../types").Settings} guildSettings
 */
exports.autocomplete = async (client, intr, guildSettings) => {
    intr.respond(guildSettings.badNames.map(v => v[0].toLowerCase()).filter(v => v.startsWith(intr.options.getFocused().toLowerCase())).map(v => ({ name: v, value: v })));
};