const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "namefilter",
    usage: "namefilter <add|remove|list> [args]",
    info: "Sets the (nick)name filter"
};

exports.requireAdmin = true;

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args, guildSettings) => {
    if (args.length === 0) return msg.channel.send(`${guildSettings.prefix}${exports.help.usage}`, { code: "" });
    if (!msg.guild.me.hasPermission("MANAGE_NICKNAMES")) return msg.channel.send("I need the \"Manage Nicknames\" permission in order to filter (nick)names!");

    switch (args[0]) {
        case "add": {
            if (args.length < 2) return msg.channel.send(`${guildSettings.prefix}namefilter add <word> [replacement]`, { code: "" });
            if (guildSettings.badNames.includes(args[1].toLowerCase())) return msg.channel.send("That name is already in the name filter.");

            args.length > 2 ? guildSettings.badNames.push([args[1].toLowerCase(), args.slice(2).join(" ")]) : guildSettings.badNames.push([args[1].toLowerCase()]);
            client.guildSettings.set(msg.guild.id, guildSettings);
            client.regenNameRegex(msg.guild.id);
            msg.channel.send(`Successfully added \`${args[1]}\` to the name filter.`);

            const badNames = client.badNames.get(msg.guild.id);

            msg.guild.members.cache.forEach(async member => {
                if (!member.manageable) return;
                badNames.forEach(name => {
                    if (member.displayName.match(name[0])) {
                        if (name[1]) member.setNickname(name[1]);
                        else {
                            if (member.displayName.replace(name[0], "").trim().length === 0 && member.user.username.match(name[0])) member.setNickname("unnamed");
                            else if (member.displayName.replace(name[0], "").trim().length === 0) member.setNickname("");
                            else member.setNickname(member.displayName.replace(name[0], ""));
                        }
                    }
                });
            });

            break;
        }
        case "remove": {
            if (args.length !== 2) return msg.channel.send(`${guildSettings.prefix}namefilter remove <word>`, { code: "" });

            if (guildSettings.badNames.filter(name => name[0] === args[1].toLowerCase()).length === 0) return msg.channel.send("Name not found in filter.");

            guildSettings.badNames = guildSettings.badNames.filter(name => name[0] !== args[1].toLowerCase());
            client.guildSettings.set(msg.guild.id, guildSettings);
            client.regenNameRegex(msg.guild.id);

            msg.channel.send(`Successfully removed \`${args[1]}\` from the name filter.`);
            break;
        }
        case "list": {
            let final = "";

            guildSettings.badNames.forEach(word => final += `${word[0]}${word.length > 1 ? ` → ${word[1]}` : ""}\n`);

            msg.channel.send(`Name filter:\n\`\`\`${final.length === 0 ? "None" : final}\`\`\``);
            break;
        }
    }
};