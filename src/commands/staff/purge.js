import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("purge")
  .setDescription("Bulk delete messages in a channel")
  .setIntegrationTypes(0)
  .addIntegerOption((option) =>
    option
      .setName("amount")
      .setDescription("Number of messages to delete (1-100)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100),
  )
  .addUserOption((option) =>
    option.setName("user").setDescription("Only delete messages from this user"),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

const execute = async function (interaction) {
  const amount = interaction.options.getInteger("amount");
  const user = interaction.options.getUser("user");

  await interaction.deferReply({ ephemeral: true });

  try {
    let messages = await interaction.channel.messages.fetch({ limit: 100 });

    if (user) {
      messages = messages.filter((m) => m.author.id === user.id);
    }

    // Discord can only bulk delete messages < 14 days old
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    messages = [...messages.values()]
      .filter((m) => m.createdTimestamp > twoWeeksAgo)
      .slice(0, amount);

    if (messages.length === 0) {
      return interaction.editReply({
        content: "no messages to delete! :( messages older than 14 days can't be bulk deleted",
      });
    }

    const deleted = await interaction.channel.bulkDelete(messages, true);

    await interaction.editReply({
      content: `deleted **${deleted.size}** message${deleted.size === 1 ? "" : "s"}! :D`,
    });
  } catch (_) {
    await interaction.editReply({ content: "uh oh, couldn't delete messages :c" });
  }
};

export default { data, execute };
