const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, REST, Routes } = require('discord.js');

// LANGSUNG BACA DARI process.env (Railway variables)
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// CEK APAKAH ADA TOKEN & CLIENT_ID
if (!TOKEN || !CLIENT_ID) {
  console.error('❌ ERROR: TOKEN atau CLIENT_ID gak ditemukan!');
  console.error('📌 Pastikan sudah diisi di Railway Variables');
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
    description: 'Hapus pesan di channel ini',
    options: [
      {
        name: 'jumlah',
        description: 'Jumlah pesan yang mau dihapus (1-100)',
        type: 4,
        required: true,
        min_value: 1,
        max_value: 100
      }
    ]
  }
];

// Register slash commands
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
  console.log(`✅ ${client.user.tag} siap pakai slash command!`);
  console.log(`📊 Bot ada di ${client.guilds.cache.size} server`);
  console.log(`🔑 CLIENT_ID: ${CLIENT_ID}`);
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

    const jumlah = interaction.options.getInteger('jumlah');
    await interaction.deferReply({ ephemeral: true });

    const fetched = await interaction.channel.messages.fetch({ limit: jumlah });
    const deleted = await interaction.channel.bulkDelete(fetched, true);

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('🧹 Pesan Dibersihkan!')
      .setDescription(`Berhasil menghapus **${deleted.size}** pesan.`)
      .setTimestamp()
      .setFooter({ text: `Diminta oleh ${interaction.user.tag}` });

    await interaction.editReply({ embeds: [embed] });

    // Auto hapus reply setelah 5 detik
    setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);

  } catch (error) {
    console.error('❌ Error di interaction:', error);
    if (interaction.deferred) {
      await interaction.editReply({
        content: '⚠️ Gagal hapus pesan! Mungkin pesan terlalu lama (>14 hari).',
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

// Login
client.login(TOKEN)
  .then(() => {
    console.log('🔑 Bot berhasil login!');
    // Register command setelah login
    setTimeout(registerCommands, 3000);
  })
  .catch(error => {
    console.error('❌ Gagal login:', error.message);
    process.exit(1);
  });

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
  console.error('⚠️ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('⚠️ Uncaught Exception:', error);
});
