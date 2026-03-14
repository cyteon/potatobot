import { SlashCommandBuilder } from "discord.js";
import { PermissionFlagsBits } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("stealemoji")
  .setDescription("Steal an emoji from another server and add it to this one")
  .setIntegrationTypes(0)
  .addStringOption((option) =>
    option.setName("emoji").setDescription("The emoji to steal").setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("name").setDescription("Name for the emoji (defaults to original name)"),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions);

const execute = async function (interaction) {
  const emojiStr = interaction.options.getString("emoji");

  const match = emojiStr.match(/<a?:(\w+):(\d+)>/);
  if (!match) {
    return interaction.reply({
      content: "that doesn't look like a custom emoji :O (only custom emojis can be stolen!)",
      ephemeral: true,
    });
  }

  const animated = emojiStr.startsWith("<a:");
  const originalName = match[1];
  const emojiId = match[2];
  const name = interaction.options.getString("name") || originalName;
  const ext = animated ? "gif" : "png";
  const url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}`;

  try {
    const emoji = await interaction.guild.emojis.create({ attachment: url, name });
    await interaction.reply({
      content: `stolen! ${emoji} added as **:${emoji.name}:** :D`,
    });
  } catch (_) {
    await interaction.reply({
      content: "uh oh, couldn't add the emoji :c (maybe i'm missing permissions or the server is at the emoji limit?)",
      ephemeral: true,
    });
  }
};

export default { data, execute };
