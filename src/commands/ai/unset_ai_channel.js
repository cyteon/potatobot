import { SlashCommandBuilder } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import AiChannels from "../../models/AiChannels.js";

const data = new SlashCommandBuilder()
  .setName("unset_ai_channel")
  .setDescription("Remove the current channel as an AI channel")
  .setIntegrationTypes(0)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

const execute = async function (interaction) {
  interaction.client.aiChannels ??= [];
  if (!interaction.client.aiChannels.includes(interaction.channelId)) {
    return interaction.reply({
      content: "this channel isn't an AI channel silly :p",
      ephemeral: true,
    });
  }

  interaction.client.aiChannels = interaction.client.aiChannels.filter(
    (id) => id !== interaction.channelId,
  );

  await AiChannels.findOneAndUpdate(
    { listOfChannels: true },
    { $pull: { ai_channels: interaction.channelId } },
  );

  try {
    await interaction.channel.setRateLimitPerUser(0);
  } catch (_) {}

  await interaction.reply("channel is no longer an AI channel :3");
};

export default { data, execute };
