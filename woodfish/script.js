/* ─── 配置常量 ────────────────────────────────────────────────────── */
const CONFIG = {
    STORAGE_KEY: 'woodfish_merit',
    AUTO_CLICK_INTERVAL: 500, // 自动点击间隔(ms)
};

/* ─── 状态管理 ────────────────────────────────────────────────────── */
let state = {
    merit: 0,
    maxCombo: 0,
    todayMerit: 0,
    lastDate: null,
    isAutoClick: false,
    autoClickTimer: null,
    soundEnabled: true,
    audioContext: null
};

/* ─── DOM 元素 ────────────────────────────────────────────────────── */
const elements = {
    meritCount: null,
    maxCombo: null,
    todayMerit: null,
    woodfish: null,
    mallet: null,
    clickEffect: null,
    resetBtn: null,
    soundBtn: null,
    autoBtn: null
};

/* ─── 初始化 ──────────────────────────────────────────────────────── */
function init() {
    // 获取 DOM 元素
    elements.meritCount = document.getElementById('meritCount');
    elements.maxCombo = document.getElementById('maxCombo');
    elements.todayMerit = document.getElementById('todayMerit');
    elements.woodfish = document.getElementById('woodfish');
    elements.mallet = document.getElementById('mallet');
    elements.clickEffect = document.getElementById('clickEffect');
    elements.resetBtn = document.getElementById('resetBtn');
    elements.soundBtn = document.getElementById('soundBtn');
    elements.autoBtn = document.getElementById('autoBtn');

    // 加载保存的数据
    loadState();

    // 更新 UI
    updateUI();

    // 绑定事件
    bindEvents();

    // 检查是否是新的一天
    checkNewDay();
}

/* ─── 绑定事件 ────────────────────────────────────────────────────── */
function bindEvents() {
    // 木鱼点击事件
    elements.woodfish.addEventListener('click', handleWoodfishClick);
    elements.woodfish.addEventListener('touchstart', handleWoodfishTouch);

    // 按钮事件
    elements.resetBtn.addEventListener('click', handleReset);
    elements.soundBtn.addEventListener('click', toggleSound);
    elements.autoBtn.addEventListener('click', toggleAutoClick);

    // 键盘事件
    document.addEventListener('keydown', handleKeyPress);
}

/* ─── 木鱼点击处理 ────────────────────────────────────────────────── */
function handleWoodfishClick(e) {
    e.preventDefault();
    playWoodfish();
}

function handleWoodfishTouch(e) {
    e.preventDefault();
    playWoodfish();
}

/* ─── 敲木鱼 ──────────────────────────────────────────────────────── */
function playWoodfish() {
    // 增加功德
    state.merit++;
    state.todayMerit++;

    // 更新最高连击
    if (state.merit > state.maxCombo) {
        state.maxCombo = state.merit;
    }

    // 播放音效
    if (state.soundEnabled) {
        playWoodfishSound();
    }

    // 动画效果
    animateWoodfish();
    animateMallet();
    showClickEffect();
    pulseMeritCount();

    // 更新 UI
    updateUI();

    // 保存状态
    saveState();
}

/* ─── 动画效果 ────────────────────────────────────────────────────── */
function animateWoodfish() {
    elements.woodfish.classList.add('clicked');
    setTimeout(() => {
        elements.woodfish.classList.remove('clicked');
    }, 100);
}

function animateMallet() {
    elements.mallet.classList.add('hit');
    setTimeout(() => {
        elements.mallet.classList.remove('hit');
    }, 100);
}

function showClickEffect() {
    elements.clickEffect.classList.remove('show');
    void elements.clickEffect.offsetWidth; // 触发重排
    elements.clickEffect.classList.add('show');
}

function pulseMeritCount() {
    elements.meritCount.classList.add('pulse');
    setTimeout(() => {
        elements.meritCount.classList.remove('pulse');
    }, 150);
}

/* ─── 音效播放 ────────────────────────────────────────────────────── */
function initAudioContext() {
    if (!state.audioContext) {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return state.audioContext;
}

function playWoodfishSound() {
    try {
        const ctx = initAudioContext();

        // 创建振荡器
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // 设置声音参数
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

        // 设置音量包络
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        // 连接节点
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // 播放
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    } catch (error) {
        console.error('音频播放失败:', error);
    }
}

function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    elements.soundBtn.classList.toggle('active', state.soundEnabled);
    saveState();
}

/* ─── 自动点击 ────────────────────────────────────────────────────── */
function toggleAutoClick() {
    state.isAutoClick = !state.isAutoClick;
    elements.autoBtn.classList.toggle('active', state.isAutoClick);

    if (state.isAutoClick) {
        state.autoClickTimer = setInterval(() => {
            playWoodfish();
        }, CONFIG.AUTO_CLICK_INTERVAL);
    } else {
        clearInterval(state.autoClickTimer);
    }
}

/* ─── 键盘处理 ────────────────────────────────────────────────────── */
function handleKeyPress(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        playWoodfish();
    }
}

/* ─── 重置功能 ────────────────────────────────────────────────────── */
function handleReset() {
    if (confirm('确定要重置功德计数吗？')) {
        state.merit = 0;
        state.maxCombo = 0;
        updateUI();
        saveState();
    }
}

/* ─── UI 更新 ────────────────────────────────────────────────────── */
function updateUI() {
    elements.meritCount.textContent = state.merit.toLocaleString();
    elements.maxCombo.textContent = state.maxCombo.toLocaleString();
    elements.todayMerit.textContent = state.todayMerit.toLocaleString();

    // 更新按钮状态
    elements.soundBtn.classList.toggle('active', state.soundEnabled);
    elements.autoBtn.classList.toggle('active', state.isAutoClick);
}

/* ─── 状态持久化 ────────────────────────────────────────────────── */
function loadState() {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            state.merit = data.merit || 0;
            state.maxCombo = data.maxCombo || 0;
            state.todayMerit = data.todayMerit || 0;
            state.lastDate = data.lastDate || null;
            state.soundEnabled = data.soundEnabled !== undefined ? data.soundEnabled : true;
        }
    } catch (error) {
        console.error('加载状态失败:', error);
    }
}

function saveState() {
    try {
        const data = {
            merit: state.merit,
            maxCombo: state.maxCombo,
            todayMerit: state.todayMerit,
            lastDate: state.lastDate,
            soundEnabled: state.soundEnabled
        };
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('保存状态失败:', error);
    }
}

/* ─── 检查新的一天 ────────────────────────────────────────────────── */
function checkNewDay() {
    const today = new Date().toDateString();
    const lastDate = state.lastDate;

    if (lastDate && lastDate !== today) {
        // 新的一天，重置今日功德
        state.todayMerit = 0;
        state.lastDate = today;
        saveState();
    } else if (!lastDate) {
        // 首次访问
        state.lastDate = today;
        saveState();
    }
}

/* ─── 启动应用 ────────────────────────────────────────────────────── */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
