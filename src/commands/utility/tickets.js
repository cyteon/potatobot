const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../lib/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('Commands to manage tickets')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Set up the ticket system')
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('The category to create tickets in')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('support_role')
                        .setDescription('The role that can see and manage tickets')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close the current ticket'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to the ticket')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add to the ticket')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from the ticket')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove from the ticket')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'setup': {
                const category = interaction.options.getChannel('category');
                const supportRole = interaction.options.getRole('support_role');

                // Create ticket panel embed
                const embed = new EmbedBuilder()
                    .setTitle('🎫 Support Tickets')
                    .setDescription('Click the button below to create a support ticket')
                    .setColor(0x0099FF);

                const button = new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('Create Ticket')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎫');

                const row = new ActionRowBuilder().addComponents(button);

                const message = await interaction.channel.send({
                    embeds: [embed],
                    components: [row]
                });

                // Save ticket system settings
                await db.collection('guilds').updateOne(
                    { id: interaction.guild.id },
                    {
                        $set: {
                            'tickets.category': category.id,
                            'tickets.support_role': supportRole.id,
                            'tickets.panel_message': message.id
                        }
                    },
                    { upsert: true }
                );

                await interaction.reply('Ticket system has been set up!');
                break;
            }

            case 'close': {
                if (!interaction.channel.name.startsWith('ticket-')) {
                    return interaction.reply('This command can only be used in ticket channels.');
                }

                const embed = new EmbedBuilder()
                    .setTitle('Ticket Closing')
                    .setDescription('This ticket will be closed in 5 seconds.')
                    .setColor(0xFF0000);

                await interaction.reply({ embeds: [embed] });

                setTimeout(async () => {
                    try {
                        await interaction.channel.delete();
                    } catch (error) {
                        console.error('Error deleting ticket channel:', error);
                    }
                }, 5000);
                break;
            }

            case 'add': {
                if (!interaction.channel.name.startsWith('ticket-')) {
                    return interaction.reply('This command can only be used in ticket channels.');
                }

                const user = interaction.options.getUser('user');
                const member = interaction.guild.members.cache.get(user.id);

                try {
                    await interaction.channel.permissionOverwrites.create(member, {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true
                    });

                    await interaction.reply(`Added ${user} to the ticket.`);
                } catch (error) {
                    console.error('Error adding user to ticket:', error);
                    await interaction.reply('Failed to add user to the ticket.');
                }
                break;
            }

            case 'remove': {
                if (!interaction.channel.name.startsWith('ticket-')) {
                    return interaction.reply('This command can only be used in ticket channels.');
                }

                const user = interaction.options.getUser('user');
                const member = interaction.guild.members.cache.get(user.id);

                try {
                    await interaction.channel.permissionOverwrites.delete(member);
                    await interaction.reply(`Removed ${user} from the ticket.`);
                } catch (error) {
                    console.error('Error removing user from ticket:', error);
                    await interaction.reply('Failed to remove user from the ticket.');
                }
                break;
            }
        }
    },
}; 