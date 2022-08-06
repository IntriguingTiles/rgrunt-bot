const { ChatInputCommandInteraction, PermissionsBitField } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("roleconfig")
        .setDescription("Manage the various roles that RGrunt keeps track of.")
        .addSubcommandGroup(cmdGroup =>
            cmdGroup.setName("verify")
                .setDescription("Manage the role used for the verify command.")
                .addSubcommand(cmd =>
                    cmd.setName("set")
                        .setDescription("Sets the verified role.")
                        .addRoleOption(option =>
                            option.setName("role")
                                .setDescription("The role to use as the verified role.")
                                .setRequired(true)))
                .addSubcommand(cmd =>
                    cmd.setName("show")
                        .setDescription("Shows the verified role."))
                .addSubcommand(cmd =>
                    cmd.setName("clear")
                        .setDescription("Clears the verified role.")))
        .addSubcommandGroup(cmdGroup =>
            cmdGroup.setName("jail")
                .setDescription("Manage the role used for the jail command.")
                .addSubcommand(cmd =>
                    cmd.setName("set")
                        .setDescription("Sets the jailed role.")
                        .addRoleOption(option =>
                            option.setName("role")
                                .setDescription("The role to use as the jailed role.")
                                .setRequired(true)))
                .addSubcommand(cmd =>
                    cmd.setName("show")
                        .setDescription("Shows the jailed role."))
                .addSubcommand(cmd =>
                    cmd.setName("clear")
                        .setDescription("Clears the jailed role.")))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setDMPermission(false)
];

/**
 * @param {import("../types").ClientExt} client
 * @param {ChatInputCommandInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, intr, guildSettings) => {
    switch (intr.options.getSubcommandGroup()) {
        case "verify":
            switch (intr.options.getSubcommand()) {
                case "clear":
                    guildSettings.verifyRole = null;
                    client.guildSettings.set(intr.guild.id, guildSettings);
                    intr.reply("Successfully cleared the verified role.");
                    break;
                case "set": {
                    const role = intr.options.getRole("role");
                    guildSettings.verifyRole = role.id;
                    client.guildSettings.set(intr.guild.id, guildSettings);
                    intr.reply(`Successfully set \`${role.name}\` as the verified role.`);
                    break;
                }
                case "show":
                    intr.reply({ content: guildSettings.verifyRole ? `<@&${guildSettings.verifyRole}>` : "None", ephemeral: true });
                    break;
            }
            break;
        case "jail":
            switch (intr.options.getSubcommand()) {
                case "clear":
                    guildSettings.jailRole = null;
                    client.guildSettings.set(intr.guild.id, guildSettings);
                    intr.reply({ content: "Successfully cleared the jailed role.", ephemeral: true });
                    break;
                case "set": {
                    const role = intr.options.getRole("role");
                    guildSettings.jailRole = role.id;
                    client.guildSettings.set(intr.guild.id, guildSettings);
                    intr.reply(`Successfully set \`${role.name}\` as the jailed role.`);
                    break;
                }
                case "show":
                    intr.reply({ content: guildSettings.jailRole ? `<@&${guildSettings.jailRole}>` : "None", ephemeral: true });
                    break;
            }
            break;
    }
};