import {
  ThreadAutoArchiveDuration,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import GlobalUser from "../models/GlobalUser.js";
import Guild from "../models/Guild.js";
import Stats from "../models/Stats.js";

const ai_commands = ["imagine"];

export default {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) return;

      let user = await GlobalUser.findOne({ id: interaction.user.id }).cache(
        "1 minute",
      );

      if (!user) {
        user = await GlobalUser.create({
          id: interaction.user.id,
        });
      }

      if (user.blacklisted && command.data.name !== "root") {
        return await interaction.reply({
          content: `:no_entry: You are blacklisted from using commands! Reason: ${user.blacklist_reason}`,
          ephemeral: true,
        });
      }

      if (
        ai_commands.includes(command.data.name) &&
        user.ai_ignore /* ai_ignore is AI ban. TODO: Change this */
      ) {
        return await interaction.reply({
          content: `:no_entry: You are banned from using AI commands! Reason: ${user.ai_ignore_reason}`,
          ephemeral: true,
        });
      }

      try {
        await command.execute(interaction, client);
        Stats.findOneAndUpdate({}, { $inc: { commands_ran: 1 } }, { upsert: true }).exec();
      } catch (error) {
        console.error(error);
        try {
          await interaction.reply({
            content: "oops, something broke :c",
            ephemeral: true,
          });
        } catch (error) {
          console.error(
            "Error while handling error in interactionCreate event: ",
            error,
          );
        }
      }
    } else if (interaction.isButton()) {
      if (interaction.customId == "open_ticket") {
        const guildData = await Guild.findOne({ id: interaction.guild.id });

        if (!guildData) {
          return await interaction.reply({
            content: "this server doesn't have tickets set up yet! :O",
            ephemeral: true,
          });
        }

        if (!guildData.ticketChannel) {
          return await interaction.reply({
            content: "this server doesn't have tickets set up yet! :O",
            ephemeral: true,
          });
        }

        const ticketChannel = interaction.guild.channels.cache.get(
          guildData.ticketChannel,
        );

        if (!ticketChannel) {
          return await interaction.reply({
            content: "this server's ticket setup is broken :c tell an admin!",
            ephemeral: true,
          });
        }

        const ticketLogChannel = interaction.guild.channels.cache.get(
          guildData.ticketLogChannel,
        );

        if (!ticketLogChannel) {
          return await interaction.reply({
            content: "this server's ticket setup is broken :c tell an admin!",
            ephemeral: true,
          });
        }

        const existingTicket = ticketChannel.threads.cache.find(
          (thread) =>
            thread.name === `ticket-${interaction.user.username}` &&
            thread.archived === false,
        );

        if (existingTicket) {
          return await interaction.reply({
            content: "you already have an open ticket silly :p",
            ephemeral: true,
          });
        }

        // tickets channel is a text channel instead of a category btw
        const ticket = await ticketChannel.threads.create({
          name: `ticket-${interaction.user.username}`,
          autoArchiveDuration: ThreadAutoArchiveDuration.ThreeDays,
          type: ChannelType.PrivateThread,
          reason: `Ticket created by ${interaction.user.tag}`,
        });

        await ticket.members.add(interaction.user.id);

        const msg = await ticket.send({
          content: `<@${interaction.user.id}>`,
          embeds: [
            {
              color: 0x56b3fa,
              title: "Ticket opened",
              description: `describe your issue here and staff will be with you soon! :)`,
            },
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 4,
                  emoji: "🔒",
                  label: "Close ticket",
                  custom_id: "close_ticket",
                },
              ],
            },
          ],
        });

        await msg.pin();

        await interaction.reply({
          content: `Ticket created! ${ticket.url}`,
          ephemeral: true,
        });

        await ticketLogChannel.send({
          embeds: [
            {
              title: "Ticket Created",
              description: `A ticket has been made by <@${interaction.user.id}>`,
              color: 0x56b3fa,
              footer: {
                text: ticket.id,
              },
            },
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 1,
                  emoji: "🔓",
                  label: "Join ticket",
                  custom_id: "join_ticket",
                },
              ],
            },
          ],
        });
      } else if (interaction.customId == "close_ticket") {
        if (
          !interaction.member.permissions.has(
            PermissionFlagsBits.ManageChannels,
          )
        ) {
          if (
            interaction.user.username !== interaction.channel.name.split("-")[1]
          ) {
            return interaction.reply({
              content: "you can't do that! >:(",
              ephemeral: true,
            });
          }
        }

        await interaction.channel.send({
          embeds: [
            {
              title: "Ticket Closed",
              description: `This ticket has been closed by <@${interaction.user.id}>`,
              color: 0xff6961,
            },
          ],
        });

        const guildData = await Guild.findOne({ id: interaction.guild.id });

        if (guildData) {
          if (guildData.ticketLogChannel) {
            const ticketLogChannel = interaction.guild.channels.cache.get(
              guildData.ticketLogChannel,
            );

            if (ticketLogChannel) {
              await ticketLogChannel.send({
                embeds: [
                  {
                    title: "Ticket Closed",
                    description: `Ticket ${interaction.channel.url} has been closed by <@${interaction.user.id}>`,
                    color: 0xff6961,
                    footer: {
                      text: interaction.channel.id,
                    },
                  },
                ],
                components: [
                  {
                    type: 1,
                    components: [
                      {
                        type: 2,
                        style: 1,
                        emoji: "🔓",
                        label: "Reopen ticket",
                        custom_id: "reopen_ticket",
                      },
                    ],
                  },
                ],
              });
            }
          }
        }

        await interaction.channel.setArchived(true);
      } else if (interaction.customId == "join_ticket") {
        const id = interaction.message.embeds[0].footer.text;

        const ticket = interaction.guild.channels.cache.get(id);

        if (!ticket) {
          return interaction.reply({
            content: "that ticket doesn't exist anymore :O",
            ephemeral: true,
          });
        }

        let memberInTicket = false;

        try {
          await ticket.members.fetch(interaction.user.id);
          memberInTicket = true;
        } catch (_) {}

        if (memberInTicket) {
          return await interaction.reply({
            content: "You are already in this ticket!",
            ephemeral: true,
          });
        }

        await ticket.members.add(interaction.user.id);

        await ticket.send({
          content: `<@${interaction.user.id}> has joined the ticket!`,
        });

        await interaction.reply({
          content: "joined the ticket! :D",
          ephemeral: true,
        });
      } else if (interaction.customId == "reopen_ticket") {
        const id = interaction.message.embeds[0].footer.text;

        const ticket = interaction.guild.channels.cache.get(id);

        if (!ticket) {
          return interaction.reply({
            content: "that ticket doesn't exist anymore :O",
          });
        }

        await ticket.setArchived(false);

        await interaction.reply({
          content: "ticket reopened! :D",
        });

        await ticket.send({
          embeds: [
            {
              title: "Ticket Reopened",
              description: `This ticket has been reopened by <@${interaction.user.id}>`,
              color: 0x77dd77,
            },
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 4,
                  emoji: "🔒",
                  label: "Close ticket",
                  custom_id: "close_ticket",
                },
              ],
            },
          ],
        });

        await interaction.channel.send({
          embeds: [
            {
              title: "Ticket Reopened",
              description: `Ticket ${interaction.channel.url} has been reopened by <@${interaction.user.id}>`,
              color: 0x77dd77,
            },
          ],
        });
      }
    }
  },
};
