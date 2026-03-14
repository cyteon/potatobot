import { SlashCommandBuilder } from "discord.js";
import { PermissionFlagsBits } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("emojifromurl")
  .setDescription("Add an emoji to the server from a URL")
  .setIntegrationTypes(0)
  .addStringOption((option) =>
    option.setName("url").setDescription("The image URL").setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("name").setDescription("Name for the emoji").setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions);

const execute = async function (interaction) {
  const url = interaction.options.getString("url");
  const name = interaction.options.getString("name");

  if (!/^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(url)) {
    return interaction.reply({
      content: "that doesn't look like a valid image url :O (needs to end in .png, .jpg, .gif, etc.)",
      ephemeral: true,
    });
  }

  if (!/^\w{2,32}$/.test(name)) {
    return interaction.reply({
      content: "emoji names can only have letters, numbers and underscores, and must be 2-32 chars :p",
      ephemeral: true,
    });
  }

  try {
    const emoji = await interaction.guild.emojis.create({ attachment: url, name });
    await interaction.reply({
      content: `added ${emoji} as **:${emoji.name}:** :D`,
    });
  } catch (_) {
    await interaction.reply({
      content: "uh oh, couldn't add the emoji :c (maybe i'm missing permissions, the url is invalid, or the server is at the emoji limit?)",
      ephemeral: true,
    });
  }
};

export default { data, execute };
