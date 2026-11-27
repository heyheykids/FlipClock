// ===== Tauri invoke (v2 全局 API) =====
const invoke = window.__TAURI__?.core?.invoke;

// ===== 全局状态 =====
const state = {
  currentMode: 'clock',
  showSeconds: true,
  use24Hour: true,
  isFullscreen: false,
  bgAlpha: parseFloat(localStorage.getItem('bgAlpha')) || 0.95
};

// ===== 背景透明度 =====
function applyBgAlpha(alpha) {
  state.bgAlpha = alpha;
  document.documentElement.style.setProperty('--bg-alpha', alpha.toFixed(2));
  localStorage.setItem('bgAlpha', alpha.toFixed(2));
}

// ===== 翻页时钟类 =====
class FlipClock {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showSeconds: true,
      showAmPm: false,
      ...options
    };
    this.digits = {}; // 存储各位置的当前值
    this.elements = {}; // 存储DOM元素
    this.build();
  }

  build() {
    this.container.innerHTML = '';
    this.container.className = 'flip-clock';

    // 小时
    this.createDigitGroup('h1');
    this.createDigitGroup('h2');
    this.createSeparator();
    // 分钟
    this.createDigitGroup('m1');
    this.createDigitGroup('m2');

    if (this.options.showSeconds) {
      this.createSeparator(true);
      this.createDigitGroup('s1');
      this.createDigitGroup('s2');
    }

    if (this.options.showAmPm) {
      const ampm = document.createElement('div');
      ampm.className = 'flip-ampm';
      ampm.id = 'ampm-label';
      ampm.textContent = 'AM';
      this.container.appendChild(ampm);
    }
  }

  createDigitGroup(key) {
    const unit = document.createElement('div');
    unit.className = 'flip-unit';

    const group = document.createElement('div');
    group.className = 'flip-group';

    // 静态上半
    const top = document.createElement('div');
    top.className = 'flip-top';
    top.innerHTML = '<span>0</span>';

    // 静态下半
    const bottom = document.createElement('div');
    bottom.className = 'flip-bottom';
    bottom.innerHTML = '<span>0</span>';

    // 动画上半（旧值翻下）
    const topAnim = document.createElement('div');
    topAnim.className = 'flip-top-anim';
    topAnim.style.display = 'none';

    // 动画下半（新值翻上）
    const bottomAnim = document.createElement('div');
    bottomAnim.className = 'flip-bottom-anim';
    bottomAnim.style.display = 'none';

    group.appendChild(top);
    group.appendChild(bottom);
    group.appendChild(topAnim);
    group.appendChild(bottomAnim);

    unit.appendChild(group);
    this.container.appendChild(unit);

    this.digits[key] = '0';
    this.elements[key] = { top, bottom, topAnim, bottomAnim };
  }

  createSeparator(active = false) {
    const sep = document.createElement('div');
    sep.className = 'flip-separator' + (active ? ' active' : '');
    sep.innerHTML = '<div class="dot"></div><div class="dot"></div>';
    this.container.appendChild(sep);
  }

  setDigit(key, newVal) {
    if (!this.elements[key]) return;
    const oldVal = this.digits[key];
    if (oldVal === newVal) return;

    const { top, bottom, topAnim, bottomAnim } = this.elements[key];

    // 设置动画层
    topAnim.innerHTML = `<span>${oldVal}</span>`;
    bottomAnim.innerHTML = `<span>${newVal}</span>`;
    topAnim.style.display = '';
    bottomAnim.style.display = '';

    // 重置动画
    topAnim.classList.remove('flipping');
    bottomAnim.classList.remove('flipping');
    void topAnim.offsetWidth; // 强制重排
    void bottomAnim.offsetWidth;

    // 触发动画
    topAnim.classList.add('flipping');
    bottomAnim.classList.add('flipping');

    // 动画结束后更新静态层
    setTimeout(() => {
      top.innerHTML = `<span>${newVal}</span>`;
      bottom.innerHTML = `<span>${newVal}</span>`;
      topAnim.style.display = 'none';
      bottomAnim.style.display = 'none';
    }, 400);

    this.digits[key] = newVal;
  }

  setTime(timeStr, ampm) {
    // timeStr 格式: "HHMMSS" 或 "HHMM"
    const keys = ['h1', 'h2', 'm1', 'm2'];
    if (this.options.showSeconds) keys.push('s1', 's2');

    for (let i = 0; i < keys.length && i < timeStr.length; i++) {
      this.setDigit(keys[i], timeStr[i]);
    }

    if (this.options.showAmPm) {
      const label = document.getElementById('ampm-label');
      if (label) label.textContent = ampm || '';
    }
  }

  rebuild(options) {
    this.options = { ...this.options, ...options };
    this.digits = {};
    this.elements = {};
    this.build();
  }
}

