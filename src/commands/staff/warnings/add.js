import { PermissionFlagsBits, SlashCommandSubcommandBuilder } from "discord.js";
import User from "../../../models/User.js";
import Guild from "../../../models/Guild.js";

const data = new SlashCommandSubcommandBuilder()
  .setName("add")
  .setDescription("Warn a user")
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to warn").setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("The reason for the warning"),
  );

const execute = async function (interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({
      content: "you can't do that! >:(",
      ephemeral: true,
    });
  }

  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason") || "not specified";

  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const time = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  let userData = await User.findOne({ id: user.id, guild_id: interaction.guild.id });

  if (!userData) {
    userData = await User.create({ id: user.id, guild_id: interaction.guild.id });
  }

  userData.warnings.push({ reason, time });
  await userData.save();

  const embed = {
    title: "user warned :warning:",
    description: `<@${user.id}> has been warned`,
    fields: [{ name: "Reason", value: reason }],
    color: 0xfdfd96,
  };

  await interaction.reply({ embeds: [embed] });

  let sentMessageToUser = false;
  try {
    await user.send({
      embeds: [{
        title: "you've been warned :warning:",
        description: `you were warned in **${interaction.guild.name}**`,
        fields: [{ name: "Reason", value: reason }],
        color: 0xfdfd96,
      }],
    });
    sentMessageToUser = true;
  } catch (_) {}

  const guild = await Guild.findOne({ id: interaction.guild.id });
  if (guild?.log_channel) {
    const channel = interaction.guild.channels.cache.get(guild.log_channel);
    if (channel) {
      await channel.send({
        embeds: [{
          ...embed,
          description: `<@${user.id}> has been warned${sentMessageToUser ? " (notified via DM)" : ""}`,
          fields: [
            { name: "Reason", value: reason },
            { name: "Moderator", value: `<@${interaction.user.id}>` },
          ],
        }],
      });
    }
  }
};

export default { data, execute };
