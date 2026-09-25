// ============================================================
// Mobile Assistant 2.0
// ============================================================

// ============================================================
// 1. СИНХРОНИЗАЦИЯ ОБЪЁМ ↔ ВЕС ↔ ПЛОТНОСТЬ
// ============================================================

let lastFillSource = 'vol';

function syncVolumeWeight(source) {
    const volEl = document.getElementById('volumeInput');
    const wEl   = document.getElementById('weightInput');
    const dEl   = document.getElementById('densityInput');

    let d = parseFloat(dEl.value) || 1.0;
    if (d < 0.75) d = 0.75;
    if (d > 1.30) d = 1.30;
    if (parseFloat(dEl.value) !== d) dEl.value = d.toFixed(2);

    if (source === 'vol') {
        const v = parseFloat(volEl.value) || 0;
        wEl.value = (v * d).toFixed(1);
        lastFillSource = 'vol';
    } else if (source === 'weight') {
        const w = parseFloat(wEl.value) || 0;
        volEl.value = (w / d).toFixed(1);
        lastFillSource = 'weight';
    } else if (source === 'density') {
        if (lastFillSource === 'vol') {
            const v = parseFloat(volEl.value) || 0;
            wEl.value = (v * d).toFixed(1);
        } else {
            const w = parseFloat(wEl.value) || 0;
            volEl.value = (w / d).toFixed(1);
        }
    }
    runUniversalCalculation();
}

// ============================================================
// 2. ОСНОВНОЙ РАСЧЁТ ДЛЯ НАЛИВА
// ============================================================

