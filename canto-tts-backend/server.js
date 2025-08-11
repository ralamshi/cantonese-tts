// 檔名: server.js
require('dotenv').config();
const express = require('express');
const textToSpeech = require('@google-cloud/text-to-speech');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' })); // 允許更大的請求體

// 初始化 Google TTS 客戶端
// 它會自動讀取你在 .env 中設定的 GOOGLE_APPLICATION_CREDENTIALS
const client = new textToSpeech.TextToSpeechClient();

// API 路由: /api/synthesize
app.post('/api/synthesize', async (req, res) => {
    try {
        // 從前端請求中獲取所有參數
        const {
            text,
            voice = 'yue-HK-Standard-A',
            speakingRate = 1.0,
            pitch = 0
        } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Text is required' });
        }

        // 將文字包裹在 <speak> 標籤中，使其成為合法的 SSML
        // 這樣前端傳來的 <break> 標籤才能被識別
        const ssmlText = `<speak>${text}</speak>`;

        // 組建發往 Google API 的請求
        const request = {
            input: { ssml: ssmlText }, // **重要**: 使用 ssml 欄位，而不是 text
            voice: {
                languageCode: 'yue-HK',
                name: voice,
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: parseFloat(speakingRate), // 使用前端傳來的語速
                pitch: parseFloat(pitch),             // 使用前端傳來的音高
            },
        };

        // 呼叫 Google API
        const [response] = await client.synthesizeSpeech(request);

        // 將音訊內容以 Base64 格式回傳
        const audioContent = response.audioContent.toString('base64');
        res.json({ audioContent });

    } catch (error) {
        console.error('ERROR synthesizing speech:', error);
        res.status(500).json({ error: 'Failed to synthesize speech', details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});