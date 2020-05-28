require("dotenv").config();
const Discord = require("discord.js");
const Enmap = require("enmap");
const express = require("express");
const fs = require("fs");

const server = express();

const client = new Discord.Client({ disableMentions: "everyone", partials: ["MESSAGE"] });
client.guildSettings = new Enmap({ name: "guildSettings", autoFetch: true, fetchAll: false });
client.login(process.env.TOKEN);

const defaultSettings = {
    prefix: "r!",
    logChannel: null,
    verifyRole: null,
    jailRole: null,
    modRoles: [],
    logFlags: 0
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
    client.user.setActivity(`${defaultSettings.prefix}help`);

    client.guilds.cache.forEach(guild => {
        client.guildSettings.ensure(guild.id, defaultSettings);
    });
});

client.on("guildCreate", async guild => {
    client.guildSettings.set(guild.id, defaultSettings);
});

client.on("guildDelete", async guild => {
    client.guildSettings.delete(guild.id);
});

client.on("message", async msg => {
    if (msg.author.bot) return;
    if (msg.channel.type === "dm") return;
    if (!msg.channel.permissionsFor(client.user).has("SEND_MESSAGES")) return;

    const cmd = msg.content.slice(defaultSettings.prefix.length).split(" ")[0];
    
    if (!(cmd in client.commands)) return;

    if (client.commands[cmd].help && client.commands[cmd].help.requireAdmin) {
        if (!msg.member.hasPermission("MANAGE_GUILD") && msg.author.id !== "221017760111656961") return;
    }

    const guildSettings = client.guildSettings.ensure(msg.guild.id, defaultSettings);

    if (client.commands[cmd].help && client.commands[cmd].help) {
        if (!msg.member.hasPermission("MANAGE_GUILD") && msg.author.id !== "221017760111656961") {
            let hasPerms = false;

            guildSettings.modRoles.forEach(role => {
                if (msg.member.roles.cache.has(role)) hasPerms = true;
            });

            if (!hasPerms) return;
        }
    }

    const args = msg.content.split(" ").slice(1);

    client.commands[cmd].run(client, msg, args, guildSettings);
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
        const cmd = commands[i];
        if (cmd.match(/\.js$/)) {
            delete require.cache[require.resolve(`./commands/${cmd}`)];
            client.commands[cmd.slice(0, -3)] = require(`./commands/${cmd}`);
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

// very ugly express inline html stuff below
server.get("/", (req, res) => {
    let final = `<h1>RGrunt Stats</h1>
<p>Watching ${client.guilds.cache.size} servers with ${client.users.cache.size} users.<br>
<h2>Server List</h2>\n<pre>`;
    client.guilds.cache.sort((a, b) => {
        return b.memberCount - a.memberCount;
    }).forEach(guild => final += `${guild.name} owned by ${guild.owner.user.tag} (${guild.memberCount} members)\n`);
    res.send(final + "</pre>");
});

server.listen(1340, () => console.log("Started web server on port 1340!"));