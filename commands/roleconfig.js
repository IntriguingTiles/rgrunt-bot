const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "roleconfig",
    usage: "roleconfig <mods|verify|jail> <args>",
    info: "Manage the moderator roles, the role used for the verify command, and the role used for the jail command"
};

exports.requireAdmin = true;

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args, guildSettings) => {
    if (args.length === 0) return msg.channel.send(`Usage: ${guildSettings.prefix}${exports.help.usage}`, { code: "" });

    switch (args[0]) {
        case "mods":
            switch (args[1]) {
                case "add": {
                    if (args.length !== 3) return msg.channel.send(`Usage: ${guildSettings.prefix}roleconfig mods add <@mention or id>`, { code: "" });

                    const role = args[2].match(/[0-9]+/) ? args[2].match(/[0-9]+/)[0] : null;

                    if (!msg.guild.roles.cache.has(role)) return msg.channel.send("Role not found.");
                    if (guildSettings.modRoles.includes(role)) return msg.channel.send("Role is already in the moderators list.");

                    guildSettings.modRoles.push(role);
                    client.guildSettings.set(msg.guild.id, guildSettings);

                    msg.channel.send(`Successfully added \`${msg.guild.roles.cache.get(role).name}\` to the moderator roles list.`);
                    break;
                }
                case "remove": {
                    if (args.length !== 3) return msg.channel.send(`Usage: ${guildSettings.prefix}roleconfig mods remove <@mention or id>`, { code: "" });

                    const role = args[2].match(/[0-9]+/) ? args[2].match(/[0-9]+/)[0] : null;

                    if (!msg.guild.roles.cache.has(role)) return msg.channel.send("Role not found.");
                    if (!guildSettings.modRoles.includes(role)) return msg.channel.send("Role is not part of the moderators list.");

                    guildSettings.modRoles = guildSettings.modRoles.filter(val => val !== role);
                    client.guildSettings.set(msg.guild.id, guildSettings);

                    msg.channel.send(`Successfully removed \`${msg.guild.roles.cache.get(role).name}\` from the moderator roles list.`);

                    break;
                }
                case "list": {
                    let final = "```";

                    guildSettings.modRoles.forEach(role => {
                        if (!msg.guild.roles.cache.has(role)) {
                            guildSettings.modRoles = guildSettings.modRoles.filter(val => val !== role);
                            client.guildSettings.set(msg.guild.id, guildSettings);
                            return;
                        }

                        final += `${msg.guild.roles.cache.get(role).name}\n`;
                    });

                    if (guildSettings.modRoles.length === 0) final += "None\n";

                    final += "```";
                    msg.channel.send(final);
                    break;
                }
                default:
                    return msg.channel.send(`Usage: ${guildSettings.prefix}roleconfig mods <add|remove|list>`, { code: "" });
            }
            break;
        case "verify":
            if (args.length !== 2) return msg.channel.send(`Usage: ${guildSettings.prefix}roleconfig verify <@mention or id|clear>`, { code: "" });

            if (args[1] === "clear") {
                guildSettings.verifyRole = null;
                client.guildSettings.set(msg.guild.id, guildSettings);
                msg.channel.send("Successfully cleared the verified role.");
            } else {
                const role = args[1].match(/[0-9]+/) ? args[1].match(/[0-9]+/)[0] : null;

                if (!msg.guild.roles.cache.has(role)) return msg.channel.send("Role not found.");

                guildSettings.verifyRole = role;
                client.guildSettings.set(msg.guild.id, guildSettings);
                msg.channel.send(`Successfully set \`${msg.guild.roles.cache.get(role).name}\` as the verified role.`);
            }
            break;
        case "jail":
            if (args.length !== 2) return msg.channel.send(`Usage: ${guildSettings.prefix}roleconfig jail <@mention or id|clear>`, { code: "" });

            if (args[1] === "clear") {
                guildSettings.jailRole = null;
                client.guildSettings.set(msg.guild.id, guildSettings);
                msg.channel.send("Successfully cleared the jailed role.");
            } else {
                const role = args[1].match(/[0-9]+/) ? args[1].match(/[0-9]+/)[0] : null;

                if (!msg.guild.roles.cache.has(role)) return msg.channel.send("Role not found.");

                guildSettings.jailRole = role;
                client.guildSettings.set(msg.guild.id, guildSettings);
                msg.channel.send(`Successfully set \`${msg.guild.roles.cache.get(role).name}\` as the jailed role.`);
            }
            break;
        default:
            return msg.channel.send(`Usage: ${guildSettings.prefix}${exports.help.usage}`, { code: "" });
    }
};