// ===== 各模式时钟实例 =====
let clockFlip, timerFlip, countdownFlip, pomodoroFlip;

// ===== 闪烁控制 =====
let flashInterval = null;

function startFlash(durationSec = 10) {
  const overlay = document.getElementById('flash-overlay');
  overlay.classList.add('flashing');
  if (flashInterval) clearTimeout(flashInterval);
  flashInterval = setTimeout(() => stopFlash(), durationSec * 1000);
}

function stopFlash() {
  const overlay = document.getElementById('flash-overlay');
  overlay.classList.remove('flashing');
  if (flashInterval) {
    clearTimeout(flashInterval);
    flashInterval = null;
  }
}

// ===== 模式1: 当前时间 =====
function initClock() {
  const container = document.getElementById('clock-time');
  clockFlip = new FlipClock(container, {
    showSeconds: state.showSeconds,
    showAmPm: !state.use24Hour
  });
  updateClock();
}

function updateClock() {
  const now = new Date();
  let h = now.getHours();
  let ampm = '';

  if (!state.use24Hour) {
    ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
  }

  const hh = String(h).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const timeStr = state.showSeconds ? `${hh}${mm}${ss}` : `${hh}${mm}`;
  clockFlip.setTime(timeStr, ampm);
}

setInterval(() => {
  if (state.currentMode === 'clock') updateClock();
}, 1000);

// ===== 模式2: 定时器 =====
let timerInterval = null;
let timerTargetTime = null;

function initTimer() {
  const container = document.getElementById('timer-display');
  timerFlip = new FlipClock(container, {
    showSeconds: state.showSeconds,
    showAmPm: false
  });
  timerFlip.setTime(state.showSeconds ? '000000' : '0000');
}

function startTimer() {
  const input = document.getElementById('timer-target').value;
  if (!input) return;

  const [h, m, s] = input.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, s || 0, 0);

  // 如果目标时间已过，设为明天
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  timerTargetTime = target;

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
  updateTimer();
}

function updateTimer() {
  if (!timerTargetTime) return;

  const now = new Date();
  let diff = timerTargetTime - now;

  if (diff <= 0) {
    // 时间到
    timerFlip.setTime(state.showSeconds ? '000000' : '0000');
    clearInterval(timerInterval);
    timerInterval = null;
    startFlash(10);
    return;
  }

  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  const timeStr = state.showSeconds ? `${hh}${mm}${ss}` : `${hh}${mm}`;
  timerFlip.setTime(timeStr);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerTargetTime = null;
  timerFlip.setTime(state.showSeconds ? '000000' : '0000');
}

// ===== 模式3: 倒计时 =====
let countdownInterval = null;
let countdownEnd = null;

function initCountdown() {
  const container = document.getElementById('countdown-display');
  countdownFlip = new FlipClock(container, {
    showSeconds: state.showSeconds,
    showAmPm: false
  });
  countdownFlip.setTime(state.showSeconds ? '000000' : '0000');
}

function startCountdown() {
  const h = parseInt(document.getElementById('cd-hours').value) || 0;
  const m = parseInt(document.getElementById('cd-minutes').value) || 0;
  const s = parseInt(document.getElementById('cd-seconds').value) || 0;

  const totalSec = h * 3600 + m * 60 + s;
  if (totalSec <= 0) return;

  countdownEnd = Date.now() + totalSec * 1000;

  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(updateCountdown, 1000);
  updateCountdown();
}

function updateCountdown() {
  if (!countdownEnd) return;

  let diff = countdownEnd - Date.now();

  if (diff <= 0) {
    countdownFlip.setTime(state.showSeconds ? '000000' : '0000');
    clearInterval(countdownInterval);
    countdownInterval = null;
    startFlash(10);
    return;
  }

  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  const timeStr = state.showSeconds ? `${hh}${mm}${ss}` : `${hh}${mm}`;
  countdownFlip.setTime(timeStr);
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  countdownEnd = null;
  countdownFlip.setTime(state.showSeconds ? '000000' : '0000');
}

// ===== 模式4: 番茄钟 =====
const POMO_WORK = 25 * 60;   // 25分钟
const POMO_BREAK = 5 * 60;   // 5分钟

let pomoInterval = null;
let pomoEnd = null;
let pomoPhase = 'idle'; // idle | work | break
let pomoCount = 0;

