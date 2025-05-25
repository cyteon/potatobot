const { EmbedBuilder } = require('discord.js');
const { db } = require('../../lib/database');

module.exports = [
    {
        name: 'messageDelete',
        async execute(message) {
            if (!message.guild) return;

            const guildData = await db.collection('guilds').findOne({ id: message.guild.id });
            if (!guildData?.log_channel) return;

            const logChannel = message.guild.channels.cache.get(guildData.log_channel);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setTitle('Message Deleted')
                .setColor(0xFF0000)
                .addFields(
                    { name: 'Author', value: `${message.author.tag} (${message.author.id})` },
                    { name: 'Channel', value: `${message.channel}` },
                    { name: 'Content', value: message.content || 'No content' }
                )
                .setTimestamp();

            if (message.attachments.size > 0) {
                embed.addField('Attachments', message.attachments.map(a => a.url).join('\n'));
            }

            await logChannel.send({ embeds: [embed] });
        }
    },
    {
        name: 'messageBulkDelete',
        async execute(messages) {
            const firstMessage = messages.first();
            if (!firstMessage?.guild) return;

            const guildData = await db.collection('guilds').findOne({ id: firstMessage.guild.id });
            if (!guildData?.log_channel) return;

            const logChannel = firstMessage.guild.channels.cache.get(guildData.log_channel);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setTitle('Bulk Message Delete')
                .setDescription(`${messages.size} messages were deleted`)
                .setColor(0xFF0000)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }
    },
    {
        name: 'channelCreate',
        async execute(channel) {
            if (!channel.guild) return;

            const guildData = await db.collection('guilds').findOne({ id: channel.guild.id });
            if (!guildData?.log_channel) return;

            const logChannel = channel.guild.channels.cache.get(guildData.log_channel);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setTitle('Channel Created')
                .setDescription(`Channel ${channel} was created`)
                .setColor(0x00FF00)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }
    },
    {
        name: 'channelDelete',
        async execute(channel) {
            if (!channel.guild) return;

            const guildData = await db.collection('guilds').findOne({ id: channel.guild.id });
            if (!guildData?.log_channel) return;

            const logChannel = channel.guild.channels.cache.get(guildData.log_channel);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setTitle('Channel Deleted')
                .setDescription(`Channel ${channel.name} was deleted`)
                .setColor(0xFF0000)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }
    },
    {
        name: 'guildMemberAdd',
        async execute(member) {
            const guildData = await db.collection('guilds').findOne({ id: member.guild.id });
            if (!guildData?.log_channel) return;

            const logChannel = member.guild.channels.cache.get(guildData.log_channel);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setTitle('Member Joined')
                .setDescription(`${member.user.tag} (${member.id}) joined the server`)
                .setColor(0x00FF00)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }
    },
    {
        name: 'guildMemberRemove',
        async execute(member) {
            const guildData = await db.collection('guilds').findOne({ id: member.guild.id });
            if (!guildData?.log_channel) return;

            const logChannel = member.guild.channels.cache.get(guildData.log_channel);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setTitle('Member Left')
                .setDescription(`${member.user.tag} (${member.id}) left the server`)
                .setColor(0xFF0000)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }
    }
]; 