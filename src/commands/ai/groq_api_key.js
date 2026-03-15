import { SlashCommandBuilder } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import Guild from "../../models/Guild.js";

const data = new SlashCommandBuilder()
  .setName("groq_api_key")
  .setDescription("Set your server's Groq API key for the AI (run in a private channel!)")
  .setIntegrationTypes(0)
  .addStringOption((option) =>
    option
      .setName("key")
      .setDescription('Your Groq API key (use "NONE" to remove it)')
      .setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

const execute = async function (interaction) {
  const key = interaction.options.getString("key");

  try {
    await interaction.message?.delete();
  } catch (_) {}

  await Guild.findOneAndUpdate(
    { id: interaction.guild.id },
    { $set: { groq_api_key: key } },
    { upsert: true },
  );

  await interaction.reply({
    content: key === "NONE" ? "groq api key removed! :D" : "groq api key set! :D",
    ephemeral: true,
  });
};

export default { data, execute };
