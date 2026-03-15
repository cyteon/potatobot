import { SlashCommandBuilder } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import OpenAI from "openai";
import Guild from "../../models/Guild.js";
import AiChannels from "../../models/AiChannels.js";

const data = new SlashCommandBuilder()
  .setName("set_ai_channel")
  .setDescription("Set the current channel as an AI channel")
  .setIntegrationTypes(0)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

const execute = async function (interaction) {
  await interaction.deferReply();

  const guildData = await Guild.findOne({ id: interaction.guild.id });

  let apiKey;
  if (guildData?.groq_api_key && guildData.groq_api_key !== "NONE") {
    apiKey = guildData.groq_api_key;
  } else if (guildData?.ai_access) {
    apiKey = process.env.GROQ_API_KEY;
  } else {
    return interaction.editReply(
      "this server doesn't have AI access :c set your own groq api key with `/groq-api-key` first!",
    );
  }

  const groqClient = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  try {
    const res = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Hello!" }],
    });

    const reply = res.choices[0].message.content;

    interaction.client.aiChannels ??= [];
    interaction.client.aiChannels.push(interaction.channelId);

    await AiChannels.findOneAndUpdate(
      { listOfChannels: true },
      { $addToSet: { ai_channels: interaction.channelId } },
      { upsert: true },
    );

    try {
      await interaction.channel.setRateLimitPerUser(5);
    } catch (_) {}

    await interaction.editReply(`channel set as AI channel! :D\n\n${reply}`);
  } catch (e) {
    await interaction.editReply(
      "uh oh, couldn't connect to the AI :c is the API key valid?",
    );

    console.error(e);
  }
};

export default { data, execute };
