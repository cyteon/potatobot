import OpenAI from "openai";
import Guild from "../models/Guild.js";
import User from "../models/User.js";
import AiConvo from "../models/AiConvo.js";
import Stats from "../models/Stats.js";
import GlobalUser from "../models/GlobalUser.js";
import { LEVELS } from "../utils/levels.js";

const FILTERS = [
  { old: "@everyone",          new: "@\u200beveryone" },
  { old: "@here",              new: "@\u200bhere" },
  { old: "<@&",                new: "<@&\u200b" },
  { old: "discord.gg",         new: "[filtered]" },
  { old: "discord.com/invite", new: "[filtered]" },
];

const DEFAULT_SYSTEM_PROMPT =
  "You are a discord user, you are allowed to have opinions, also controversial ones, send a reply in max 500 characters.";

const MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.2-11b-text-preview",
  "llama-3.1-8b-instant",
];

async function handleAiChannel(message, client) {
  if (message.content.startsWith("-")) return;

  const userData = await GlobalUser.findOne({ id: message.author.id });

  if (userData?.blacklisted) {
    return message.reply(`**you're blacklisted from using the bot :c reason: ${userData.blacklist_reason}**`);
  }

  if (userData?.ai_ignore) {
    return message.reply(`**the AI is ignoring you :c reason: ${userData.ai_ignore_reason}**`);
  }

  const guildData = await Guild.findOne({ id: message.guild.id });

  let apiKey;
  if (guildData?.groq_api_key && guildData.groq_api_key !== "NONE") {
    apiKey = guildData.groq_api_key;
  } else if (guildData?.ai_access) {
    apiKey = process.env.GROQ_API_KEY;
  } else {
    return message.reply("this server doesn't have AI access :c set your own groq api key with `/groq-api-key` or ask an admin!");
  }

  const groqClient = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  let convo = await AiConvo.findOne({ isChannel: true, id: message.channelId });

  if (!convo) {
    convo = new AiConvo({
      isChannel: true,
      id: message.channelId,
      messageArray: [],
      expiresAt: Math.floor(Date.now() / 1000) + 604800,
    });
  }

  convo.messageArray.push({ role: "user", content: `${message.author.username}: ${message.content}` });

  const systemPrompt =
    guildData?.system_prompt && guildData.system_prompt !== "NONE"
      ? guildData.system_prompt
      : DEFAULT_SYSTEM_PROMPT;

  const messages = [
    ...convo.messageArray.map((m) => ({ role: m.role, content: m.content })),
    { role: "system", content: systemPrompt },
  ];

  let aiResponse = "";

  message.channel.sendTyping().catch(() => {});

  for (const model of MODELS) {
    try {
      const res = await groqClient.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
      });
      aiResponse = res.choices[0].message.content;
      break;
    } catch (e) {
      console.error(e);
      aiResponse = "uh oh, the AI broke :c try again maybe?";
    }
  }

  convo.messageArray.push({ role: "assistant", content: aiResponse });

  if (convo.messageArray.length >= 24) {
    convo.messageArray = convo.messageArray.slice(2);
  } else {
    convo.expiresAt = Math.floor(Date.now() / 1000) + 604800;
  }

  await convo.save();

  for (const filter of FILTERS) {
    aiResponse = aiResponse.replaceAll(filter.old, filter.new);
  }

  Stats.findOneAndUpdate({}, { $inc: { ai_requests: 1 } }, { upsert: true }).exec();

  if (aiResponse.length > 2000) {
    const file = Buffer.from(aiResponse, "utf-8");
    return message.reply({
      content: "woah that's a lot of text :O here's a file instead",
      files: [{ attachment: file, name: "ai-response.txt" }],
    });
  }

  await message.reply(aiResponse);
}

export default {
  name: "messageCreate",
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    client.aiChannels ??= [];
    if (client.aiChannels.includes(message.channelId)) {
      return handleAiChannel(message, client);
    }

    const data = await User.findOne({
      id: message.author.id,
      guild_id: message.guild.id,
    });

    if (!data) {
      await User.create({
        id: message.author.id,
        guild_id: message.guild.id,
        xp: 0,
        level: 0,
      });
      return;
    }

    const xpToAdd = Math.floor(Math.random() * 3) + 1;
    data.xp += xpToAdd;

    if (data.xp >= LEVELS[data.level + 1]) {
      data.xp = 0;
      data.level += 1;

      const guildData = await Guild.findOne({ id: message.guild.id });

      if (
        guildData &&
        guildData.level_roles &&
        guildData.level_roles.get(data.level.toString())
      ) {
        const roleId = guildData.level_roles.get(data.level.toString());
        const role = message.guild.roles.cache.get(roleId);

        if (role) {
          const member = message.guild.members.cache.get(message.author.id);

          if (member && !member.roles.cache.has(roleId)) {
            try {
              await member.roles.add(role);
              console.log(`Added role '${role.name}' to ${message.author.tag}`);
            } catch (error) {
              console.error(
                `Failed to add role '${role.name}' to ${message.author.tag}:`,
                error,
              );
            }
          }
        }
      }

      message.reply({
        content: `:tada: Congratulations ${message.author}, you leveled up to level **${data.level}**!`,
      });
    }

    await data.save().catch(console.error);
  },
};
