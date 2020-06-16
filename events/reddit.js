const { Client, MessageEmbed } = require("discord.js"); // eslint-disable-line no-unused-vars

const snoostream = require("snoostream")({
    userAgent: "nodejs:rgrunt:v1.0 (by /u/IntriguingTiles)",
    clientId: process.env.REDDIT_ID,
    clientSecret: process.env.REDDIT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});

const colors = require("../utils/colors.js");
const truncate = require("../utils/truncate.js");
let watchedSubs = [];
let streams = [];

/** @type {Client} */
let client;

/**
 * @param {Client} c
 */
exports.register = c => {
    client = c;

    client.guildSettings.forEach(settings => {
        watchedSubs = watchedSubs.concat(settings.subreddits);
    });

    // now get rid of the duplicates
    watchedSubs = watchedSubs.filter((sub, index) => watchedSubs.indexOf(sub) === index);

    // now add stream listeners for all the watched subs
    watchedSubs.forEach(sub => streams.push(snoostream.submissionStream(sub, { rate: 5000 }))); // poll every 5 seconds
    streams.forEach(stream => stream.on("post", onNewPost));
};

exports.deregister = () => {
    streams.forEach(stream => stream.removeListener("post", onNewPost)); // no clue if this is necessary, but better safe than sorry
    watchedSubs = [];
    streams = [];
};

async function onNewPost(post) {
    const embed = new MessageEmbed();
    embed.setAuthor(`New ${determineType(post.post_hint, post.url)}post on /r/${post.subreddit.display_name}`, "https://cdn.discordapp.com/attachments/408346940234006559/722275130276970546/reddit.png", `https://www.reddit.com${post.permalink}`);
    embed.setTitle(post.title);
    embed.setURL(post.url);
    embed.addField("Post Author", `/u/${post.author.name}`);
    embed.setColor(colors.RED);
    if (determineType(post.post_hist, post.url) === "image ") embed.setImage(post.url);
    embed.setTimestamp();

    if (post.is_self) embed.setDescription(truncate(post.selftext, 1500, 15));

    client.guildSettings.forEach(settings => {
        if (settings.subreddits.includes(post.subreddit.display_name.toLowerCase()) && settings.subredditChannel && client.channels.cache.has(settings.subredditChannel)) client.channels.cache.get(settings.subredditChannel).send(embed);
    });
}

/**
 * @param {string} type 
 * @param {string} url
 */
function determineType(type, url) {
    if (type && type.includes("video")) return "video ";
    if (type && type.includes("image")) return "image ";
    if (url.startsWith("https://i.redd.it")) return "image ";
    if (!url.startsWith("https://www.reddit.com")) return "link ";
    return "";
}

setInterval(() => {
    if (client.updateWatchedSubreddits) {
        // this couldn't possibly go wrong :)
        exports.deregister();
        exports.register(client);
        client.updateWatchedSubreddits = false;
    }
}, 5000);