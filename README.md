# ✨ 進階廣東話文字轉語音 (Advanced Cantonese TTS)

呢個係一個功能強大、介面現代化嘅廣東話文字轉語音（TTS）網上工具。使用者可以輸入任何廣東話文字，並即時轉換成自然流暢嘅語音。此專案由零開始，一步步構建出一個完整嘅前後端分離應用，並成功部署上線。

**👉 [立即體驗 Live Demo](https://cantonesetts.zeabur.app/)**

<!-- 建議：你可以將一張靚仔嘅網站截圖上傳到 GitHub issue 或其他地方，然後喺下面呢行換咗 src 嘅 URL -->
<p align="center">
  <img src="https://i.imgur.com/wVv5s9o.png" alt="應用程式截圖" width="800"/>
</p>

---

## 🚀 主要功能 (Key Features)

*   **即時語音合成:** 輸入文字即可轉換為高品質嘅廣東話語音。
*   **多種聲音選擇:** 提供多款由 Google Cloud 提供嘅男聲及女聲。
*   **參數自由調校:** 可自由調節語音嘅**速度 (Speaking Rate)** 同**音高 (Pitch)**。
*   **SSML 簡易控制:** 使用簡單符號 (`--` 及 `---`) 即可喺句子中加入不同長度嘅停頓。
*   **多工作區:** 提供三個獨立嘅文字輸入區塊，方便處理不同內容。
*   **實用工具集:**
    *   **一鍵下載:** 將生成嘅語音下載為 MP3 檔案。
    *   **複製文字:** 方便地複製輸入框內嘅所有文字。
    *   **清除內容:** 快速清空單一區塊嘅所有設定。
*   **智慧體驗:**
    *   **自動儲存:** 所有輸入內容同設定都會自動儲存喺瀏覽器，重新整理頁面亦唔會遺失。
    *   **分享設定:** 可以為單一區塊產生一個獨特嘅分享連結，其他人打開即可見到完全相同嘅設定。
*   **現代化介面:** 採用玻璃擬態 (Glassmorphism) 設計風格，介面美觀，互動流暢。

---

## 🛠️ 技術棧 (Tech Stack)

呢個專案採用前後端分離嘅架構。

*   **前端 (Frontend):**
    *   **框架:** Vanilla JavaScript (無框架，原生 JS)
    *   **結構:** HTML5
    *   **樣式:** CSS3 (Flexbox, Grid, Custom Properties)
    *   **圖示庫:** Font Awesome

*   **後端 (Backend):**
    *   **環境:** Node.js
    *   **框架:** Express.js
    *   **核心服務:** `@google-cloud/text-to-speech`

*   **核心 API:**
    *   [Google Cloud Text-to-Speech API](https://cloud.google.com/text-to-speech)

*   **部署 (Deployment):**
    *   **平台:** [Zeabur](https://zeabur.com/) (一站式部署前後端服務)
    *   **版本控制:** Git & GitHub

---

## 📁 專案結構

本專案採用 Monorepo (單一儲存庫多專案) 的方式進行管理。
/
├── canto-tts-backend/ # 後端 Node.js 服務
│ ├── server.js # Express 伺服器主程式
│ ├── package.json # 專案依賴
│ └── ...
├── canto-tts-frontend/ # 前端靜態網站
│ ├── index.html # 網站結構
│ ├── style.css # 網站樣式
│ └── script.js # 網站互動邏輯
├── .gitignore # 忽略唔需要上傳嘅檔案
└── README.md # 就係你而家睇緊嘅呢個檔案

---

## ⚙️ 本地安裝與運行

想喺自己電腦上運行呢個專案？請跟住以下步驟：

**事前準備:**
1.  安裝 [Node.js](https://nodejs.org/) (建議 v18 或以上版本)
2.  安裝 [Git](https://git-scm.com/)
3.  擁有一個 Google Cloud 帳戶並已啟用 Text-to-Speech API，同時下載咗你嘅 JSON 金鑰檔案。

**安裝步驟:**

1.  **Clone (複製) 呢個 repository:**
    ```bash
    git clone https://github.com/ralamshi/cantonese-tts.git
    cd cantonese-tts
    ```

2.  **設定後端:**
    ```bash
    # 進入後端資料夾
    cd canto-tts-backend

    # 安裝所有依賴套件
    npm install

    # 將你嘅 Google Cloud JSON 金鑰檔案複製到此資料夾，並命名為 google-credentials.json
    
    # 建立一個 .env 檔案並寫入內容
    echo 'GOOGLE_APPLICATION_CREDENTIALS="google-credentials.json"' > .env
    ```

3.  **運行後端伺服器:**
    ```bash
    # 喺 canto-tts-backend 資料夾入面執行
    node server.js
    # 你應該會見到 "Server is running..." 嘅訊息
    ```

4.  **設定前端:**
    *   打開 `canto-tts-frontend/script.js` 檔案。
    *   搵到 `BACKEND_URL` 變數，將佢嘅值改成本地後端地址：
        ```javascript
        const BACKEND_URL = 'http://localhost:3000/api/synthesize';
        ```

5.  **運行前端:**
    *   直接用瀏覽器打開 `canto-tts-frontend/index.html` 檔案即可！

---

## 🙏 致謝

*   **Google Cloud** 提供強大而穩定嘅語音合成 API。
*   **Zeabur** 提供極之方便快捷嘅一站式部署體驗。

---

## 📜 授權 (License)

本專案採用 MIT License 授權。