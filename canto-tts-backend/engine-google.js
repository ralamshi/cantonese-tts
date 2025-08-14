// 檔名: engine-google.js
const textToSpeech = require('@google-cloud/text-to-speech');

let client;
try {
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        client = new textToSpeech.TextToSpeechClient({ credentials });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        client = new textToSpeech.TextToSpeechClient();
    } else {
        throw new Error("Google Cloud credentials not found!");
    }
} catch (error) {
    console.error("CRITICAL ERROR: Failed to initialize Google TTS Client.", error);
}

// 呢個 function 專門處理所有來自 Google TTS 嘅請求
async function handleGoogleRequest(requestData) {
    if (!client) {
        throw new Error("Google TTS Client is not initialized.");
    }

    const { text, voice = 'yue-HK-Standard-A', speakingRate = 1.0, pitch = 0 } = requestData;
    
    if (!text || text.trim() === '') {
        throw new Error('Text is required for Google TTS');
    }

    const ssmlText = `<speak>${text.replace(/---/g, '<break time="800ms"/>').replace(/--/g, '<break time="500ms"/>')}</speak>`;
    
    const request = {
        input: { ssml: ssmlText },
        voice: { languageCode: 'yue-HK', name: voice },
        audioConfig: { audioEncoding: 'MP3', speakingRate: parseFloat(speakingRate), pitch: parseFloat(pitch) },
    };

    const [response] = await client.synthesizeSpeech(request);
    return response.audioContent.toString('base64');
}

module.exports = { handleGoogleRequest };