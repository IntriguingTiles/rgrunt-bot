const { ChatInputCommandInteraction, PermissionsBitField } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");
const fetch = require("node-fetch").default;

exports.commands = [
    new SlashCommandBuilder()
        .setName("levelconfig")
        .setDescription("Configures the level system.")
        .addSubcommand(cmd =>
            cmd.setName("enable")
                .setDescription("Enables the level system."))
        .addSubcommand(cmd =>
            cmd.setName("disable")
                .setDescription("Disables the level system."))
        .addSubcommand(cmd =>
            cmd.setName("import")
                .setDescription("Imports levels and role rewards from MEE6."))
        .addSubcommand(cmd =>
            cmd.setName("show")
                .setDescription("View the current level configuration."))
        .addSubcommandGroup(cmdGroup =>
            cmdGroup.setName("rewards")
                .setDescription("Configure the roles to be given as level rewards.")
                .addSubcommand(cmd =>
                    cmd.setName("add")
                        .setDescription("Adds a role to be given at the specified level.")
                        .addIntegerOption(option =>
                            option.setName("level")
                                .setDescription("The level at which the role will be given.")
                                .setMinValue(1)
                                .setRequired(true))
                        .addRoleOption(option =>
                            option.setName("role")
                                .setDescription("The role to give.")
                                .setRequired(true)))
                .addSubcommand(cmd =>
                    cmd.setName("remove")
                        .setDescription("Removes a role from the rewards.")
                        .addRoleOption(option =>
                            option.setName("role")
                                .setDescription("The role to remove.")
                                .setRequired(true))))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setDMPermission(false)
];

/**
 * @param {import("../types").ClientExt} client
 * @param {ChatInputCommandInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, intr, guildSettings) => {
    switch (intr.options.getSubcommandGroup(false) ? intr.options.getSubcommandGroup() : intr.options.getSubcommand()) {
        case "enable":
            if (guildSettings.levelSystem) return intr.reply({ content: "The level system is already enabled.", ephemeral: true });
            guildSettings.levelSystem = true;
            client.guildSettings.set(intr.guild.id, guildSettings);
            intr.reply("Successfully enabled the level system.");
            break;
        case "disable":
            if (!guildSettings.levelSystem) return intr.reply({ content: "The level system is already disabled.", ephemeral: true });
            guildSettings.levelSystem = false;
            client.guildSettings.set(intr.guild.id, guildSettings);
            intr.reply("Successfully disabled the level system.");
            break;
        case "import": {
            let res = await fetch(`https://mee6.xyz/api/plugins/levels/leaderboard/${intr.guild.id}`);
            if (!res.ok) return intr.reply({ content: `Failed to import data. MEE6 said "${(await res.json()).error.message}".`, ephemeral: true });

            intr.reply("Importing...");

            // import rewards
            let json = await res.json();

            json.role_rewards.forEach(reward => {
                guildSettings.levelRoles.push({ id: reward.role.id, level: reward.rank });
            });

            // import player info
            for (let page = 0; ; page++) {
                res = await fetch(`https://mee6.xyz/api/plugins/levels/leaderboard/${intr.guild.id}?page=${page}&limit=1000`);

                if (res.status === 429) {
                    return intr.followUp("Sorry, RGrunt has been ratelimited by MEE6. Try importing again in an hour or so.");
                }

                json = await res.json();

                if (json.players.length === 0) break;

                json.players.forEach(player => {
                    guildSettings.levels.push({ id: player.id, xp: player.xp });
                });
            }

            client.guildSettings.set(intr.guild.id, guildSettings);
            intr.followUp("Successfully imported MEE6 data.");
            break;
        }
        case "rewards":
            switch (intr.options.getSubcommand()) {
                case "add": {
                    if (!intr.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) return intr.reply({ content: "I don't have permission to manage roles.", ephemeral: true });

                    const level = intr.options.getInteger("level");
                    const role = intr.options.getRole("role");
                    if (guildSettings.levelRoles.filter(l => l.id === role.id).length === 0) {
                        if (intr.guild.members.me.roles.highest.position >= role.position) {

                            guildSettings.levelRoles.push({ id: role.id, level: level });
                            intr.reply(`Successfully set ${role} as a reward for level ${level}.`);
                        } else {
                            intr.reply({ content: `${role} is above my highest role. Adjust my roles and try again.`, ephemeral: true });
                        }
                    } else {
                        intr.reply({ content: `Level ${guildSettings.levelRoles.filter(l => l.level)[0].level} already gives ${role} as a reward.`, ephemeral: true });
                    }
                    break;
                }
                case "remove": {
                    const role = intr.options.getRole("role");
                    if (guildSettings.levelRoles.filter(l => l.id === role.id).length !== 0) {
                        guildSettings.levelRoles = guildSettings.levelRoles.filter(l => l.id !== role.id);
                        intr.reply(`Sucessfully removed ${role} as a reward.`);
                    } else {
                        intr.reply({ content: `${role} isn't given by any level.`, ephemeral: true });
                    }
                    break;
                }
            }
            client.guildSettings.set(intr.guild.id, guildSettings);
            break;
        case "show": {
            const roles = guildSettings.levelRoles.slice();
            roles.sort((a, b) => b.level - a.level);
            intr.reply({
                content: `Currently **${guildSettings.levelSystem ? "enabled" : "disabled"}**\n
Rewards:\n${roles.length === 0 ? "None" : roles.map(r => `Level ${r.level}: <@&${r.id}>`).join("\n")}`, ephemeral: true
            });
        }
    }
};