const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} siap bersih-bersih di SEMUA server!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!clear')) return;

  // Cek izin user
  if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
    return message.reply('❌ Kamu gak punya izin **Manage Messages**!');
  }

  // Cek izin bot
  if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
    return message.reply('❌ Bot gak punya izin **Manage Messages**!');
  }

  const args = message.content.split(' ');
  const jumlah = parseInt(args[1]);

  // Validasi jumlah
  if (!jumlah || isNaN(jumlah) || jumlah < 1 || jumlah > 100) {
    return message.reply('📌 Pakai: `!clear <1-100>`\nContoh: `!clear 50`');
  }

  try {
    const fetched = await message.channel.messages.fetch({ limit: jumlah });
    const deleted = await message.channel.bulkDelete(fetched, true);

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('🧹 Pesan Dibersihkan!')
      .setDescription(`Berhasil menghapus **${deleted.size}** pesan.`)
      .setTimestamp()
      .setFooter({ text: `Diminta oleh ${message.author.tag}` });

    const reply = await message.channel.send({ embeds: [embed] });

    // Auto hapus embed setelah 5 detik
    setTimeout(() => reply.delete().catch(() => {}), 5000);

  } catch (error) {
    console.error(error);
    message.reply('⚠️ Gagal hapus pesan! Mungkin pesan terlalu lama (>14 hari).');
  }
});

client.login(process.env.TOKEN);
