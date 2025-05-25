const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../../lib/database');
const { createCanvas } = require('canvas');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View server statistics')
        .addSubcommand(subcommand =>
            subcommand
                .setName('messages')
                .setDescription('Show message activity chart'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('members')
                .setDescription('Show member count chart')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        switch (subcommand) {
            case 'messages': {
                const guildData = await db.collection('guilds').findOne({ id: guildId });
                if (!guildData?.stats?.messages) {
                    return interaction.reply('No message statistics available for this server.');
                }

                const canvas = createCanvas(1600, 800);
                const ctx = canvas.getContext('2d');

                // Set background
                ctx.fillStyle = '#202226';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw grid lines
                ctx.strokeStyle = '#40444B';
                ctx.lineWidth = 2;
                for (let y = 100; y <= 700; y += 100) {
                    ctx.beginPath();
                    ctx.moveTo(100, y);
                    ctx.lineTo(1500, y);
                    ctx.stroke();
                }

                // Get message data
                const messageData = guildData.stats.messages;
                const dates = Object.keys(messageData).sort();
                const messageCounts = dates.map(date => messageData[date]);

                // Calculate max count for scaling
                const maxCount = Math.max(...messageCounts, 1);

                // Draw bars and lines
                ctx.strokeStyle = '#00FFFF';
                ctx.lineWidth = 5;
                ctx.fillStyle = '#808080';

                let prevPoint = null;
                dates.forEach((date, i) => {
                    const x = 200 + i * 40;
                    const y = 700 - (messageCounts[i] * 600 / maxCount);
                    
                    // Draw bar
                    ctx.fillRect(x - 10, y, 20, 700 - y);
                    
                    // Draw line
                    if (prevPoint) {
                        ctx.beginPath();
                        ctx.moveTo(prevPoint.x, prevPoint.y);
                        ctx.lineTo(x, y);
                        ctx.stroke();
                    }
                    
                    // Draw point
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, Math.PI * 2);
                    ctx.fill();
                    
                    prevPoint = { x, y };

                    // Draw date label
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '20px Arial';
                    ctx.fillText(date.slice(5), x - 20, 720);
                });

                // Draw title and total
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '20px Arial';
                ctx.fillText('Messages - Last 30 days', 20, 20);
                ctx.fillText(`Total Messages: ${messageCounts.reduce((a, b) => a + b, 0)}`, canvas.width - 200, 20);

                // Send the chart
                const buffer = canvas.toBuffer('image/png');
                await interaction.reply({
                    files: [{
                        attachment: buffer,
                        name: 'message-stats.png'
                    }]
                });
                break;
            }

            case 'members': {
                const guildData = await db.collection('guilds').findOne({ id: guildId });
                if (!guildData?.stats?.members) {
                    return interaction.reply('No member statistics available for this server.');
                }

                const canvas = createCanvas(1600, 800);
                const ctx = canvas.getContext('2d');

                // Set background
                ctx.fillStyle = '#202226';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw grid lines
                ctx.strokeStyle = '#40444B';
                ctx.lineWidth = 2;
                for (let y = 100; y <= 700; y += 100) {
                    ctx.beginPath();
                    ctx.moveTo(100, y);
                    ctx.lineTo(1500, y);
                    ctx.stroke();
                }

                // Get member data
                const memberData = guildData.stats.members;
                const dates = Object.keys(memberData).sort();
                const memberCounts = dates.map(date => memberData[date]);

                // Calculate max count for scaling
                const maxCount = Math.max(...memberCounts, 1);

                // Draw bars and lines
                ctx.strokeStyle = '#00FFFF';
                ctx.lineWidth = 5;
                ctx.fillStyle = '#808080';

                let prevPoint = null;
                dates.forEach((date, i) => {
                    const x = 200 + i * 40;
                    const y = 700 - (memberCounts[i] * 600 / maxCount);
                    
                    // Draw bar
                    ctx.fillRect(x - 10, y, 20, 700 - y);
                    
                    // Draw line
                    if (prevPoint) {
                        ctx.beginPath();
                        ctx.moveTo(prevPoint.x, prevPoint.y);
                        ctx.lineTo(x, y);
                        ctx.stroke();
                    }
                    
                    // Draw point
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, Math.PI * 2);
                    ctx.fill();
                    
                    prevPoint = { x, y };

                    // Draw date label
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '20px Arial';
                    ctx.fillText(date.slice(5), x - 20, 720);
                });

                // Draw title
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '20px Arial';
                ctx.fillText('Member Count - Last 30 days', 20, 20);

                // Send the chart
                const buffer = canvas.toBuffer('image/png');
                await interaction.reply({
                    files: [{
                        attachment: buffer,
                        name: 'member-stats.png'
                    }]
                });
                break;
            }
        }
    },
}; 