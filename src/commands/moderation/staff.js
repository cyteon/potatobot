const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../../lib/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staff')
        .setDescription('Staff commands for moderation and logging')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setlog')
                .setDescription('Set the logging channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send logs to')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('archive')
                .setDescription('Archive messages from a channel')
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Number of messages to archive')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'setlog': {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                    return interaction.reply('You need the Manage Server permission to use this command.');
                }

                const channel = interaction.options.getChannel('channel');
                
                await db.collection('guilds').updateOne(
                    { id: interaction.guild.id },
                    { $set: { log_channel: channel.id } },
                    { upsert: true }
                );

                await interaction.reply(`Logging channel set to ${channel}`);
                break;
            }

            case 'archive': {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                    return interaction.reply('You need the Manage Messages permission to use this command.');
                }

                const limit = interaction.options.getInteger('limit');
                const messages = await interaction.channel.messages.fetch({ limit });

                let archiveContent = `Archived messages from: #${interaction.channel.name} (${interaction.channel.id}) in the guild "${interaction.guild.name}" (${interaction.guild.id}) at ${new Date().toLocaleString()}\n\n`;

                messages.reverse().forEach(message => {
                    const attachments = message.attachments.map(a => a.url);
                    const attachmentsText = attachments.length > 0 
                        ? `[Attached File${attachments.length > 1 ? 's' : ''}: ${attachments.join(', ')}]`
                        : '';
                    
                    archiveContent += `${message.createdAt.toLocaleString()} ${message.author.tag} ${message.id}: ${message.content} ${attachmentsText}\n`;
                });

                const buffer = Buffer.from(archiveContent, 'utf-8');
                await interaction.reply({
                    content: 'Here is the message archive:',
                    files: [{
                        attachment: buffer,
                        name: 'archive.txt'
                    }]
                });
                break;
            }
        }
    },
}; 