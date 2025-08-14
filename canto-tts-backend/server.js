// ===================================================
// 檔名: server.js (V2 版本 - 智能總機架構)
// ===================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 我哋將唔同語音引擎嘅處理邏輯，分拆成獨立檔案，令程式碼更清晰
// (注意：我哋暫時只會實現 Google 嘅部分)
const { handleGoogleRequest } = require('./engine-google');
// const { handleAzureRequest } = require('./engine-azure'); // 未來會加入
// const { handleAmazonRequest } = require('./engine-amazon'); // 未來會加入
// const { handleMinimaxRequest } = require('./engine-minimax'); // 未來會加入

const app = express();
app.use(cors()); // 為咗簡單起見，暫時允許所有來源
app.use(express.json({ limit: '5mb' }));

// 新嘅 V2 API 路由
app.post('/api/v2/synthesize', async (req, res) => {
    // 從前端請求中，我哋而家會收到一個 'engine' 參數
    const { engine, ...requestData } = req.body;

    console.log(`Received request for engine: ${engine}`);

    // 呢個就係我哋嘅「智能總機」
    try {
        let audioContent;
        switch (engine) {
            case 'google':
                audioContent = await handleGoogleRequest(requestData);
                break;
            // case 'azure':
            //     audioContent = await handleAzureRequest(requestData);
            //     break;
            // case 'amazon':
            //     audioContent = await handleAmazonRequest(requestData);
            //     break;
            // case 'minimax':
            //     audioContent = await handleMinimaxRequest(requestData);
            //     break;
            default:
                // 如果前端傳嚟一個我哋唔識嘅引擎，就回傳錯誤
                return res.status(400).json({ error: `Unknown or unsupported engine: ${engine}` });
        }
        
        res.json({ audioContent });

    } catch (error) {
        console.error(`Error processing request for engine ${engine}:`, error);
        res.status(500).json({ error: `Failed to synthesize speech with ${engine}`, details: error.message });
    }
});

const PORT = process.env.PORT || 3001; // 我哋用 3001 埠，避免同 V1 嘅 3000 混淆
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ V2 Backend Server is running and listening on port ${PORT}`);
});