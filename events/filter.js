const { Message, GuildMember, PermissionsBitField, ChannelType } = require("discord.js"); // eslint-disable-line no-unused-vars
require("re2");

/** @type {import("../types").ClientExt} */
let client;

/**
 * @param {import("../types").ClientExt} c
 */
exports.register = c => {
    client = c;
    c.on("messageCreate", messageCreate);
    c.on("messageUpdate", messageUpdate);
    c.on("guildMemberAdd", guildMemberAdd);
    c.on("guildMemberUpdate", guildMemberUpdate);
};

/**
 * @param {import("../types").ClientExt} c
 */
exports.deregister = c => {
    c.removeListener("messageCreate", messageCreate);
    c.removeListener("messageUpdate", messageUpdate);
    c.removeListener("guildMemberAdd", guildMemberAdd);
    c.removeListener("guildMemberUpdate", guildMemberUpdate);
};

/**
 * @param {Message} msg 
 */
async function messageCreate(msg) {
    if (msg.partial) return;
    if (msg.channel.type === ChannelType.DM) return;
    if (msg.author.bot) return;
    if (msg.content.length === 0) return;
    if (!msg.deletable) return;
    if (msg.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return;
    if (!client.badWords.has(msg.guild.id)) return;

    const badWords = client.badWords.get(msg.guild.id);

    badWords.forEach(word => {
        if (msg.content.replace(/[\u200e\u200b*_~]/g, "").match(word)) {
            msg.delete().catch(() => { });
            msg.badWords = true;
        }
    });
}

/**
 * @param {Message} oldMsg 
 * @param {Message} newMsg 
 */
async function messageUpdate(oldMsg, newMsg) {
    if (newMsg.partial) return;
    if (newMsg.channel.type === ChannelType.DM) return;
    if (newMsg.author.bot) return;
    if (newMsg.content.length === 0) return;
    if (!newMsg.deletable) return;
    if (newMsg.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return;
    if (!client.badWords.has(newMsg.guild.id)) return;

    const badWords = client.badWords.get(newMsg.guild.id);

    badWords.forEach(word => {
        if (newMsg.content.replace(/[\u200e\u200b*_~]/g, "").match(word)) {
            newMsg.delete().catch(() => { });
            newMsg.badWords = true;
        }
    });
}

/**
 * @param {GuildMember} member
 */
async function guildMemberAdd(member) {
    nicknameCheck(member);
}

/**
 * @param {GuildMember} oldMember 
 * @param {GuildMember} newMember 
 */
async function guildMemberUpdate(oldMember, newMember) {
    nicknameCheck(newMember);
}

/**
 * @param {GuildMember} member 
 */
async function nicknameCheck(member) {
    if (!member.manageable) return;
    if (!client.badNames.has(member.guild.id)) return;

    const badNames = client.badNames.get(member.guild.id);

    badNames.forEach(name => {
        if (member.displayName.match(name[0])) {
            if (name[1]) member.setNickname(name[1]);
            else {
                let finalName = member.displayName.replace(name[0], "").trim();

                while (finalName.match(name[0])) {
                    finalName = finalName.replace(name[0], "").trim();
                }

                if (finalName.trim().length === 0) {
                    if (member.user.username.match(name[0])) member.setNickname("unnamed", "Name filter");
                    else member.setNickname("", "Name filter");
                    return;
                }

                member.setNickname(finalName, "Name filter");
            }
        }
    });
}