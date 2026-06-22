const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, REST, Routes } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('❌ ERROR: TOKEN atau CLIENT_ID gak ditemukan!');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Command definition
const commands = [
  {
    name: 'clear',
    description: 'Hapus pesan di channel ini (max 1000)',
    options: [
      {
        name: 'jumlah',
        description: 'Jumlah pesan yang mau dihapus (1-1000)',
        type: 4,
        required: true,
        min_value: 1,
        max_value: 1000 // Sekarang bisa sampe 1000!
      }
    ]
  }
];

async function registerCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    console.log('🔄 Mendaftarkan slash command global...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Slash command /clear berhasil didaftarkan!');
  } catch (error) {
    console.error('❌ Gagal register command:', error.message);
  }
}

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} siap hapus sampe 1000 pesan!`);
  console.log(`📊 Bot ada di ${client.guilds.cache.size} server`);
});

// Handle interaction
client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'clear') return;

    // Cek izin user
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({
        content: '❌ Kamu gak punya izin **Manage Messages**!',
        ephemeral: true
      });
    }

    // Cek izin bot
    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({
        content: '❌ Bot gak punya izin **Manage Messages**!',
        ephemeral: true
      });
    }

    const totalJumlah = interaction.options.getInteger('jumlah');
    await interaction.deferReply({ ephemeral: true });

    let totalDeleted = 0;
    let batch = 0;
    const maxPerBatch = 100;
    let sisa = totalJumlah;

    // Loop hapus 100 per batch
    while (sisa > 0) {
      batch++;
      const hapusSekarang = Math.min(sisa, maxPerBatch);
      
      const fetched = await interaction.channel.messages.fetch({ limit: hapusSekarang });
      
      // Kalo udah gak ada pesan lagi, stop
      if (fetched.size === 0) break;
      
      const deleted = await interaction.channel.bulkDelete(fetched, true);
      totalDeleted += deleted.size;
      sisa -= deleted.size;
      
      // Kasih jeda biar gak kena rate limit
      if (sisa > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Kirim hasil
    const embed = new EmbedBuilder()
      .setColor(totalDeleted > 0 ? '#00ff00' : '#ff0000')
      .setTitle(totalDeleted > 0 ? '🧹 Pesan Dibersihkan!' : '⚠️ Gagal Hapus!')
      .setDescription(
        totalDeleted > 0 
          ? `Berhasil menghapus **${totalDeleted}** pesan dari **${totalJumlah}** yang diminta.`
          : `Gak ada pesan yang bisa dihapus (mungkin pesan >14 hari atau channel kosong).`
      )
      .addFields(
        { name: '📦 Total Batch', value: `${batch} kali`, inline: true },
        { name: '⏱️ Waktu', value: `${batch} detik`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `Diminta oleh ${interaction.user.tag}` });

    await interaction.editReply({ embeds: [embed] });

    // Auto hapus reply setelah 10 detik (kalo 1000 butuh waktu baca)
    setTimeout(() => interaction.deleteReply().catch(() => {}), 10000);

  } catch (error) {
    console.error('❌ Error:', error);
    if (interaction.deferred) {
      await interaction.editReply({
        content: '⚠️ Gagal hapus pesan! Error: ' + error.message,
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: '⚠️ Terjadi error! Coba lagi nanti.',
        ephemeral: true
      });
    }
  }
});

client.login(TOKEN)
  .then(() => {
    console.log('🔑 Bot berhasil login!');
    setTimeout(registerCommands, 3000);
  })
  .catch(error => {
    console.error('❌ Gagal login:', error.message);
    process.exit(1);
  });

process.on('unhandledRejection', (error) => {
  console.error('⚠️ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('⚠️ Uncaught Exception:', error);
});