function runUniversalCalculation() {
    const line = document.getElementById('lineSelect').value;
    const rawHeight = document.getElementById('bottleHeightInput').value;
    const rawVol = document.getElementById('volumeInput').value;
    const rawVisc = document.getElementById('viscosityInput').value;
    const rawDensity = document.getElementById('densityInput').value;

    const bottleHeight = rawHeight ? parseFloat(rawHeight) : 245;
    const vol = rawVol ? parseFloat(rawVol) : 600;
    const visc = rawVisc ? parseFloat(rawVisc) : 0;
    const density = rawDensity ? parseFloat(rawDensity) : 1.0;

    if (bottleHeight <= 0 || vol <= 0 || visc < 0 || density <= 0) return;

    let lineNum = "1.1";
    if (line === "LINE_1_2") lineNum = "1.2";
    if (line === "LINE_1_3") lineNum = "1.3";
    if (line === "LINE_1_4") lineNum = "1.4";
    if (line === "LINE_1_5") lineNum = "1.5";
    if (line === "LINE_1_6") lineNum = "1.6";

    const isWideNozzle = (line === "LINE_1_4" || line === "LINE_1_6");
    const nozzleAreaFactor = isWideNozzle ? 1.0 : 1.89;

    const vF = Math.min(visc / 8000, 1.0);

    let speed1 = 40 + 5 * vF;
    let speed2 = 70 + 5 * vF;
    let speed3 = 40 + 5 * vF;

    if (!isWideNozzle && visc > 3000) {
        speed1 = 20 + 25 * vF;
        speed2 = 45 + 25 * vF;
        speed3 = 20 + 25 * vF;
    }

    if (visc < 800) {
        const liquidDamping = 0.85 + (0.15 * (visc / 800));
        speed1 = speed1 * liquidDamping;
        speed3 = speed3 * liquidDamping;
    }

    let k_t2 = 0.20, k_t3 = 0.85;
    let isSmallLiquidFormat = (vol <= 1000 && visc < 500 && !isWideNozzle);

    let ls1 = 0, ls2 = 0, ls3 = 0;
    let bp = 0, tp = 0, wp = 0;
    let np1 = 0, np2 = 0, np3 = 0;
    let sh_in_c = 0, sh_in_o = 0, sh_out_c = 0;
    let conv_m = 60.00, conv_l = 0.00;
    let tr_down = 100;
    let delay = 0.0;

    if (isSmallLiquidFormat) {
        speed1 = 25.00;
        speed2 = 48.00;
        speed3 = 28.00;
        k_t2 = 0.10;
        k_t3 = 0.73;

        ls1 = 70; ls2 = 75; ls3 = 65;
        bp = 35;
        tp = Math.round(bottleHeight - 30);
        wp = Math.round(bottleHeight + 74);
        np1 = 40;
        np2 = Math.round(bottleHeight * 0.20);
        np3 = Math.round(bottleHeight * 0.80);

        conv_m = 60.00;
        conv_l = 0.00;
        sh_in_c = 0.0; sh_in_o = 0.5; sh_out_c = 0.2;
        delay = 1.0;

    } else if (line === "LINE_1_6") {
        if (vol >= 4500 && vol <= 5500 && visc <= 100) {
            speed1 = 60.00; speed2 = 80.00; speed3 = 40.00;
            k_t2 = 0.16; k_t3 = 0.98;
            ls1 = 10; ls2 = 15; ls3 = 10;
            bp = 30; tp = 200; wp = 345;
            np1 = 30; np2 = 80; np3 = 192;
            conv_m = 80.00; conv_l = 25.00;
            sh_in_c = 0.0; sh_in_o = 1.0; sh_out_c = 0.0;
            tr_down = 100;
            delay = 2.5;

        } else if (vol >= 900 && vol <= 1100 && visc === 0) {
            speed1 = 30.00; speed2 = 55.00; speed3 = 18.00;
            k_t2 = 0.245; k_t3 = 0.888;
            ls1 = 30; ls2 = 50; ls3 = 30;
            bp = 40;
            tp = Math.round(bottleHeight - 30);
            wp = Math.round(bottleHeight + 100);
            np1 = 40;
            np2 = Math.round(bottleHeight * 0.20);
            np3 = Math.round(bottleHeight * 0.80);
            conv_m = 60.00; conv_l = 0.00;
            sh_in_c = 0.0; sh_in_o = 0.5; sh_out_c = 0.2;
            tr_down = 100;
            delay = 1.0;

        } else {
            speed1 = 40 + 5 * vF;
            speed2 = 70 + 5 * vF;
            speed3 = 40 + 5 * vF;
            if (visc < 800) {
                const liquidDamping = 0.85 + (0.15 * (visc / 800));
                speed1 = speed1 * liquidDamping;
                speed3 = speed3 * liquidDamping;
            }
            speed1 = Math.min(speed1, 100.00);
            speed2 = Math.min(speed2, 100.00);
            speed3 = Math.min(speed3, 100.00);

            const heightFactor = bottleHeight / 230;
            const volumeFactor = 1000 / vol;
            const viscosityFactor = 1 + (1 - vF) * 0.5;
            const baseLiftSpeed = Math.round(30 * heightFactor * volumeFactor * viscosityFactor);

            ls1 = Math.max(Math.round(baseLiftSpeed * 0.6), 10);
            ls2 = Math.max(Math.round(baseLiftSpeed * 1.0), 10);
            ls3 = Math.max(Math.round(baseLiftSpeed * 0.6), 10);
            ls1 = Math.min(ls1, 100); ls2 = Math.min(ls2, 100); ls3 = Math.min(ls3, 100);

            bp = 40;
            tp = Math.round(bottleHeight - 30);
            wp = Math.round(bottleHeight + 100);
            np1 = 40;
            np2 = Math.round(bottleHeight * 0.20);
            np3 = Math.round(bottleHeight * 0.80);

            conv_m = 70.00; conv_l = 15.00;
            sh_in_c = 0.5; sh_in_o = 0.0; sh_out_c = 0.0;

            let calculatedDelay = (vol / 5000) * (80 / speed1) * (1.0 - vF);
            delay = parseFloat(Math.max(calculatedDelay, 1.0).toFixed(1));
            tr_down = 100;
        }

    } else if (vol <= 1500) {
        speed1 = speed1 * 0.92;
        speed2 = speed2 * 0.92;
        speed3 = speed3 * 0.92;

        const baseMultiplier = 43.5;
        const kinematicsFactor = (speed2 / bottleHeight) * baseMultiplier * nozzleAreaFactor;
        let baseLiftSpeed = Math.round(kinematicsFactor * (1.0 + 0.35 * vF));
        baseLiftSpeed = Math.max(baseLiftSpeed, 15);

        ls2 = baseLiftSpeed;
        ls1 = Math.max(Math.round(ls2 * 0.9), 15);
        ls3 = Math.max(Math.round(ls2 * 0.85), 15);

        bp = 40;
        tp = Math.round(bottleHeight - 30);
        wp = Math.round(bottleHeight + 100);
        np1 = 40;
        np2 = Math.round(bottleHeight * 0.20);
        np3 = Math.round(bottleHeight * 0.80);

        conv_m = 60.00; conv_l = 0.00;
        sh_in_c = 0.0; sh_in_o = 0.5; sh_out_c = 0.2;

        let calculatedDelay = (vol / 5000) * (80 / speed1) * (1.0 - vF);
        delay = parseFloat(Math.max(calculatedDelay, 1.0).toFixed(1));

    } else {
        let baseMultiplier;
        if (vol > 3000) baseMultiplier = 65.0;
        else baseMultiplier = 51.5;

        const kinematicsFactor = (speed2 / bottleHeight) * baseMultiplier * nozzleAreaFactor;
        let baseLiftSpeed = Math.round(kinematicsFactor * (1.0 + 0.35 * vF));
        baseLiftSpeed = Math.max(baseLiftSpeed, 15);

        ls2 = baseLiftSpeed;
        ls1 = Math.max(Math.round(ls2 * 0.9), 15);
        ls3 = Math.max(Math.round(ls2 * 0.85), 15);

        bp = 40;
        tp = Math.round(bottleHeight - 30);
        wp = Math.round(bottleHeight + 100);
        np1 = 40;
        np2 = Math.round(bottleHeight * 0.20);
        np3 = Math.round(bottleHeight * 0.80);

        conv_m = 70.00; conv_l = 15.00;
        sh_in_c = 0.5; sh_in_o = 0.0; sh_out_c = 0.0;

        let calculatedDelay = (vol / 5000) * (80 / speed1) * (1.0 - vF);
        delay = parseFloat(Math.max(calculatedDelay, 1.0).toFixed(1));
    }

    speed1 = Math.min(speed1, 100.00);
    speed2 = Math.min(speed2, 100.00);
    speed3 = Math.min(speed3, 100.00);
    ls1 = Math.min(ls1, 100);
    ls2 = Math.min(ls2, 100);
    ls3 = Math.min(ls3, 100);

    // === Расчёт веса из явной плотности ===
    const tw = Math.round(vol * density);

    let t2 = Math.round(tw * k_t2);
    let t3 = Math.round(tw * k_t3);

    const prodLabel = "РЕЦЕПТ № " + lineNum;
    const stopConv = (vol <= 1000);

    let pumpSpeed2Display;
    if (visc > 1000) {
        const topPourSpeed = speed2 * 0.88;
        pumpSpeed2Display = "(ВЕРХН.) " + topPourSpeed.toFixed(2) + "  (ДОН.) " + speed2.toFixed(2);
    } else {
        pumpSpeed2Display = speed2.toFixed(2);
    }

    const fields = {
        'val_lift_speed_3': ls3,
        'val_nozzle_pos_3': np3,
        'val_lift_speed_2': ls2,
        'val_nozzle_pos_2': np2,
        'val_lift_speed_1': ls1,
        'val_nozzle_pos_1': np1,
        'val_pump_speed_3': speed3.toFixed(2),
        'val_trans_volume_3': t3,
        'val_pump_speed_2': pumpSpeed2Display,
        'val_trans_volume_2': t2,
        'val_pump_speed_1': speed1.toFixed(2),
        'val_wait_point': wp,
        'val_top_pour': tp,
        'val_bottom_pos': bp,
        'val_total_weight': tw,
        'val_shiber_close_in': sh_in_c.toFixed(1),
        'val_shiber_open_in': sh_in_o.toFixed(1),
        'val_shiber_close_out': sh_out_c.toFixed(1),
        'val_traverse_down_speed': tr_down,
        'val_conveyor_main_speed': conv_m.toFixed(2),
        'val_conveyor_low_speed': conv_l.toFixed(2),
        'val_line_num': lineNum,
        'val_product_label': prodLabel,
        'sub_nozzle_lift_delay': delay.toFixed(1) + " с"
    };

    for (let [id, val] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    const badge = document.getElementById('sub_conveyor_stop_badge');
    if (badge) {
        badge.textContent = stopConv ? "ЗАПУСТИТЬ (ОСТАНОВ АКТИВЕН)" : "ОСТАНОВИТЬ (ХОД НЕПРЕРЫВЕН)";
        badge.className = stopConv ? "badge badge-top-active" : "badge badge-stop-disabled";
    }

    const noticeEl = document.getElementById('viscosityNotice');
    if (noticeEl) {
        noticeEl.style.display = visc > 1000 ? 'block' : 'none';
    }
}

// ============================================================
// 3. ЛОГИКА ВКЛАДОК
// ============================================================

function switchTab(tabName) {
    ['filling', 'labeling', 'capping', 'help'].forEach(t => {
        const content = document.getElementById(`content-${t}`);
        const btn = document.getElementById(`btn-tab-${t}`);
        if (content) content.classList.toggle('tab-content-active', t === tabName);
        if (btn) btn.classList.toggle('tab-active', t === tabName);
    });
}

// ============================================================
// 4. КАЛЬКУЛЯТОР ЭТИКЕТОВЩИКА
// ============================================================

const LABELER_DEFAULTS_LINE_1_1 = {
    conveyor: { a: 2.86, b: 0, maxHz: 60 },
    press:    { a: 4.55, b: 0, maxHz: 90 },
    roller:   { a: 2.14, b: 0, maxHz: 60 }
};

const ENG_STORAGE_KEY = 'line-assistant-labeler-coeffs';
const ENG_PIN_KEY     = 'line-assistant-eng-pin';
const DEFAULT_PIN     = '2801';
const KNOWN_LINES     = ['LINE_1_1','LINE_1_2','LINE_1_3','LINE_1_4','LINE_1_5','LINE_1_6'];

let labelerCoeffs      = {};
let labelerMode        = 'speed';

let engDirty            = false;
let engSnapshot         = null;
let engPinUnlocked      = false;
let engPrevLine         = null;
let pendingEngAction    = null;

function emptyDrive() {
    return { a: null, b: null, r2: null, points: [], maxHz: null, calibrated: null };
}

function initEngStorage() {
    try {
        labelerCoeffs = JSON.parse(localStorage.getItem(ENG_STORAGE_KEY)) || {};
    } catch { labelerCoeffs = {}; }

    KNOWN_LINES.forEach(l => {
        if (!labelerCoeffs[l]) {
            if (l === 'LINE_1_1') {
                labelerCoeffs[l] = {
                    conveyor: { ...LABELER_DEFAULTS_LINE_1_1.conveyor, r2: null, points: [], calibrated: 'factory' },
                    press:    { ...LABELER_DEFAULTS_LINE_1_1.press,    r2: null, points: [], calibrated: 'factory' },
                    roller:   { ...LABELER_DEFAULTS_LINE_1_1.roller,   r2: null, points: [], calibrated: 'factory' }
                };
            } else {
                labelerCoeffs[l] = {
                    conveyor: emptyDrive(),
                    press:    emptyDrive(),
                    roller:   emptyDrive()
                };
            }
        }
    });
}

function getCoeffsForLine(line) { return labelerCoeffs[line]; }

function getUsableCoeffs(line) {
    const c = labelerCoeffs[line];
    if (!c) return null;
    const ready = ['conveyor','press','roller'].every(d => c[d].a > 0 && c[d].maxHz > 0);
    return ready ? c : null;
}

function takeEngSnapshot() {
    engSnapshot = JSON.stringify(labelerCoeffs);
}

function isEngDirty() {
    return engSnapshot !== null && JSON.stringify(labelerCoeffs) !== engSnapshot;
}

function setLabelerMode(mode) {
    labelerMode = mode;
    document.getElementById('mode-btn-speed').classList.toggle('mode-active', mode === 'speed');
    document.getElementById('mode-btn-hz').classList.toggle('mode-active', mode === 'hz');

    const label = document.getElementById('labeler-input-label');
    label.textContent = mode === 'speed'
        ? '📏 Скорость конвейера, м/мин'
        : '⚙ Частота конвейера, Гц';

    const unit = document.querySelector('.labeler-unit');
    if (unit) unit.textContent = mode === 'speed' ? 'м/мин' : 'Гц';

    calculateLabelerFrequencies();
}

function calculateLabelerFrequencies() {
    const line  = document.getElementById('labelerLineSelect').value;
    const c     = getUsableCoeffs(line);
    const warn  = document.getElementById('labeler-calib-warning');
    const input = parseFloat(document.getElementById('conveyor-speed-input').value) || 0;

    if (!c) {
        if (warn) {
            warn.textContent = '⚠️ Линия не откалибрована. Значения приблизительные (по линии 1.1). Откройте инженерное меню.';
            warn.classList.remove('hidden');
        }
        renderLabelerOutputs(input, LABELER_DEFAULTS_LINE_1_1);
        return;
    }

    if (warn) warn.classList.add('hidden');
    renderLabelerOutputs(input, c);
}

function renderLabelerOutputs(input, coeffs) {
    if (input <= 0) {
        ['conveyor','press','roller'].forEach(d => {
            document.getElementById(`labeler-${d}-freq`).textContent = '—';
            document.getElementById(`labeler-${d}-bar`).style.width = '0%';
        });
        const speedOut = document.getElementById('labeler-calc-speed');
        if (speedOut) speedOut.textContent = '—';
        return;
    }

    let speed;
    if (labelerMode === 'speed') {
        speed = input;
    } else {
        speed = (input - coeffs.conveyor.b) / coeffs.conveyor.a;
    }

    const hzConv   = coeffs.conveyor.a * speed + coeffs.conveyor.b;
    const hzPress  = coeffs.press.a    * speed + coeffs.press.b;
    const hzRoller = coeffs.roller.a   * speed + coeffs.roller.b;

    document.getElementById('labeler-conveyor-freq').textContent = hzConv.toFixed(1);
    document.getElementById('labeler-press-freq').textContent    = hzPress.toFixed(1);
    document.getElementById('labeler-roller-freq').textContent   = hzRoller.toFixed(1);

    updateProgressBar('labeler-conveyor-bar', hzConv,   coeffs.conveyor.maxHz);
    updateProgressBar('labeler-press-bar',    hzPress,  coeffs.press.maxHz);
    updateProgressBar('labeler-roller-bar',   hzRoller, coeffs.roller.maxHz);

    document.getElementById('labeler-conveyor-max').textContent = `макс: ${coeffs.conveyor.maxHz} Гц`;
    document.getElementById('labeler-press-max').textContent    = `макс: ${coeffs.press.maxHz} Гц`;
    document.getElementById('labeler-roller-max').textContent   = `макс: ${coeffs.roller.maxHz} Гц`;

    const speedOut = document.getElementById('labeler-calc-speed');
    if (speedOut) speedOut.textContent = `≈ ${speed.toFixed(2)} м/мин`;
}

function updateProgressBar(barId, currentFreq, maxFreq) {
    const bar = document.getElementById(barId);
    if (!bar) return;
    if (!maxFreq) { bar.style.width = '0%'; return; }
    const percent = Math.min(currentFreq / maxFreq * 100, 100);
    bar.style.width = percent + '%';
    const ratio = currentFreq / maxFreq;
    bar.classList.remove('bar-ok', 'bar-warn', 'bar-danger');
    if (ratio >= 0.95)      bar.classList.add('bar-danger');
    else if (ratio >= 0.80) bar.classList.add('bar-warn');
    else                    bar.classList.add('bar-ok');
}

function resetLabelerForm() {
    document.getElementById('conveyor-speed-input').value = '14.0';
    document.getElementById('labelerLineSelect').value = 'LINE_1_3';
    setLabelerMode('speed');
}

// ============================================================
// 5. УГОЛ НОЖА
// ============================================================

function updateKnifeInstructions() {
    const bottleType = document.getElementById('knife-bottle-type').value;
    const wallAngle = parseFloat(document.getElementById('knife-wall-angle').value) || 0;
    const roundingAngle = parseFloat(document.getElementById('knife-rounding-angle').value) || 0;

    const container = document.getElementById('knife-instructions');
    const recommendationBlock = document.getElementById('knife-recommendation');
    const recommendationText = document.getElementById('knife-recommendation-text');

    const roundingBlock = document.getElementById('knife-rounding-block');
    const hasRounding = (bottleType === 'belly' || bottleType === 'round');
    if (hasRounding) roundingBlock.classList.remove('hidden');
    else roundingBlock.classList.add('hidden');

    let html = '';

    html += `<div class="knife-section-title">📐 Поперечная калибровка (угол стенки)</div>`;

    html += `<div class="step-item">
        <span class="step-number">1</span>
        <span class="step-text"><strong>Инклинометр на конвейере поперёк движения</strong> → <span class="step-highlight">обнулить</span> (конвейер остановлен)</span>
    </div>`;

    html += `<div class="step-item step-active">
        <span class="step-number">2</span>
        <span class="step-text"><strong>Флакон под прижимом</strong> → замер наклона стенки по центру: <span class="step-highlight">${wallAngle.toFixed(1)}°</span></span>
    </div>`;

    if (wallAngle === 0) {
        html += `<div class="step-item step-done">
            <span class="step-number">💡</span>
            <span class="step-text">Угол стенки = 0° — флакон перпендикулярен конвейеру. Настройка не требуется.</span>
        </div>`;
    }

    html += `<div class="step-item">
        <span class="step-number">3</span>
        <span class="step-text"><strong>Перенести угол ${wallAngle.toFixed(1)}°</strong> на соответствующий нож</span>
    </div>`;

    html += `<div class="step-item">
        <span class="step-number">4</span>
        <span class="step-text"><strong>Повторить процедуру</strong> для <span class="step-highlight">противоположной стороны</span></span>
    </div>`;

    html += `<div class="knife-section-title">➡️ Продольная калибровка (параллельность конвейеру)</div>`;

    html += `<div class="step-item">
        <span class="step-number">5</span>
        <span class="step-text"><strong>Инклинометр вдоль движения конвейера</strong> → <span class="step-highlight">обнулить</span></span>
    </div>`;

    html += `<div class="step-item">
        <span class="step-number">6</span>
        <span class="step-text"><strong>Инклинометр к торцу ножа</strong> → выставить <span class="step-highlight">0°</span></span>
    </div>`;

    html += `<div class="step-item">
        <span class="step-number">7</span>
        <span class="step-text"><strong>Повторить процедуру</strong> для <span class="step-highlight">противоположной стороны</span></span>
    </div>`;

    if (hasRounding) {
        html += `<div class="knife-section-title">🔄 Скругление (для флаконов со скруглением)</div>`;

        html += `<div class="step-item step-active">
            <span class="step-number">8</span>
            <span class="step-text"><strong>Замер угла скругления транспортиром</strong> → <span class="step-highlight">${roundingAngle.toFixed(1)}°</span> → перенести на <strong>поворот ножа</strong></span>
        </div>`;

        html += `<div class="step-item">
            <span class="step-number">9</span>
            <span class="step-text"><strong>Расстояние от ножа до флакона</strong> в самой широкой части <span class="step-highlight">≤ 5 мм</span> (по горизонтали)</span>
        </div>`;

        html += `<div class="step-item">
            <span class="step-number">10</span>
            <span class="step-text"><strong>Вылет (язык) этикетки</strong> = расстояние между ножом и <span class="step-highlight">самой узкой частью стенки</span> флакона (на обеих сторонах)</span>
        </div>`;

        html += `<div class="step-item step-warning">
            <span class="step-number">💡</span>
            <span class="step-text">Передний край этикетки ложится строго в нужное место с учётом скругления</span>
        </div>`;
    }

    let recommendation = '';

    if (wallAngle > 0) {
        recommendation = `Установите нож под углом ${wallAngle.toFixed(1)}° (поперечная калибровка) и 0° (продольная калибровка)`;
        if (hasRounding && roundingAngle > 0) {
            recommendation += `, поворот ножа на ${roundingAngle.toFixed(1)}° для скругления`;
        }
    } else if (hasRounding && roundingAngle > 0) {
        recommendation = `Поворот ножа на ${roundingAngle.toFixed(1)}° для скругления. Зазор ≤ 5 мм.`;
    } else {
        recommendation = 'Нож параллелен конвейеру в двух плоскостях. Настройка выполнена.';
    }

    recommendationText.textContent = recommendation;
    recommendationBlock.classList.remove('hidden');

    container.innerHTML = html;
}

function checkKnifeAngles() {
    updateKnifeInstructions();
}

function resetKnifeForm() {
    document.getElementById('knife-bottle-type').value = 'flat';
    document.getElementById('knife-wall-angle').value = '0.0';
    document.getElementById('knife-rounding-angle').value = '0.0';
    updateKnifeInstructions();
}

// ============================================================
// 6. УКУПОР
// ============================================================

let selectedCapType = 'cap';

function selectCappingType(type) {
    selectedCapType = type;
    const btnCap = document.getElementById('cap-type-cap');
    const btnTrigger = document.getElementById('cap-type-trigger');

    if (type === 'cap') {
        btnCap.classList.add('mode-active');
        btnTrigger.classList.remove('mode-active');
    } else {
        btnTrigger.classList.add('mode-active');
        btnCap.classList.remove('mode-active');
    }
}

function calculateCappingParams() {
    const capType = selectedCapType;
    const D_cap = parseFloat(document.getElementById('cap-diameter').value) || 30;
    const H_bottle = parseFloat(document.getElementById('capping-bottle-height').value) || 200;
    const H_cap = parseFloat(document.getElementById('cap-height').value) || 15;
    const V_conv_ms = parseFloat(document.getElementById('capping-conveyor-speed').value) || 0.20;
    const material = document.getElementById('cap-material').value;

    const V_conv_mmin = V_conv_ms * 60;

    const materialFactors = {
        'pet':      { spindle: 1.0,  time: 1.0,  capper: 1.0,  pressure: 3.0 },
        'metal':    { spindle: 0.82, time: 1.33, capper: 0.82, pressure: 3.5 },
        'cork':     { spindle: 1.16, time: 0.67, capper: 1.16, pressure: 2.5 },
        'aluminum': { spindle: 0.89, time: 1.17, capper: 0.89, pressure: 3.0 }
    };

    const mf = materialFactors[material] || materialFactors.pet;

    let sizeFactor = 1.0;
    if (D_cap < 25) sizeFactor = 1.1;
    else if (D_cap > 35) sizeFactor = 0.9;

    const baseSpindle = 73.00;
    const baseTime = 0.30;
    const baseCapper = 73.00;
    const baseSingle = 0.50;

    const V_spindle = baseSpindle * mf.spindle * sizeFactor;
    const T_3balls = baseTime * mf.time / sizeFactor;
    const V_capper = baseCapper * mf.capper * sizeFactor;
    const T_single = baseSingle * mf.time / sizeFactor;
    const P_capper = mf.pressure;

    let useCapper = true;
    if (capType === 'trigger') useCapper = false;

    const T_sensor_delay = 0.73;
    const T_delay = 0.00;

    let T_total;
    if (useCapper) T_total = T_3balls + T_delay + T_single;
    else T_total = T_3balls;

    const productivity = 3600 / T_total;

    displayCappingResult({
        capType, material, D_cap, H_bottle, H_cap,
        V_conv_ms, V_conv_mmin,
        V_spindle, T_3balls, V_capper, T_single, P_capper,
        useCapper, T_sensor_delay, T_delay, T_total, productivity
    });
}

function displayCappingResult(params) {
    const resultBlock = document.getElementById('capping-result');
    const paramsList = document.getElementById('capping-params-list');
    const pneumaticList = document.getElementById('capping-pneumatic-list');
    const mechanicalList = document.getElementById('capping-mechanical-list');
    const performanceList = document.getElementById('capping-performance-list');
    const stepsList = document.getElementById('capping-steps-list');

    paramsList.innerHTML = '';
    pneumaticList.innerHTML = '';
    mechanicalList.innerHTML = '';
    performanceList.innerHTML = '';
    stepsList.innerHTML = '';

    const typeLabel = params.capType === 'cap' ? '🏷 Крышка' : '🔫 Триггер';
    const materialLabels = {
        'pet': 'ПЭТ (пластик)',
        'metal': 'Металл',
        'cork': 'Пробка',
        'aluminum': 'Алюминий'
    };

    paramsList.innerHTML += `<li>CONVEYOR SPEED: <span class="v">${params.V_conv_mmin.toFixed(2)}</span> м/мин</li>`;
    paramsList.innerHTML += `<li>SIDE BELTS SPEED (3 BALL): <span class="v">${params.V_spindle.toFixed(2)}</span> Гц/%</li>`;

    if (params.useCapper) {
        paramsList.innerHTML += `<li>SIDE BELTS SPEED (SINGLE CAPPING): <span class="v">${params.V_capper.toFixed(2)}</span> Гц/%</li>`;
        paramsList.innerHTML += `<li>CAP CLOSING TIME (3 BALLS): <span class="v">${params.T_3balls.toFixed(2)}</span> сек</li>`;
        paramsList.innerHTML += `<li>CAP CLOSING TIME (SINGLE CAPPING): <span class="v">${params.T_single.toFixed(2)}</span> сек</li>`;
    } else {
        paramsList.innerHTML += `<li>SIDE BELTS SPEED (SINGLE CAPPING): <span class="v-danger">❌ не используется</span></li>`;
        paramsList.innerHTML += `<li>CAP CLOSING TIME (3 BALLS): <span class="v">${params.T_3balls.toFixed(2)}</span> сек</li>`;
        paramsList.innerHTML += `<li>CAP CLOSING TIME (SINGLE CAPPING): <span class="v-danger">❌ не используется</span></li>`;
    }

    paramsList.innerHTML += `<li>CAP CLOSING SENSOR DELAY: <span class="v">${params.T_sensor_delay.toFixed(2)}</span> сек</li>`;
    paramsList.innerHTML += `<li>CAP CLOSING DELAY: <span class="v">${params.T_delay.toFixed(2)}</span> сек</li>`;

    pneumaticList.innerHTML += `<li>Давление на входе: <span class="v-warn">5.0</span> бар (проверить манометром)</li>`;
    if (params.useCapper) {
        pneumaticList.innerHTML += `<li>Давление добивалки: <span class="v-warn">${params.P_capper.toFixed(1)}</span> бар</li>`;
        pneumaticList.innerHTML += `<li>Фильтр-влагоотделитель: <span class="v-warn">слить конденсат</span></li>`;
        pneumaticList.innerHTML += `<li>Маслораспылитель: <span class="v-warn">проверить уровень (ISO VG 32)</span></li>`;
    } else {
        pneumaticList.innerHTML += `<li>Добивалка: <span class="v-danger">❌ не используется (триггер)</span></li>`;
    }

    mechanicalList.innerHTML += `<li>Зазор ролик-крышка: <span class="v-warn">0.5–1.0</span> мм (щуп)</li>`;
    mechanicalList.innerHTML += `<li>Шпиндель 1 (полиур.): <span class="v-warn">чистый, эластичный</span></li>`;
    mechanicalList.innerHTML += `<li>Шпиндель 2 (полиур.): <span class="v-warn">чистый, эластичный</span></li>`;
    mechanicalList.innerHTML += `<li>Шпиндель 3 (металл.): <span class="v-warn">гладкий, без задиров</span></li>`;
    mechanicalList.innerHTML += `<li>Ремень: <span class="v-warn">натянут (прогиб 5–10 мм)</span></li>`;

    if (params.useCapper) {
        mechanicalList.innerHTML += `<li>Добивалка: <span class="v-warn">ход свободный, зазор до крышки 0.5 мм</span></li>`;
    } else {
        mechanicalList.innerHTML += `<li>Добивалка: <span class="v-danger">❌ не используется</span></li>`;
    }

    performanceList.innerHTML += `<li>Тип укупорки: <span class="v-warn">${typeLabel}</span></li>`;
    performanceList.innerHTML += `<li>Материал: <span class="v-warn">${materialLabels[params.material]}</span></li>`;
    performanceList.innerHTML += `<li>Скорость конвейера: <span class="v">${params.V_conv_ms.toFixed(2)}</span> м/с (${params.V_conv_mmin.toFixed(1)} м/мин)</li>`;
    performanceList.innerHTML += `<li>Полное время цикла: <span class="v">${params.T_total.toFixed(2)}</span> сек</li>`;
    performanceList.innerHTML += `<li>Производительность: <span class="v">${params.productivity.toFixed(0)}</span> бут/час</li>`;

    stepsList.innerHTML += `<li class="v-warn">📋 Пошаговая инструкция переналадки:</li>`;
    stepsList.innerHTML += `<li>ШАГ 1: проверить пневматику — давление 5.0 бар, фильтр осушен</li>`;
    stepsList.innerHTML += `<li>ШАГ 2: проверить механику — ролики чистые, ремень натянут</li>`;
    stepsList.innerHTML += `<li>ШАГ 3: ввести параметры в панель (см. таблицу выше)</li>`;
    stepsList.innerHTML += `<li>ШАГ 4: нажать <span class="v-warn">«Отправка рецепта»</span> на панели</li>`;
    stepsList.innerHTML += `<li>ШАГ 5: запустить тестовую партию <span class="v-warn">5–10 флаконов</span></li>`;
    stepsList.innerHTML += `<li>ШАГ 6: проверить качество закрутки (момент, внешний вид)</li>`;
    stepsList.innerHTML += `<li>ШАГ 7: при необходимости — <span class="v-warn">скорректировать</span> параметры</li>`;
    stepsList.innerHTML += `<li>ШАГ 8: зафиксировать настройки — записать в протокол</li>`;

    resultBlock.classList.remove('hidden');
    resultBlock.scrollIntoView({ behavior: 'smooth' });
}

function copyCappingParams(e) {
    const paramsList = document.getElementById('capping-params-list');
    const text = paramsList.innerText;
    navigator.clipboard.writeText(text).then(() => {
        const btn = e.currentTarget;
        const originalText = btn.textContent;
        btn.textContent = '✅ Скопировано!';
        setTimeout(() => { btn.textContent = originalText; }, 2000);
    }).catch(() => alert('Не удалось скопировать. Скопируйте вручную.'));
}

function resetCappingForm() {
    document.getElementById('cap-diameter').value = '30';
    document.getElementById('capping-bottle-height').value = '200';
    document.getElementById('cap-height').value = '15';
    document.getElementById('capping-conveyor-speed').value = '0.20';
    document.getElementById('cap-material').value = 'pet';
    document.getElementById('capping-result').classList.add('hidden');
    selectCappingType('cap');
}

// ============================================================
// 7. ЖУРНАЛ НАЛАДОК
// ============================================================

const JOURNAL_KEY = 'line-assistant-journal';
const JOURNAL_MAX = 100;
let journal = [];

function loadJournal() {
    try {
        journal = JSON.parse(localStorage.getItem(JOURNAL_KEY)) || [];
    } catch { journal = []; }
}

function saveJournalToStorage() {
    try {
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal));
    } catch (e) {
        alert('Не удалось сохранить журнал (память браузера переполнена). Удалите старые записи.');
    }
}

