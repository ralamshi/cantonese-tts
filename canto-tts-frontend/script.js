document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    const template = document.querySelector('.tts-block-template');
    const globalAudioPlayer = document.getElementById('global-audio-player');
    
    const BACKEND_URL = 'https://cantonesetts.zeabur.app/api/synthesize';
    const audioDataMap = new Map();

    function init() {
        for (let i = 0; i < 3; i++) {
            const block = template.cloneNode(true);
            block.classList.remove('tts-block-template');
            block.classList.add('tts-block');
            block.style.display = 'flex';
            block.dataset.index = i;
            block.style.setProperty('--i', i);
            appContainer.appendChild(block);
        }
        
        loadStateFromStorage();
        loadStateFromURL();
        setupEventListeners();
        
        document.querySelectorAll('.tts-block').forEach(block => {
            updateAllVisuals(block);
            updateDownloadButtonState(block); // 初始化時禁用下載掣
        });
    }

    function setupEventListeners() {
        appContainer.addEventListener('click', handleActionClick);
        appContainer.addEventListener('input', handleInputChange);
    }

    function handleActionClick(e) {
        const button = e.target.closest('.action-btn');
        if (!button || button.disabled) return;

        const block = button.closest('.tts-block');
        if (button.classList.contains('listen-btn')) synthesizeSpeech(block);
        else if (button.classList.contains('download-btn')) downloadAudio(block);
        else if (button.classList.contains('copy-btn')) copyText(block, button);
        else if (button.classList.contains('clear-btn')) clearBlock(block);
        else if (button.classList.contains('share-btn')) shareSettings(block, button);
    }
    
    function handleInputChange(e) {
        const block = e.target.closest('.tts-block');
        if (!block) return;
        
        if (e.target.matches('.rate-slider, .pitch-slider')) updateSliderValue(e.target);
        if (e.target.matches('.text-input')) updateCharCounter(e.target);
        saveState();
    }

    async function synthesizeSpeech(block) {
        const listenButton = block.querySelector('.listen-btn');
        let text = block.querySelector('.text-input').value.trim();
        if (!text) { alert('請先輸入文字！'); return; }

        text = text.replace(/---/g, '<break time="800ms"/>').replace(/--/g, '<break time="500ms"/>');
        
        const originalIconHTML = listenButton.innerHTML;
        listenButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 轉換中';
        setControlsDisabled(block, true); // **修正點**: 鎖上所有掣

        try {
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    voice: block.querySelector('.voice-select').value,
                    speakingRate: block.querySelector('.rate-slider').value,
                    pitch: block.querySelector('.pitch-slider').value,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`伺服器錯誤: ${errorData.details || response.statusText}`);
            }

            const data = await response.json();
            audioDataMap.set(block, data.audioContent);
            globalAudioPlayer.src = `data:audio/mp3;base64,${data.audioContent}`;
            globalAudioPlayer.play();
            updateDownloadButtonState(block); // 產生語音後，啟用下載掣
        } catch (error) {
            console.error('Error:', error);
            alert(`轉換失敗：${error.message}`);
        } finally {
            listenButton.innerHTML = originalIconHTML;
            setControlsDisabled(block, false); // **修正點**: 解鎖所有掣
        }
    }

    function downloadAudio(block) {
        const audioBase64 = audioDataMap.get(block);
        if (!audioBase64) { alert('請先點擊「收聽」生成語音後才能下載！'); return; }

        const link = document.createElement('a');
        link.href = `data:audio/mp3;base64,${audioBase64}`;
        link.download = `cantonese-tts-${Date.now()}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function copyText(block, button) {
        const textInput = block.querySelector('.text-input');
        navigator.clipboard.writeText(textInput.value).then(() => {
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fa-solid fa-check"></i> 已複製';
            button.classList.add('copy-success');
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('copy-success');
            }, 1500);
        }).catch(err => alert('複製失敗: ', err));
    }

    function clearBlock(block) {
        block.querySelector('.text-input').value = '';
        block.querySelector('.voice-select').value = 'yue-HK-Standard-A';
        block.querySelector('.rate-slider').value = 1.0;
        block.querySelector('.pitch-slider').value = 0;
        audioDataMap.delete(block); // 清除已儲存嘅音訊
        updateAllVisuals(block);
        updateDownloadButtonState(block); // 禁用下載掣
        saveState();
    }

    function shareSettings(block, button) {
        const state = getBlockState(block);
        const encodedState = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
        const url = `${window.location.origin}${window.location.pathname}#${encodedState}`;
        
        navigator.clipboard.writeText(url).then(() => {
             const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fa-solid fa-check"></i> 已複製';
            setTimeout(() => { button.innerHTML = originalHTML; }, 2000);
        });
    }

    function getBlockState(block) { /* ... 保持不變 ... */ return { text: block.querySelector('.text-input').value, voice: block.querySelector('.voice-select').value, rate: block.querySelector('.rate-slider').value, pitch: block.querySelector('.pitch-slider').value }; }
    function setBlockState(block, state) { /* ... 保持不變 ... */ block.querySelector('.text-input').value = state.text; block.querySelector('.voice-select').value = state.voice; block.querySelector('.rate-slider').value = state.rate; block.querySelector('.pitch-slider').value = state.pitch; }
    function saveState() { /* ... 保持不變 ... */ const allStates = Array.from(document.querySelectorAll('.tts-block')).map(getBlockState); localStorage.setItem('tts-app-state', JSON.stringify(allStates)); }
    function loadStateFromStorage() { /* ... 保持不變 ... */ const savedState = localStorage.getItem('tts-app-state'); if (!savedState) return; const allStates = JSON.parse(savedState); document.querySelectorAll('.tts-block').forEach((block, index) => { if (allStates[index]) setBlockState(block, allStates[index]); }); }
    function loadStateFromURL() { /* ... 保持不變 ... */ if (!window.location.hash) return; try { const encodedState = window.location.hash.substring(1); const state = JSON.parse(decodeURIComponent(escape(atob(encodedState)))); const firstBlock = document.querySelector('.tts-block'); setBlockState(firstBlock, state); history.pushState("", document.title, window.location.pathname + window.location.search); alert('已從分享連結載入設定到第一個區塊！'); } catch (e) { console.error("Failed to load state from URL hash", e); } }
    function updateAllVisuals(block) { /* ... 保持不變 ... */ updateSliderValue(block.querySelector('.rate-slider')); updateSliderValue(block.querySelector('.pitch-slider')); updateCharCounter(block.querySelector('.text-input')); }
    function updateSliderValue(slider) { /* ... 保持不變 ... */ const valueSpan = slider.closest('.control-item').querySelector('.slider-value'); valueSpan.textContent = parseFloat(slider.value).toFixed(1); }
    function updateCharCounter(input) { /* ... 保持不變 ... */ const counter = input.closest('.textarea-container').querySelector('.char-counter'); counter.textContent = input.value.length; }

    // --- 全新同已修正嘅函數 ---

    function setControlsDisabled(block, isDisabled) {
        // 呢個函數而家會正確地鎖上同解鎖所有控制項
        block.querySelectorAll('select, input, button').forEach(control => {
            control.disabled = isDisabled;
        });
        block.style.transition = 'opacity 0.2s';
        block.style.opacity = isDisabled ? 0.6 : 1;
    }

    function updateDownloadButtonState(block) {
        // 根據係咪有音訊嚟決定「下載」掣嘅狀態
        const downloadBtn = block.querySelector('.download-btn');
        const hasAudio = audioDataMap.has(block);
        downloadBtn.disabled = !hasAudio;
    }

    init();
});
