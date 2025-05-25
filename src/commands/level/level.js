const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../lib/database');
const { Canvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Register fonts
registerFont(path.join(__dirname, '../assets/fonts/Poppins-Regular.ttf'), { family: 'Poppins' });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('See yours or someone elses current level and xp')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check level for')
                .setRequired(false)),

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        const userData = await db.collection('users').findOne({
            id: user.id,
            guild_id: interaction.guild.id
        });

        if (!userData) {
            return interaction.reply('Start chatting to gain a level');
        }

        const xpForNextLevel = Math.floor(100 * Math.pow(1.1, userData.level));
        const percentage = Math.round((userData.xp / xpForNextLevel) * 100);

        // Create level card
        const canvas = new Canvas(900, 300);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#141414';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Right shape
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(600, 0);
        ctx.lineTo(750, 300);
        ctx.lineTo(900, 300);
        ctx.lineTo(900, 0);
        ctx.closePath();
        ctx.fill();

        // Avatar
        const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 512 }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(105, 105, 75, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 30, 30, 150, 150);
        ctx.restore();

        // Progress bar background
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(30, 220, 650, 40, 20);
        ctx.fill();

        // Progress bar
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.roundRect(30, 220, (650 * percentage) / 100, 40, 20);
        ctx.fill();

        // Username
        ctx.font = '40px Poppins';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(user.username, 200, 40);

        // Separator
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(200, 100, 350, 2);

        // Level and XP
        ctx.font = '30px Poppins';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Level ${userData.level} - ${userData.xp}/${xpForNextLevel} XP`, 200, 130);

        const buffer = canvas.toBuffer('image/png');
        await interaction.reply({ files: [{ attachment: buffer, name: 'level_card.png' }] });
    },
}; 