function openJournal() {
    loadJournal();
    renderJournal();
    document.getElementById('journal-overlay').classList.remove('hidden');
}

function closeJournal() {
    document.getElementById('journal-overlay').classList.add('hidden');
}

function saveCurrentToJournal() {
    // Читаем текущие значения из формы
    const line = document.getElementById('lineSelect').value;
    const lineName = document.getElementById('lineSelect').selectedOptions[0].textContent;
    const bottleHeight = parseFloat(document.getElementById('bottleHeightInput').value) || 0;
    const volume = parseFloat(document.getElementById('volumeInput').value) || 0;
    const weight = parseFloat(document.getElementById('weightInput').value) || 0;
    const density = parseFloat(document.getElementById('densityInput').value) || 1.0;
    const viscosity = parseFloat(document.getElementById('viscosityInput').value) || 0;

    if (volume <= 0 || bottleHeight <= 0) {
        alert('Заполните высоту флакона и объём перед сохранением.');
        return;
    }

    // Извлекаем расчётные данные
    const totalWeight = parseFloat(document.getElementById('val_total_weight').textContent) || 0;
    const delay = parseFloat(document.getElementById('sub_nozzle_lift_delay').textContent) || 0;

    const entry = {
        id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        timestamp: new Date().toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }),
        line, lineName, bottleHeight, volume, weight, density, viscosity,
        totalWeight, delay
    };

    journal.unshift(entry);
    if (journal.length > JOURNAL_MAX) journal = journal.slice(0, JOURNAL_MAX);
    saveJournalToStorage();

    // Если открыта модалка журнала — перерисуем
    const overlay = document.getElementById('journal-overlay');
    if (!overlay.classList.contains('hidden')) {
        renderJournal();
    } else {
        // Иначе — просто показали уведомление
        alert('Сохранено в журнал.');
    }
}

