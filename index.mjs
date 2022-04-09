import dotenv from "dotenv";
dotenv.config();
import fxparser from "fast-xml-parser";
import fetch from "node-fetch";

import { Client, Intents } from "discord.js";

function msg(items) {
  const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

  client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    const channel = client.channels.cache.get(process.env.CHANNEL);
    const messages = await channel.messages.fetch({ limit: 100 });
    const messageSet = new Set(messages.map(({ content }) => content));

    // Send to channel if not in message set
    const sending = items.reduce((acc, item) => {
      if (!messageSet.has(item)) {
        acc.push(channel.send(item));
      }
      return acc;
    }, []);

    await Promise.all(sending);

    process.exit(0);
  });

  client.login(process.env.TOKEN);
}

const feedUrl = `https://stackoverflow.com/feeds/tag/${process.env.TAG}`;

fetch(feedUrl)
  .then((res) => res.text())
  .then((data) => {
    const parser = new fxparser.XMLParser();
    const content = parser.parse(data);
    const items = content.feed.entry
      .map(({ title, id }) => `${title} - ${id}`)
      .slice(0, 2);
    items.reverse();
    msg(items);
  });
