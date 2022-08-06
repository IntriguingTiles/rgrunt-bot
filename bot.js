require("dotenv").config();
const Discord = require("discord.js");
const Enmap = require("enmap");
const fs = require("fs");
const RE2 = require("re2");
const lookalikes = require("./utils/lookalikes.js");

/** @type {import("./types").ClientExt} */
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildBans,
        Discord.GatewayIntentBits.GuildEmojisAndStickers,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildPresences,
        Discord.GatewayIntentBits.MessageContent
    ],
    partials: [Discord.Partials.Message]
});

client.guildSettings = new Enmap({ name: "guildSettings", autoFetch: true, fetchAll: true, ensureProps: true });
client.badWords = new Discord.Collection();
client.badNames = new Discord.Collection();
client.login(process.env.TOKEN);

const defaultSettings = {
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
    if (client.readyTimestamp && client.user.id === "715364254383079455") client.users.cache.get("221017760111656961").send(err.stack);
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
    if (!msg.content.startsWith("!")) return;

    const guildSettings = client.guildSettings.ensure(msg.guild.id, defaultSettings);
    const cmd = msg.content.slice(1).split(" ")[0];

    if (!(cmd in client.commands)) return;

    if (cmd === "eval") {
        const args = msg.content.split(" ").slice(1);
        client.commands[cmd].run(client, msg, args, guildSettings);
    }
});

client.on("interactionCreate", async intr => {
    if (!intr.isChatInputCommand() && !intr.isContextMenuCommand() && !intr.isButton()) return;
    const cmd = intr.isButton() ? intr.message.interaction.commandName : intr.commandName;
    if (!(cmd in client.commands)) return;
    if (!intr.inGuild()) return intr.reply({ content: "Sorry, RGrunt commands cannot be used in direct messages at this time.", ephemeral: true });

    const guildSettings = client.guildSettings.ensure(intr.guild.id, defaultSettings);

    if (intr.isButton()) {
        client.commands[cmd].buttonPress(client, intr, guildSettings);
    } else {
        client.commands[cmd].run(client, intr, guildSettings);
    }
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
        /** @type {import("./types").Command} */
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