function initPomodoro() {
  const container = document.getElementById('pomodoro-display');
  pomodoroFlip = new FlipClock(container, {
    showSeconds: true,
    showAmPm: false
  });
  pomodoroFlip.setTime('2500');
}

function startPomodoro() {
  if (pomoPhase === 'idle' || pomoPhase === 'finished') {
    pomoPhase = 'work';
    pomoEnd = Date.now() + POMO_WORK * 1000;
    updatePomodoroPhase();
  }

  if (pomoInterval) clearInterval(pomoInterval);
  pomoInterval = setInterval(updatePomodoro, 1000);
  updatePomodoro();
}

function updatePomodoro() {
  if (!pomoEnd) return;

  let diff = pomoEnd - Date.now();

  if (diff <= 0) {
    // 阶段结束
    if (pomoPhase === 'work') {
      pomoCount++;
      pomoPhase = 'break';
      pomoEnd = Date.now() + POMO_BREAK * 1000;
      updatePomodoroPhase();
      startFlash(3);
    } else if (pomoPhase === 'break') {
      pomoPhase = 'work';
      pomoEnd = Date.now() + POMO_WORK * 1000;
      updatePomodoroPhase();
      startFlash(3);
    }
    diff = pomoEnd - Date.now();
  }

  const totalSec = Math.max(0, Math.floor(diff / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;

  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  pomodoroFlip.setTime(`${mm}${ss}`);
}

function updatePomodoroPhase() {
  const phaseEl = document.getElementById('pomo-phase');
  const countEl = document.getElementById('pomo-count');

  if (pomoPhase === 'work') {
    phaseEl.textContent = '工作中';
    phaseEl.className = 'work';
  } else if (pomoPhase === 'break') {
    phaseEl.textContent = '休息中';
    phaseEl.className = 'break';
  } else {
    phaseEl.textContent = '准备开始';
    phaseEl.className = '';
  }

  countEl.textContent = `已完成: ${pomoCount} 个番茄`;
}

function stopPomodoro() {
  if (pomoInterval) {
    clearInterval(pomoInterval);
    pomoInterval = null;
  }
  pomoEnd = null;
  pomoPhase = 'idle';
  updatePomodoroPhase();
  pomodoroFlip.setTime('2500');
}

function resetPomodoro() {
  stopPomodoro();
  pomoCount = 0;
  updatePomodoroPhase();
}

// ===== 重建时钟（秒切换时） =====
function rebuildAllClocks() {
  if (clockFlip) {
    clockFlip.rebuild({ showSeconds: state.showSeconds, showAmPm: !state.use24Hour });
    updateClock();
  }
  if (timerFlip) {
    timerFlip.rebuild({ showSeconds: state.showSeconds, showAmPm: false });
    if (!timerInterval) timerFlip.setTime(state.showSeconds ? '000000' : '0000');
  }
  if (countdownFlip) {
    countdownFlip.rebuild({ showSeconds: state.showSeconds, showAmPm: false });
    if (!countdownInterval) countdownFlip.setTime(state.showSeconds ? '000000' : '0000');
  }
}

// ===== 模式切换 =====
function switchMode(mode) {
  state.currentMode = mode;

  // 隐藏所有面板
  document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));

  // 显示目标面板
  const panel = document.getElementById(`mode-${mode}`);
  if (panel) panel.classList.add('active');

  // 更新侧边栏高亮
  document.querySelectorAll('.sidebar-icon[data-mode]').forEach(icon => {
    icon.classList.toggle('active', icon.dataset.mode === mode);
  });

  // 初始化对应模式的时钟
  if (mode === 'clock' && !clockFlip) initClock();
  if (mode === 'timer' && !timerFlip) initTimer();
  if (mode === 'countdown' && !countdownFlip) initCountdown();
  if (mode === 'pomodoro' && !pomodoroFlip) initPomodoro();
}

