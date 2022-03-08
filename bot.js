require("dotenv").config();
const Discord = require("discord.js");
const Enmap = require("enmap");
const fs = require("fs");
const RE2 = require("re2");
const lookalikes = require("./utils/lookalikes.js");

const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_BANS,
        Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_PRESENCES
    ],
    partials: ["MESSAGE"]
});

client.guildSettings = new Enmap({ name: "guildSettings", autoFetch: true, fetchAll: true, ensureProps: true });
client.badWords = new Discord.Collection();
client.badNames = new Discord.Collection();
client.login(process.env.TOKEN);

const defaultSettings = {
    prefix: "!",
    logChannel: null,
    verifyRole: null,
    jailRole: null,
    modRoles: [],
    logFlags: 0,
    badWords: [],
    badNames: [],
    antiSpam: false,
    jailedUsers: [],
    levelSystem: false,
    levelRoles: [],
    levels: [],
    warns: []
};

process.on("unhandledRejection", err => {
    console.error(`Unhandled promise rejection!\n${err.stack}`);
    if (client.readyTimestamp) client.users.cache.get("221017760111656961").send(err.stack);
});

client.on("error", console.error);
client.on("warn", console.warn);

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.loadCommands();
    client.loadEvents();
    client.user.setActivity("with slash commands");

    client.guilds.cache.forEach(guild => {
        client.regenWordRegex(guild.id);
        client.regenNameRegex(guild.id);
    });
});

client.on("guildCreate", async guild => {
    client.guildSettings.set(guild.id, defaultSettings);
});

client.on("guildDelete", async guild => {
    client.guildSettings.delete(guild.id);
});

client.on("messageCreate", async msg => {
    if (msg.partial) return;
    if (msg.author.bot) return;
    if (msg.channel.type === "DM") return;
    if (!msg.channel.permissionsFor(client.user).has("SEND_MESSAGES")) return;

    const guildSettings = client.guildSettings.ensure(msg.guild.id, defaultSettings);
    if (!msg.content.startsWith(guildSettings.prefix)) return;
    const cmd = msg.content.slice(guildSettings.prefix.length).split(" ")[0];

    if (!(cmd in client.commands)) return;

    if (client.commands[cmd].requireAdmin) {
        if (!msg.member.permissions.has("MANAGE_GUILD") && msg.author.id !== "221017760111656961") return;
    }

    if (client.commands[cmd].requireMod) {
        if (!msg.member.permissions.has("MANAGE_GUILD") && msg.author.id !== "221017760111656961") {
            let hasPerms = false;

            guildSettings.modRoles.forEach(role => {
                if (msg.member.roles.cache.has(role)) hasPerms = true;
            });

            if (!hasPerms) return;
        }
    }

    if (cmd === "eval") {
        const args = msg.content.split(" ").slice(1);
        client.commands[cmd].run(client, msg, args, guildSettings);
    }
});

client.on("interactionCreate", async intr => {
    if (!intr.isCommand() && !intr.isContextMenu()) return;
    const cmd = intr.commandName;
    if (!(cmd in client.commands)) return;
    if (!intr.inGuild()) return;

    const guildSettings = client.guildSettings.ensure(intr.guild.id, defaultSettings);

    if (client.commands[cmd].requireAdmin) {
        if (!intr.memberPermissions.has("MANAGE_GUILD") && intr.user.id !== "221017760111656961")
            return intr.reply({ content: "You do not have permission to use this command.", ephemeral: true });
    }

    if (client.commands[cmd].requireMod) {
        if (!intr.memberPermissions.has("MANAGE_GUILD") && intr.user.id !== "221017760111656961") {
            let hasPerms = false;

            guildSettings.modRoles.forEach(role => {
                if (intr.member.roles.cache.has(role)) hasPerms = true;
            });

            if (!hasPerms) return intr.reply({ content: "You do not have permission to use this command.", ephemeral: true });
        }
    }

    client.commands[cmd].run(client, intr, guildSettings);
});

process.on("SIGINT", async () => {
    client.guildSettings.close();
    await client.destroy();
    process.exit(0);
});

process.on("message", async msg => {
    if (msg === "shutdown") {
        client.guildSettings.close();
        await client.destroy();
        process.exit(0);
    }
});

client.loadCommands = () => {
    const commands = fs.readdirSync("./commands/");
    client.commands = {};

    for (let i = 0; i < commands.length; i++) {
        let cmd = commands[i];
        if (cmd.match(/\.js$/)) {
            delete require.cache[require.resolve(`./commands/${cmd}`)];
            cmd = require(`./commands/${cmd}`);

            if (cmd.commands) {
                for (let j = 0; j < cmd.commands.length; j++) {
                    client.commands[cmd.commands[j].name] = cmd;

                    if (client.user.id !== "715364254383079455") {
                        client.guilds.cache.forEach(async guild => {
                            await client.application.commands.create(cmd.commands[j].toJSON(), guild.id);
                        });
                    } else {
                        client.application.commands.create(cmd.commands[j].toJSON());
                    }
                }
            } else {
                // eval is the only command without slash command support
                client.commands["eval"] = cmd;
            }
        }
    }
    console.log(`Loaded ${commands.length} commands!`);
};

client.loadEvents = () => {
    const events = fs.readdirSync("./events/");
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if (event.match(/\.js$/)) {
            delete require.cache[require.resolve(`./events/${event}`)];
            const theEvent = require(`./events/${event}`);
            theEvent.deregister(client);
            theEvent.register(client);
        }
    }
    console.log(`Loaded ${events.length} events!`);
};

client.regenWordRegex = guildID => {
    const guildSettings = client.guildSettings.ensure(guildID, defaultSettings);
    client.badWords.set(guildID, []);

    guildSettings.badWords.forEach(badWord => {
        // this gets a bit wacky since lookalikes might change in between bot restarts
        let regex = "";

        for (let i = 0; i < badWord.length; i++) {
            if (badWord.charAt(i) === "\\" || badWord.charAt(i) === "]" || badWord.charAt(i) === "-") continue;
            regex += `[${lookalikes[badWord.toLowerCase().charAt(i)] ? lookalikes[badWord.toLowerCase().charAt(i)] : badWord.charAt(i)}]`;
        }

        client.badWords.get(guildID).push(new RE2(regex, "iu"));
    });
};

client.regenNameRegex = guildID => {
    const guildSettings = client.guildSettings.ensure(guildID, defaultSettings);
    client.badNames.set(guildID, []);

    guildSettings.badNames.forEach(badName => {
        // this gets a bit wacky since lookalikes might change in between bot restarts
        let regex = "";

        for (let i = 0; i < badName[0].length; i++) {
            if (badName[0].charAt(i) === "\\" || badName[0].charAt(i) === "]" || badName[0].charAt(i) === "-") continue;

            if (badName[0].charAt(i) === "^" && i === 0) {
                regex += "^";
                continue;
            }

            if (badName[0].charAt(i) === "+" && i === badName[0].length - 1) {
                regex += "+";
                continue;
            }

            regex += `[${lookalikes[badName[0].toLowerCase().charAt(i)] ? lookalikes[badName[0].toLowerCase().charAt(i)] : badName[0].charAt(i)}]`;
        }

        client.badNames.get(guildID).push([new RE2(regex, "igu"), badName[1]]);
    });
};