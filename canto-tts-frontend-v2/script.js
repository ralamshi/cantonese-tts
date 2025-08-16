// ===================================================
// 檔名: script.js (V2.3 - 「見字就讀」完整功能核心)      
// ===================================================
document.addEventListener('DOMContentLoaded', () => {
    // --- 元素選擇器 ---
    const textInput = document.getElementById('text-input');
    const magicButtonsContainer = document.getElementById('magic-buttons-container');
    const voiceAvatarContainer = document.getElementById('voice-avatar-container');
    const speakButton = document.getElementById('speak-button');
    const downloadButton = document.getElementById('download-button');
    const rateSlider = document.getElementById('rate-slider');
    const pitchSlider = document.getElementById('pitch-slider');
    const rateValue = document.getElementById('rate-value');
    const pitchValue = document.getElementById('pitch-value');
    
    // 自訂播放器元素
    const customPlayer = document.getElementById('custom-player');
    const playerPlayPauseBtn = document.getElementById('player-play-pause-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressBarContainer = document.querySelector('.progress-bar-container');
    const currentTimeSpan = document.getElementById('current-time');
    const durationSpan = document.getElementById('duration');
    const audioPlayer = document.getElementById('audio-player');

    // --- 後端 API 地址 ---
    // 本地測試時用呢個 (請確保你嘅 V2 後端喺 3001 port 運行緊)
    const BACKEND_URL = 'http://cantonese-tts-enes.zeabur.internal/api/v2/synthesize';
    // 部署後要換成 Zeabur 嘅 V2 後端網址

    let lastAudioBase64 = null;
    let selectedVoice = null;

    // --- 聲音數據庫 ---
    const voices = [
        { engine: 'google', voice: 'yue-HK-Standard-A', name: '曉美', avatar: 'https://api.iconify.design/fluent-emoji-flat/woman-curly-hair.svg', featured: true },
        { engine: 'google', voice: 'yue-HK-Standard-B', name: '家明', avatar: 'https://api.iconify.design/fluent-emoji-flat/man-beard.svg', featured: true },
        { engine: 'google', voice: 'yue-HK-Standard-C', name: '小晴', avatar: 'https://api.iconify.design/fluent-emoji-flat/girl.svg', featured: true },
        { engine: 'google', voice: 'yue-HK-Standard-D', name: '偉仔', avatar: 'https://api.iconify.design/fluent-emoji-flat/boy.svg', featured: true },
    ];
    
    // --- 「魔法按鈕」數據庫 ---
    const magicButtons = [
        { label: '當數字讀', type: 'cardinal', icon: 'https://api.iconify.design/fluent-emoji-flat/input-numbers.svg' },
        { label: '逐個讀', type: 'characters', icon: 'https://api.iconify.design/fluent-emoji-flat/input-latin-letters.svg' },
        { label: '當序數讀', type: 'ordinal', icon: 'https://api.iconify.design/fluent-emoji-flat/1st-place-medal.svg' },
        { label: '當日期讀', type: 'date', icon: 'https://api.iconify.design/fluent-emoji-flat/tear-off-calendar.svg' },
    ];

    // --- 初始化 ---
    function initialize() {
        renderVoiceAvatars();
        renderMagicButtons();
        setupEventListeners();
    }

    // 1. 渲染聲音頭像
    function renderVoiceAvatars() {
        voiceAvatarContainer.innerHTML = '';
        voices.forEach((voiceData, index) => {
            if (!voiceData.featured) return;

            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'voice-avatar';
            avatarDiv.dataset.voice = voiceData.voice;
            avatarDiv.innerHTML = `<img src="${voiceData.avatar}" alt="${voiceData.name}"><p>${voiceData.name}</p>`;

            if (index === 0) {
                avatarDiv.classList.add('selected');
                selectedVoice = voiceData;
            }
            voiceAvatarContainer.appendChild(avatarDiv);
        });
    }

    // 2. 渲染魔法按鈕
    function renderMagicButtons() {
        magicButtonsContainer.innerHTML = '<h3>魔法演繹：</h3>';
        magicButtons.forEach(buttonData => {
            const button = document.createElement('button');
            button.className = 'magic-btn';
            button.dataset.type = buttonData.type;
            button.innerHTML = `<img src="${buttonData.icon}" alt="${buttonData.label}"><span>${buttonData.label}</span>`;
            magicButtonsContainer.appendChild(button);
        });
    }

    // 3. 設定所有事件監聽
    function setupEventListeners() {
        voiceAvatarContainer.addEventListener('click', (e) => {
            const targetAvatar = e.target.closest('.voice-avatar');
            if (!targetAvatar) return;
            voiceAvatarContainer.querySelectorAll('.voice-avatar').forEach(div => div.classList.remove('selected'));
            targetAvatar.classList.add('selected');
            selectedVoice = voices.find(v => v.voice === targetAvatar.dataset.voice);
        });

        magicButtonsContainer.addEventListener('click', (e) => {
            const targetButton = e.target.closest('.magic-btn');
            if (!targetButton) return;
            applyMagic(targetButton.dataset.type);
        });

        rateSlider.addEventListener('input', () => rateValue.textContent = `${parseFloat(rateSlider.value).toFixed(1)}x`);
        pitchSlider.addEventListener('input', () => {
            const value = parseFloat(pitchSlider.value).toFixed(1);
            pitchValue.textContent = `${value >= 0 ? '+' : ''}${value}`;
        });

        speakButton.addEventListener('click', handleSpeak);
        downloadButton.addEventListener('click', handleDownload);

        playerPlayPauseBtn.addEventListener('click', togglePlayPause);
        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('loadedmetadata', () => {
            durationSpan.textContent = formatTime(audioPlayer.duration);
        });
        audioPlayer.addEventListener('play', () => {
            playerPlayPauseBtn.innerHTML = `<img src="https://api.iconify.design/fluent-emoji-flat/pause-button.svg" alt="Pause">`;
        });
        audioPlayer.addEventListener('pause', () => {
            playerPlayPauseBtn.innerHTML = `<img src="https://api.iconify.design/fluent-emoji-flat/play-button.svg" alt="Play">`;
        });
        audioPlayer.addEventListener('ended', () => {
            customPlayer.classList.add('hidden');
        });
        progressBarContainer.addEventListener('click', setProgress);
    }
    
    // 4. 應用「魔法」(SSML)
    function applyMagic(type) {
        const start = textInput.selectionStart;
        const end = textInput.selectionEnd;
        const selectedText = textInput.value.substring(start, end);

        if (!selectedText) {
            alert('請先用滑鼠揀選你想施展魔法嘅文字！');
            return;
        }

        let format = '';
        if (type === 'date') {
            if (selectedText.includes('-')) format = 'ymd';
            else if (selectedText.includes('/')) format = 'mdy';
        }
        
        const formatAttr = format ? ` format="${format}"` : '';
        const wrappedText = `<say-as interpret-as="${type}"${formatAttr}>${selectedText}</say-as>`;
        
        const newText = textInput.value.substring(0, start) + wrappedText + textInput.value.substring(end);
        textInput.value = newText;
    }

    // 5. 處理「收聽」邏輯
    async function handleSpeak() {
        if (!textInput.value.trim()) { alert('要先打啲字先得㗎！'); return; }
        if (!selectedVoice) { alert('請先揀一個聲音！'); return; }

        speakButton.disabled = true;
        downloadButton.disabled = true;
        customPlayer.classList.add('hidden');
        speakButton.innerHTML = `<img src="https://api.iconify.design/line-md/loading-twotone-loop.svg" alt="Loading"> 轉換中...`;

        try {
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    engine: selectedVoice.engine,
                    text: textInput.value,
                    voice: selectedVoice.voice,
                    speakingRate: rateSlider.value,
                    pitch: pitchSlider.value,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || '伺服器發生錯誤');
            }

            const data = await response.json();
            lastAudioBase64 = data.audioContent;
            audioPlayer.src = `data:audio/mp3;base64,${lastAudioBase64}`;
            audioPlayer.play();
            
            downloadButton.disabled = false;
            customPlayer.classList.remove('hidden');

        } catch (error) {
            console.error('Error:', error);
            alert(`轉換失敗：${error.message}`);
        } finally {
            speakButton.disabled = false;
            speakButton.innerHTML = `<img src="https://api.iconify.design/fluent-emoji-flat/play-button.svg" alt="Play"> 收聽`;
        }
    }

    // 6. 處理「下載」邏輯
    function handleDownload() {
        if (!lastAudioBase64) return;
        const link = document.createElement('a');
        link.href = `data:audio/mp3;base64,${lastAudioBase64}`;
        link.download = '見字就讀.mp3';
        link.click();
    }

    // 7. 播放器控制功能
    function togglePlayPause() {
        if (audioPlayer.paused) {
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
    }

    function updateProgress() {
        if (audioPlayer.duration) {
            const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressBar.style.width = `${percentage}%`;
            currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
        }
    }

    function setProgress(e) {
        const width = progressBarContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = audioPlayer.duration;
        if(duration) {
            audioPlayer.currentTime = (clickX / width) * duration;
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // --- 啟動！ ---
    initialize();
});
