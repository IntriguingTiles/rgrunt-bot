const { Client, MessageEmbed } = require("discord.js"); // eslint-disable-line no-unused-vars

const snoostream = require("snoostream")({
    userAgent: "nodejs:rgrunt:v1.0 (by /u/IntriguingTiles)",
    clientId: process.env.REDDIT_ID,
    clientSecret: process.env.REDDIT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});

const allStream = snoostream.submissionStream("all");
const colors = require("../utils/colors.js");
let watchedSubs = [];

/** @type {Client} */
let client;

/**
 * @param {Client} c
 */
exports.register = c => {
    client = c;

    client.guildSettings.forEach(settings => {
        // while this may cause duplicates, it really doesn't matter for us
        watchedSubs = watchedSubs.concat(settings.subreddits);
    });

    allStream.on("post", onNewPost);
};

exports.deregister = () => {
    allStream.removeListener("post", onNewPost);
    watchedSubs = [];
};

async function onNewPost(post) {
    if (watchedSubs.includes(post.subreddit.display_name.toLowerCase())) {
        const embed = new MessageEmbed();
        embed.setAuthor(`New ${determineType(post.post_hint)} post on /r/${post.subreddit.display_name}`, "https://cdn.discordapp.com/attachments/408346940234006559/722275130276970546/reddit.png", `https://www.reddit.com${post.permalink}`);
        embed.setTitle(post.title);
        embed.setURL(post.url);
        embed.addField("Post Author", `/u/${post.author.name}`);
        embed.setColor(colors.RED);

        if (determineType(post.post_hint) === "image") embed.setImage(post.url);
        else if (post.is_self) embed.setDescription(post.selftext);

        client.guildSettings.forEach(settings => {
            if (settings.subreddits.includes(post.subreddit.display_name.toLowerCase()) && settings.subredditChannel) client.channels.cache.get(settings.subredditChannel).send(embed);
        });
    }
}

/**
 * @param {string} type 
 */
function determineType(type) {
    if (type && type.includes("video")) return "video";
    if (type && type.includes("image")) return "image";
    else return "text";
}

setInterval(() => {
    watchedSubs = [];
    client.guildSettings.forEach(settings => {
        // while this may cause duplicates, it really doesn't matter for us
        watchedSubs = watchedSubs.concat(settings.subreddits);
    });
}, 60000);