function renderJournal() {
    const listEl = document.getElementById('journal-list');
    const emptyEl = document.getElementById('journal-empty');

    if (!journal.length) {
        listEl.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
    }

    emptyEl.classList.add('hidden');
    listEl.innerHTML = journal.map(e => `
        <div class="journal-entry" data-id="${e.id}">
            <div class="journal-entry-head">
                <span class="journal-time">${e.timestamp}</span>
                <span class="journal-line">${e.lineName}</span>
                <button class="journal-delete" onclick="deleteJournalEntry('${e.id}')" title="Удалить">✕</button>
            </div>
            <div class="journal-entry-grid">
                <div><span>Объём</span><b>${e.volume} мл</b></div>
                <div><span>Вес</span><b>${e.weight} г</b></div>
                <div><span>Плотность</span><b>${e.density.toFixed(2)}</b></div>
                <div><span>Вязкость</span><b>${e.viscosity} ед.</b></div>
                <div><span>Высота</span><b>${e.bottleHeight} мм</b></div>
                <div><span>Задержка</span><b>${e.delay.toFixed(1)} с</b></div>
            </div>
            <div class="journal-entry-footer">
                <button class="btn btn-ghost btn-sm" onclick="restoreJournalEntry('${e.id}')">↩ Загрузить в форму</button>
            </div>
        </div>
    `).join('');
}

