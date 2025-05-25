const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { db } = require('../lib/database');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'create_ticket') {
            try {
                // Get ticket system settings
                const guildSettings = await db.collection('guilds').findOne({ id: interaction.guild.id });
                if (!guildSettings?.tickets) {
                    return interaction.reply({
                        content: 'Ticket system has not been set up yet.',
                        ephemeral: true
                    });
                }

                // Check if user already has an open ticket
                const existingTicket = interaction.guild.channels.cache.find(
                    channel => channel.name === `ticket-${interaction.user.id}`
                );

                if (existingTicket) {
                    return interaction.reply({
                        content: `You already have an open ticket: ${existingTicket}`,
                        ephemeral: true
                    });
                }

                // Create ticket channel
                const category = interaction.guild.channels.cache.get(guildSettings.tickets.category);
                const supportRole = interaction.guild.roles.cache.get(guildSettings.tickets.support_role);

                const channel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.id}`,
                    type: ChannelType.GuildText,
                    parent: category,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: interaction.user.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory
                            ]
                        },
                        {
                            id: supportRole.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory
                            ]
                        }
                    ]
                });

                const embed = new EmbedBuilder()
                    .setTitle('Support Ticket')
                    .setDescription(`Welcome ${interaction.user}!\nPlease describe your issue and a staff member will assist you shortly.`)
                    .setColor(0x0099FF)
                    .addFields(
                        { name: 'Commands', value: '/tickets close - Close this ticket\n/tickets add <user> - Add a user to the ticket\n/tickets remove <user> - Remove a user from the ticket' }
                    );

                await channel.send({ embeds: [embed] });
                await interaction.reply({
                    content: `Your ticket has been created: ${channel}`,
                    ephemeral: true
                });

            } catch (error) {
                console.error('Error creating ticket:', error);
                await interaction.reply({
                    content: 'There was an error creating your ticket. Please try again later.',
                    ephemeral: true
                });
            }
        }
    },
}; 