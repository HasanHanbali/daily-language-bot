require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cron = require('node-cron');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function getDailyContentFromAI() {
  const tanggal = new Date().toLocaleDateString('id-ID');
  const response = await axios.post('https://api.x.ai/v1/chat/completions', {
    model: "grok-beta",
    messages: [
      { role: "system", content: `Kamu adalah guru bahasa Inggris & Jerman yang sangat kreatif. 
Hari ini tanggal ${tanggal}.
Buat konten belajar bahasa harian yang 100% baru dan belum pernah kamu buat sebelumnya.
Keluarkan HANYA JSON yang valid (tanpa penjelasan apa pun di luar JSON):` },
      { role: "user", content: `Buat konten belajar bahasa hari ini dengan format JSON berikut:

{
  "englishQuote": "Quote motivasi bahasa Inggris + author, contoh: \\"Believe you can and you're halfway there.\\" - Theodore Roosevelt",
  "englishVocab": [
    {"word": "resilience", "translate": "ketangguhan", "example": "His resilience helped him recover quickly from failure."},
    {"word": "...", "translate": "...", "example": "..."},
    ... (total 5 item)
  ],
  "germanQuote": "Quote bahasa Jerman yang bagus + author, contoh: \\"Das Leben ist zu kurz für später.\\" - Unknown",
  "germanVocab": [
    {"word": "Lebensfreude", "translate": "kegembiraan hidup", "example": "Sie strahlt pure Lebensfreude aus."},
    ... (total 5 item)
  ],
  "englishGrammar": "Present Perfect Continuous Tense",
  "germanGrammar": "Der Akkusativ mit Wechselpräpositionen"
}

Pastikan semua konten benar-benar baru dan belum pernah kamu berikan sebelumnya.` }
    ],
    temperature: 0.95,
    max_tokens: 1400
  }, {
    headers: { Authorization: `Bearer ${process.env.GROK_API_KEY}` }
  });

  const raw = response.data.choices[0].message.content.trim();
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

async function kirimKonten() {
  const channel = client.channels.cache.get(process.env.CHANNEL_ID);
  if (!channel) return console.log("Channel tidak ditemukan!");
  console.log("Sedang generate konten baru dari AI...");
  const data = await getDailyContentFromAI();
  const embed = new EmbedBuilder()
    .setColor(0x00D4B3)
    .setTitle(`Belajar Bahasa Harian – ${new Date().toLocaleDateString('id-ID')}`)
    .setDescription(`
**${data.englishQuote}**

**5 KOSA KATA BAHASA INGGRIS**
${data.englishVocab.map((v, i) => `${i+1}. **${v.word}** - ${v.translate}\n   Contoh: ${v.example}`).join('\n')}

**${data.germanQuote}**

**5 Kosa kata bahasa Jerman**
${data.germanVocab.map((v, i) => `${i+1}. **${v.word}** - ${v.translate}\n   Contoh: ${v.example}`).join('\n')}

**Belajar Grammar**
- Untuk bahasa Inggris: **${data.englishGrammar}**
- Untuk bahasa Jerman: **${data.germanGrammar}**

Semangat belajar hari ini!`)
    .setFooter({ text: "Konten 100% digenerate AI • Otomatis 07:00 & 19:00 WIB" })
    .setTimestamp();

  await channel.send({ embeds: [embed] });
  console.log("Konten sukses terkirim!");
}

// Jadwal 07:00 & 19:00 WIB
cron.schedule('0 7,19 * * *', kirimKonten, { timezone: "Asia/Jakarta" });

// Test sekali pas start (hapus kalau ga mau)
kirimKonten();

client.once('ready', () => {
  console.log(`Bot aktif sebagai ${client.user.tag} ✅`);
  console.log("Menunggu jam 07:00 & 19:00 WIB untuk kirim konten baru dari AI");
});

client.login(process.env.DISCORD_TOKEN);