function deleteJournalEntry(id) {
    if (!confirm('Удалить запись из журнала?')) return;
    journal = journal.filter(e => e.id !== id);
    saveJournalToStorage();
    renderJournal();
}

function restoreJournalEntry(id) {
    const e = journal.find(x => x.id === id);
    if (!e) return;

    document.getElementById('lineSelect').value = e.line;
    document.getElementById('bottleHeightInput').value = e.bottleHeight;
    document.getElementById('volumeInput').value = e.volume;
    document.getElementById('weightInput').value = e.weight;
    document.getElementById('densityInput').value = e.density;
    document.getElementById('viscosityInput').value = e.viscosity;

    closeJournal();
    switchTab('filling');
    runUniversalCalculation();
}

function clearJournal() {
    if (!journal.length) return;
    if (!confirm('Удалить все записи журнала? Это действие необратимо.')) return;
    journal = [];
    saveJournalToStorage();
    renderJournal();
}

function exportJournal() {
    if (!journal.length) {
        alert('Журнал пуст — нечего экспортировать.');
        return;
    }
    const data = JSON.stringify(journal, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().slice(0, 10);
    a.download = `journal-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================================
// 8. ИНЖЕНЕРНОЕ МЕНЮ
// ============================================================

function openEngMenu() {
    document.getElementById('eng-menu-overlay').classList.remove('hidden');
    document.getElementById('eng-pin-change-overlay').classList.add('hidden');
    closeExportMenu();

    populateEngLineSelect();

    if (engPinUnlocked) {
        document.getElementById('eng-pin-block').classList.add('hidden');
        document.getElementById('eng-content').classList.remove('hidden');
        loadEngLine();
        engPrevLine = document.getElementById('eng-line-select').value;
        if (!engSnapshot) takeEngSnapshot();
    } else {
        document.getElementById('eng-pin-block').classList.remove('hidden');
        document.getElementById('eng-content').classList.add('hidden');
        document.getElementById('eng-pin-input').value = '';
        document.getElementById('eng-pin-error').classList.add('hidden');
    }
}

function closeEngMenu(force = false) {
    closeExportMenu();

    if (!force && isEngDirty()) {
        askUnsavedChanges(
            'В инженерном меню есть несохранённые изменения. Что сделать?',
            () => {
                engDirty = false;
                document.getElementById('eng-menu-overlay').classList.add('hidden');
            }
        );
        return;
    }
    engDirty = false;
    document.getElementById('eng-menu-overlay').classList.add('hidden');
}

function checkEngPin() {
    const pin = document.getElementById('eng-pin-input').value;
    const saved = localStorage.getItem(ENG_PIN_KEY) || DEFAULT_PIN;
    if (pin === saved) {
        engPinUnlocked = true;
        document.getElementById('eng-pin-block').classList.add('hidden');
        document.getElementById('eng-content').classList.remove('hidden');
        loadEngLine();
        engPrevLine = document.getElementById('eng-line-select').value;
        takeEngSnapshot();
    } else {
        document.getElementById('eng-pin-error').classList.remove('hidden');
    }
}

function populateEngLineSelect() {
    const sel = document.getElementById('eng-line-select');
    if (sel.options.length) return;
    const lines = [
        ['LINE_1_1','Линия 1.1'],['LINE_1_2','Линия 1.2'],['LINE_1_3','Линия 1.3'],
        ['LINE_1_4','Линия 1.4'],['LINE_1_5','Линия 1.5'],['LINE_1_6','Линия 1.6']
    ];
    sel.innerHTML = lines.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
    sel.value = document.getElementById('labelerLineSelect')?.value || 'LINE_1_3';
}

function switchEngLine() {
    const sel = document.getElementById('eng-line-select');
    const newLine = sel.value;
    const prevLine = engPrevLine ?? newLine;

    if (newLine === prevLine) return;

    if (isEngDirty()) {
        sel.value = prevLine;
        askUnsavedChanges(
            'Есть несохранённые изменения по текущей линии. Что сделать перед переключением?',
            () => {
                sel.value = newLine;
                engPrevLine = newLine;
                loadEngLine();
                takeEngSnapshot();
                engDirty = false;
            }
        );
        return;
    }

    engPrevLine = newLine;
    loadEngLine();
    takeEngSnapshot();
}

function loadEngLine() {
    const line = document.getElementById('eng-line-select').value;
    const c = getCoeffsForLine(line);

    ['conveyor', 'press', 'roller'].forEach(drive => {
        renderEngRows(drive, c[drive].points || []);

        const maxHzId = {
            conveyor: 'eng-conv-maxhz',
            press:    'eng-press-maxhz',
            roller:   'eng-roller-maxhz'
        }[drive];
        document.getElementById(maxHzId).value = c[drive].maxHz ?? '';

        updateEngFit(drive, c[drive]);
        updateEngMaxHzHint(drive, c[drive]);
    });

    const badge = document.getElementById('eng-calib-status');
    const calStatuses = ['conveyor', 'press', 'roller'].map(d => c[d].calibrated).filter(v => v && v !== 'factory');

    if (calStatuses.length === 3) {
        badge.textContent = `✅ Откалибровано: ${calStatuses[0]}`;
        badge.style.color = '#00e08a';
    } else if (line === 'LINE_1_1') {
        badge.textContent = '⚙️ Заводские значения (линия 1.1)';
        badge.style.color = '#00d4ff';
    } else {
        badge.textContent = '⚠️ Не откалибровано — требуется замер';
        badge.style.color = '#ffb020';
    }
}

function renderEngRows(drive, points) {
    const tbody = document.getElementById(`eng-tbody-${drive}`);
    tbody.innerHTML = '';

    let list = points && points.length ? [...points] : [];
    while (list.length < 3) list.push({ hz: '', speed: '' });

    list.forEach((p, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="number" step="0.1" min="0" value="${p.hz}"
                       oninput="onEngRowInput('${drive}', ${idx}, 'hz', this.value)"></td>
            <td><input type="number" step="0.1" min="0" value="${p.speed}"
                       oninput="onEngRowInput('${drive}', ${idx}, 'speed', this.value)"></td>
            <td><button class="remove-row" onclick="removeEngRow('${drive}', ${idx})">✕</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function addEngRow(drive) {
    const line = document.getElementById('eng-line-select').value;
    const c = getCoeffsForLine(line);
    if (!c[drive].points) c[drive].points = [];
    c[drive].points.push({ hz: '', speed: '' });
    renderEngRows(drive, c[drive].points);
    updateEngFit(drive, c[drive]);
}

function removeEngRow(drive, idx) {
    const line = document.getElementById('eng-line-select').value;
    const c = getCoeffsForLine(line);
    if (!c[drive].points) c[drive].points = [];
    if (idx < c[drive].points.length) c[drive].points.splice(idx, 1);
    renderEngRows(drive, c[drive].points);
    updateEngFit(drive, c[drive]);
}

function onEngRowInput(drive, idx, field, value) {
    const line = document.getElementById('eng-line-select').value;
    const c = getCoeffsForLine(line);
    if (!c[drive].points) c[drive].points = [];
    if (!c[drive].points[idx]) c[drive].points[idx] = { hz: '', speed: '' };
    c[drive].points[idx][field] = parseFloat(value) || '';
    updateEngFit(drive, c[drive]);
}

function onEngMaxHz(drive, value) {
    const line = document.getElementById('eng-line-select').value;
    const c = getCoeffsForLine(line);
    const v = parseFloat(value) || 0;
    c[drive].maxHz = v > 0 ? v : null;
    updateEngMaxHzHint(drive, c[drive]);
    updateEngFit(drive, c[drive]);
}

function updateEngMaxHzHint(drive, driveObj) {
    const hintId = {
        conveyor: 'eng-conv-maxspeed',
        press:    'eng-press-maxspeed',
        roller:   'eng-roller-maxspeed'
    }[drive];
    const el = document.getElementById(hintId);
    if (!el) return;
    if (driveObj.a > 0 && driveObj.maxHz > 0) {
        const maxSpeed = (driveObj.maxHz - (driveObj.b || 0)) / driveObj.a;
        el.textContent = `= ${maxSpeed.toFixed(1)} м/мин`;
    } else {
        el.textContent = '—';
    }
}

function updateEngFit(drive, driveObj) {
    const fitEl = document.getElementById(`eng-fit-${drive}`);
    const pts = (driveObj.points || [])
        .map(p => ({ hz: parseFloat(p.hz), speed: parseFloat(p.speed) }))
        .filter(p => p.hz > 0 && p.speed > 0);

    if (pts.length === 0) {
        fitEl.textContent = '—';
        fitEl.classList.remove('warn');
        return;
    }

    if (pts.length === 1) {
        const a = pts[0].hz / pts[0].speed;
        driveObj.a = a;
        driveObj.b = 0;
        driveObj.r2 = null;
        fitEl.textContent = `Hz = ${a.toFixed(3)} × speed  (1 точка, без смещения)`;
        fitEl.classList.remove('warn');
        updateEngMaxHzHint(drive, driveObj);
        return;
    }

    const xs = pts.map(p => p.speed);
    const ys = pts.map(p => p.hz);
    const n = xs.length;
    const sx  = xs.reduce((a, b) => a + b, 0);
    const sy  = ys.reduce((a, b) => a + b, 0);
    const sxy = xs.reduce((a, b, i) => a + b * ys[i], 0);
    const sxx = xs.reduce((a, b) => a + b * b, 0);
    const denom = n * sxx - sx * sx;

    if (Math.abs(denom) < 1e-9) {
        fitEl.textContent = '⚠️ Все точки имеют одинаковую скорость — недостаточно данных';
        fitEl.classList.add('warn');
        return;
    }

    const a = (n * sxy - sx * sy) / denom;
    const b = (sy - a * sx) / n;

    const meanY = sy / n;
    const ssTot = ys.reduce((acc, y) => acc + (y - meanY) ** 2, 0);
    const ssRes = ys.reduce((acc, y, i) => acc + (y - (a * xs[i] + b)) ** 2, 0);
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 1;

    driveObj.a = a;
    driveObj.b = b;
    driveObj.r2 = r2;

    const sign = b >= 0 ? '+' : '−';
    fitEl.textContent = `Hz = ${a.toFixed(3)} × speed ${sign} ${Math.abs(b).toFixed(3)}  |  R² = ${r2.toFixed(4)}  (${n} точек)`;
    fitEl.classList.toggle('warn', r2 < 0.98);
    if (r2 < 0.98) fitEl.textContent += '  ⚠️ низкое качество фита';

    updateEngMaxHzHint(drive, driveObj);
}

function driveLabel(d) {
    return { conveyor: 'Конвейер', press: 'Прижимная лента', roller: 'Обкатчик' }[d];
}

function saveEngCoeffs(silent = false) {
    const line = document.getElementById('eng-line-select').value;
    const c = getCoeffsForLine(line);

    for (const drive of ['conveyor', 'press', 'roller']) {
        const d = c[drive];
        if (!d.a || d.a <= 0 || d.a > 100) {
            alert(`Привод "${driveLabel(drive)}": недостаточно данных. Добавьте минимум 1 точку.`);
            return false;
        }
        if (!d.maxHz || d.maxHz < 1 || d.maxHz > 200) {
            alert(`Привод "${driveLabel(drive)}": укажите максимум Гц (1–200).`);
            return false;
        }
    }

    const today = new Date().toISOString().slice(0, 10);
    ['conveyor', 'press', 'roller'].forEach(d => {
        if ((c[d].points || []).length > 0) c[d].calibrated = today;
    });

    localStorage.setItem(ENG_STORAGE_KEY, JSON.stringify(labelerCoeffs));

    if (!silent) {
        const lineName = document.getElementById('eng-line-select').selectedOptions[0].textContent;
        alert(`Коэффициенты для "${lineName}" сохранены.`);
    }

    loadEngLine();
    calculateLabelerFrequencies();
    takeEngSnapshot();
    engDirty = false;
    engPrevLine = document.getElementById('eng-line-select').value;
    return true;
}

function resetEngCoeffs() {
    const line = document.getElementById('eng-line-select').value;
    if (!confirm('Сбросить коэффициенты этой линии?')) return;

    if (line === 'LINE_1_1') {
        labelerCoeffs[line] = {
            conveyor: { ...LABELER_DEFAULTS_LINE_1_1.conveyor, r2: null, points: [], calibrated: 'factory' },
            press:    { ...LABELER_DEFAULTS_LINE_1_1.press,    r2: null, points: [], calibrated: 'factory' },
            roller:   { ...LABELER_DEFAULTS_LINE_1_1.roller,   r2: null, points: [], calibrated: 'factory' }
        };
    } else {
        labelerCoeffs[line] = {
            conveyor: emptyDrive(),
            press:    emptyDrive(),
            roller:   emptyDrive()
        };
    }

    localStorage.setItem(ENG_STORAGE_KEY, JSON.stringify(labelerCoeffs));
    loadEngLine();
    calculateLabelerFrequencies();
    takeEngSnapshot();
    engDirty = false;
    engPrevLine = line;
}

function _downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function exportEngAll() {
    const today = new Date().toISOString().slice(0, 10);
    _downloadJson(`labeler-calibration-all-${today}.json`, labelerCoeffs);
}

function exportEngCurrent() {
    const line = document.getElementById('eng-line-select').value;
    const today = new Date().toISOString().slice(0, 10);
    const data = { [line]: labelerCoeffs[line] };
    _downloadJson(`labeler-calibration-${line}-${today}.json`, data);
}

function importEngCoeffs() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);
                const importedLines = [];
                const skippedLines = [];

                for (const line of Object.keys(data)) {
                    if (!KNOWN_LINES.includes(line)) {
                        skippedLines.push(line);
                        continue;
                    }
                    const drive = data[line];
                    const isValid = drive && typeof drive === 'object'
                        && ['conveyor','press','roller'].every(d => drive[d] && typeof drive[d] === 'object');
                    if (!isValid) {
                        skippedLines.push(line);
                        continue;
                    }
                    labelerCoeffs[line] = drive;
                    importedLines.push(line);
                }

                if (importedLines.length === 0) {
                    alert('Файл не содержит данных по известным линиям (LINE_1_1 … LINE_1_6).');
                    return;
                }

                localStorage.setItem(ENG_STORAGE_KEY, JSON.stringify(labelerCoeffs));
                loadEngLine();
                calculateLabelerFrequencies();
                takeEngSnapshot();
                engDirty = false;

                let msg = `Импортировано линий: ${importedLines.length}\n` +
                          importedLines.map(l => `  • ${l}`).join('\n');
                if (skippedLines.length) {
                    msg += `\n\nПропущено (неизвестные или повреждённые):\n` +
                           skippedLines.map(l => `  • ${l}`).join('\n');
                }
                alert(msg);
            } catch {
                alert('Не удалось прочитать файл. Проверьте, что это корректный JSON.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ============================================================
// 9. СМЕНА PIN И ПОДТВЕРЖДЕНИЯ
// ============================================================

function askUnsavedChanges(text, onProceed) {
    pendingEngAction = onProceed;
    document.getElementById('eng-confirm-text').textContent = text;
    document.getElementById('eng-confirm-overlay').classList.remove('hidden');
}

function engConfirmSave() {
    const ok = saveEngCoeffs(true);
    if (!ok) return;
    document.getElementById('eng-confirm-overlay').classList.add('hidden');
    const act = pendingEngAction; pendingEngAction = null;
    if (act) act();
}

function engConfirmDiscard() {
    if (engSnapshot) labelerCoeffs = JSON.parse(engSnapshot);
    engDirty = false;
    document.getElementById('eng-confirm-overlay').classList.add('hidden');
    const act = pendingEngAction; pendingEngAction = null;
    if (act) act();
}

function engConfirmCancel() {
    pendingEngAction = null;
    document.getElementById('eng-confirm-overlay').classList.add('hidden');
}

function changeEngPin() {
    document.getElementById('pin-old').value = '';
    document.getElementById('pin-new').value = '';
    document.getElementById('pin-new2').value = '';
    document.getElementById('pin-change-error').classList.add('hidden');
    document.getElementById('eng-pin-change-overlay').classList.remove('hidden');
}

function closePinChange() {
    document.getElementById('eng-pin-change-overlay').classList.add('hidden');
}

function submitPinChange() {
    const oldPin = document.getElementById('pin-old').value;
    const newPin = document.getElementById('pin-new').value;
    const newPin2 = document.getElementById('pin-new2').value;
    const err = document.getElementById('pin-change-error');
    const saved = localStorage.getItem(ENG_PIN_KEY) || DEFAULT_PIN;

    const fail = (msg) => { err.textContent = msg; err.classList.remove('hidden'); };

    if (oldPin !== saved) return fail('Текущий PIN неверный');
    if (!/^\d{4,6}$/.test(newPin)) return fail('Новый PIN должен содержать 4–6 цифр');
    if (newPin !== newPin2) return fail('PIN-коды не совпадают');

    localStorage.setItem(ENG_PIN_KEY, newPin);
    closePinChange();
    alert('PIN изменён.');
}

// ============================================================
// 10. ДРОПДАУН ЭКСПОРТА
// ============================================================

function toggleExportMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('export-dropdown');
    menu.classList.toggle('hidden');
}

function closeExportMenu() {
    document.getElementById('export-dropdown')?.classList.add('hidden');
}

document.addEventListener('click', (e) => {
    const menu = document.getElementById('export-dropdown');
    if (!menu || menu.classList.contains('hidden')) return;
    if (!e.target.closest('.dropdown')) closeExportMenu();
});

// ============================================================
// 11. ESC-ОБРАБОТЧИК
// ============================================================

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    closeExportMenu();

    const confirmOverlay = document.getElementById('eng-confirm-overlay');
    const pinChangeOverlay = document.getElementById('eng-pin-change-overlay');
    const journalOverlay = document.getElementById('journal-overlay');
    const engOverlay = document.getElementById('eng-menu-overlay');

    if (!confirmOverlay.classList.contains('hidden')) {
        engConfirmCancel();
        return;
    }
    if (!pinChangeOverlay.classList.contains('hidden')) {
        closePinChange();
        return;
    }
    if (!journalOverlay.classList.contains('hidden')) {
        closeJournal();
        return;
    }
    if (!engOverlay.classList.contains('hidden')) {
        closeEngMenu();
    }
});

// Закрытие модалок по клику вне окна
['journal-overlay', 'eng-menu-overlay'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', (e) => {
        if (e.target.id === id) {
            if (id === 'journal-overlay') closeJournal();
            else closeEngMenu();
        }
    });
});

// Защита от случайного закрытия страницы при несохранённых правках
window.addEventListener('beforeunload', (e) => {
    if (engPinUnlocked && isEngDirty()) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// ============================================================
// 12. ИНИЦИАЛИЗАЦИЯ
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
    initEngStorage();
    loadJournal();
    syncVolumeWeight('vol');
    switchTab('filling');
    calculateLabelerFrequencies();
    updateKnifeInstructions();
    selectCappingType('cap');

    // Привязка кнопок модалки подтверждения
    document.getElementById('eng-confirm-save')?.addEventListener('click', engConfirmSave);
    document.getElementById('eng-confirm-discard')?.addEventListener('click', engConfirmDiscard);
    document.getElementById('eng-confirm-cancel')?.addEventListener('click', engConfirmCancel);

    console.log('✅ Mobile Assistant 2.0 загружен');
});
