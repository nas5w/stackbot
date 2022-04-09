import dotenv from "dotenv";
dotenv.config();
import fxparser from "fast-xml-parser";
import fetch from "node-fetch";
import fs from "fs";
import { Client, Intents } from "discord.js";

const SEEN_PATH = "./seen.json";
const seen = new Set(JSON.parse(fs.readFileSync(SEEN_PATH)));

const FEED_URL = `https://stackoverflow.com/feeds/tag/${process.env.TAG}`;
const parser = new fxparser.XMLParser();

async function run() {
  // Fetch StackOverflow feed
  const feed = await (await fetch(FEED_URL)).text();
  // Parse feed and keep most recent five
  const entries = parser
    .parse(feed)
    .feed.entry.map(({ title, id }) => ({ title, id }))
    .slice(0, 4);
  // Keep entries that haven't been seen before
  const newEntries = entries.filter((entry) => !seen.has(entry.id));
  if (newEntries.length === 0) {
    console.log("No new posts");
    return;
  }

  // At this point we have new posts, send them to the channel
  const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
  client.login(process.env.TOKEN);
  client.on("ready", async () => {
    const channel = client.channels.cache.get(process.env.CHANNEL);
    // Array of promises sending to channel
    const sending = newEntries.map(({ id, title }) => {
      const text = `${title} - ${id}`;
      console.log(`Sending: ${text}`);
      return channel.send(text);
    });
    await Promise.all(sending);
    // Success, save the new entries
    const newSeen = [...seen, ...newEntries.map(({ id }) => id)];
    fs.writeFileSync(SEEN_PATH, JSON.stringify(newSeen), "utf-8");
    // We're done here
    process.exit(0);
  });
}

run();