// ===== 侧边栏自动隐藏 =====
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  let hideTimer = null;

  // 创建触发区域
  const trigger = document.createElement('div');
  trigger.id = 'sidebar-trigger';
  document.getElementById('app').appendChild(trigger);

  // 鼠标进入右侧触发区 → 显示侧边栏
  trigger.addEventListener('mouseenter', () => {
    sidebar.classList.add('show');
    if (hideTimer) clearTimeout(hideTimer);
  });

  // 鼠标进入侧边栏 → 保持显示
  sidebar.addEventListener('mouseenter', () => {
    sidebar.classList.add('show');
    if (hideTimer) clearTimeout(hideTimer);
  });

  // 鼠标离开侧边栏 → 延迟隐藏
  sidebar.addEventListener('mouseleave', () => {
    hideTimer = setTimeout(() => {
      sidebar.classList.remove('show');
    }, 300);
  });

  // 鼠标离开触发区 → 延迟隐藏
  trigger.addEventListener('mouseleave', () => {
    hideTimer = setTimeout(() => {
      sidebar.classList.remove('show');
    }, 300);
  });

  // 模式切换图标点击
  document.querySelectorAll('.sidebar-icon[data-mode]').forEach(icon => {
    icon.addEventListener('click', () => {
      switchMode(icon.dataset.mode);
    });
  });

  // 秒切换图标
  const secondsToggle = document.getElementById('toggle-seconds');
  if (state.showSeconds) secondsToggle.classList.add('seconds-on');
  secondsToggle.addEventListener('click', () => {
    state.showSeconds = !state.showSeconds;
    secondsToggle.classList.toggle('seconds-on', state.showSeconds);
    rebuildAllClocks();
  });

  // 透明度调节
  const opacityToggle = document.getElementById('toggle-opacity');
  const opacityPanel = document.getElementById('opacity-panel');
  const opacitySlider = document.getElementById('opacity-slider');
  const opacityValue = document.getElementById('opacity-value');

  // 初始化滑块
  const initPct = Math.round(state.bgAlpha * 100);
  opacitySlider.value = initPct;
  opacityValue.textContent = initPct + '%';

  opacityToggle.addEventListener('click', () => {
    const shown = opacityPanel.classList.toggle('show');
    opacityToggle.classList.toggle('opacity-active', shown);
  });

  opacitySlider.addEventListener('input', () => {
    const pct = parseInt(opacitySlider.value);
    const alpha = pct / 100;
    applyBgAlpha(alpha);
    opacityValue.textContent = pct + '%';
  });

  // 点击面板外部关闭（点击侧边栏外区域时关闭）
  document.addEventListener('click', (e) => {
    if (!opacityPanel.contains(e.target) && e.target !== opacityToggle && !opacityToggle.contains(e.target)) {
      opacityPanel.classList.remove('show');
      opacityToggle.classList.remove('opacity-active');
    }
  });
}

// ===== 窗口控制 =====
function initWindowControls() {
  document.getElementById('btn-minimize').addEventListener('click', () => {
    if (invoke) invoke('minimize');
  });

  document.getElementById('btn-close').addEventListener('click', () => {
    if (invoke) invoke('close_app');
  });

  document.getElementById('btn-fullscreen').addEventListener('click', () => {
    if (invoke) invoke('toggle_fullscreen');
  });

  // F11 全屏切换
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F11') {
      e.preventDefault();
      if (invoke) invoke('toggle_fullscreen');
    }
    // Esc 退出闪烁
    if (e.key === 'Escape') {
      stopFlash();
    }
  });
}

// ===== 按钮绑定 =====
function initButtons() {
  // 定时器
  document.getElementById('timer-start').addEventListener('click', startTimer);
  document.getElementById('timer-stop').addEventListener('click', stopTimer);

  // 倒计时
  document.getElementById('cd-start').addEventListener('click', startCountdown);
  document.getElementById('cd-stop').addEventListener('click', stopCountdown);

  // 番茄钟
  document.getElementById('pomo-start').addEventListener('click', startPomodoro);
  document.getElementById('pomo-stop').addEventListener('click', stopPomodoro);
  document.getElementById('pomo-reset').addEventListener('click', resetPomodoro);
}

// ===== 12/24小时切换 =====
function initTimeFormatToggle() {
  // 在时钟模式添加一个 12/24h 切换按钮
  const clockPanel = document.getElementById('mode-clock');
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'format-toggle';
  toggleBtn.textContent = state.use24Hour ? '24H' : '12H';
  toggleBtn.style.cssText = `
    position: absolute;
    bottom: 20px;
    right: 20px;
    background: rgba(255,255,255,0.1);
    color: #ccc;
    border: 1px solid #555;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
  `;
  toggleBtn.addEventListener('click', () => {
    state.use24Hour = !state.use24Hour;
    toggleBtn.textContent = state.use24Hour ? '24H' : '12H';
    rebuildAllClocks();
  });
  clockPanel.appendChild(toggleBtn);
}

// ===== 初始化 =====
window.addEventListener('DOMContentLoaded', () => {
  applyBgAlpha(state.bgAlpha);
  initSidebar();
  initWindowControls();
  initButtons();
  initClock();
  initTimer();
  initCountdown();
  initPomodoro();
  initTimeFormatToggle();
});
