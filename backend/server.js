// ===================================================
// 檔名: server.js (最終穩健版本)
// ===================================================
require('dotenv').config();
const express = require('express');
const textToSpeech = require('@google-cloud/text-to-speech');
const cors = require('cors');

// --- Google Cloud 客戶端初始化 (保持不變) ---
let client;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    client = new textToSpeech.TextToSpeechClient({ credentials });
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    client = new textToSpeech.TextToSpeechClient();
} else {
    console.error('CRITICAL ERROR: Google Cloud credentials not found!');
    process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// --- API 路由 (保持不變) ---
app.post('/api/synthesize', async (req, res) => {
    try {
        const { text, voice = 'yue-HK-Standard-A', speakingRate = 1.0, pitch = 0 } = req.body;
        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Text is required' });
        }
        const ssmlText = `<speak>${text}</speak>`;
        const request = {
            input: { ssml: ssmlText },
            voice: { languageCode: 'yue-HK', name: voice },
            audioConfig: { audioEncoding: 'MP3', speakingRate: parseFloat(speakingRate), pitch: parseFloat(pitch) },
        };
        const [response] = await client.synthesizeSpeech(request);
        const audioContent = response.audioContent.toString('base64');
        res.json({ audioContent });
    } catch (error) {
        console.error('ERROR synthesizing speech:', error);
        res.status(500).json({ error: 'Failed to synthesize speech', details: error.message });
    }
});

// --- ↓↓↓ 伺服器啟動 (最關鍵嘅修改) ↓↓↓ ---

// Zeabur 會透過環境變數 process.env.PORT 話俾我哋知要用邊個埠。
// 我哋唔再用 3000 作為後備，直接用 Zeabur 指定嘅。
const PORT = process.env.PORT;

if (!PORT) {
    console.error("CRITICAL ERROR: Port not defined by the environment. Exiting.");
    process.exit(1);
}

// 啟動伺服器，並且明確指定監聽所有網絡介面 ('0.0.0.0')
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running and listening on all interfaces at port ${PORT}`);
});
