const { Client, CommandInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("roleconfig")
        .setDescription("Manage the various roles that RGrunt keeps track of.")
        .addSubcommandGroup(cmdGroup =>
            cmdGroup.setName("mods")
                .setDescription("Manage the roles that RGrunt considers to have moderator privileges.")
                .addSubcommand(cmd =>
                    cmd.setName("add")
                        .setDescription("Adds a role to the moderators list.")
                        .addRoleOption(option =>
                            option.setName("role")
                                .setDescription("The role to add.")
                                .setRequired(true)))
                .addSubcommand(cmd =>
                    cmd.setName("remove")
                        .setDescription("Removes a role from the moderators list.")
                        .addRoleOption(option =>
                            option.setName("role")
                                .setDescription("The role to remove.")
                                .setRequired(true)))
                .addSubcommand(cmd =>
                    cmd.setName("show")
                        .setDescription("List all moderator roles.")))
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
];

exports.requireAdmin = true;

/**
 * @param {Client} client
 * @param {CommandInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, intr, guildSettings) => {
    switch (intr.options.getSubcommandGroup()) {
        case "mods":
            switch (intr.options.getSubcommand()) {
                case "add": {
                    const role = intr.options.getRole("role");
                    if (guildSettings.modRoles.includes(role.id)) return intr.reply({ content: "Role is already in the moderators list.", ephemeral: true });

                    guildSettings.modRoles.push(role.id);
                    client.guildSettings.set(intr.guild.id, guildSettings);

                    intr.reply(`Successfully added \`${role.name}\` to the moderator roles list.`);
                    break;
                }
                case "remove": {
                    const role = intr.options.getRole("role");
                    if (!guildSettings.modRoles.includes(role.id)) return intr.reply({ content: "Role is not part of the moderators list.", ephemeral: true });

                    guildSettings.modRoles = guildSettings.modRoles.filter(val => val !== role.id);
                    client.guildSettings.set(intr.guild.id, guildSettings);

                    intr.reply(`Successfully removed \`${role.name}\` from the moderator roles list.`);
                    break;
                }
                case "show": {
                    let final = "```";

                    guildSettings.modRoles.forEach(role => {
                        if (!intr.guild.roles.cache.has(role)) {
                            guildSettings.modRoles = guildSettings.modRoles.filter(val => val !== role);
                            client.guildSettings.set(intr.guild.id, guildSettings);
                            return;
                        }

                        final += `${intr.guild.roles.cache.get(role).name}\n`;
                    });

                    if (guildSettings.modRoles.length === 0) final += "None\n";

                    final += "```";
                    intr.reply({ content: final, ephemeral: true });
                    break;
                }
            }
            break;
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