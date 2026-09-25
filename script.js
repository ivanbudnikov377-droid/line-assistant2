// ============================================================
// Mobile Assistant 2.0
// ============================================================

// ============================================================
// 1. ОСНОВНОЙ РАСЧЁТ ДЛЯ НАЛИВА
// ============================================================

function runUniversalCalculation() {
    const line = document.getElementById('lineSelect').value;
    const rawHeight    = document.getElementById('bottleHeightInput').value;
    const rawBottleVol = document.getElementById('bottleVolumeInput').value;
    const rawWeight    = document.getElementById('targetWeightInput').value;
    const rawVisc      = document.getElementById('viscosityInput').value;
    const rawDensity   = document.getElementById('densityInput').value;

    const bottleHeight = rawHeight ? parseFloat(rawHeight) : 245;
    const bottleVol    = rawBottleVol ? parseFloat(rawBottleVol) : 600;
    const targetWeight = rawWeight ? parseFloat(rawWeight) : 600;
    const visc         = rawVisc ? parseFloat(rawVisc) : 0;
    let   density      = rawDensity ? parseFloat(rawDensity) : 1.0;

    if (density < 0.75) density = 0.75;
    if (density > 1.30) density = 1.30;

    if (bottleHeight <= 0 || bottleVol <= 0 || targetWeight <= 0 || visc < 0 || density <= 0) return;

    const vol = targetWeight / density;

    const hintEl = document.getElementById('fillVolumeHintValue');
    if (hintEl) hintEl.textContent = vol.toFixed(1) + ' мл';

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
        speed1 = 25.00; speed2 = 48.00; speed3 = 28.00;
        k_t2 = 0.10; k_t3 = 0.73;
        ls1 = 70; ls2 = 75; ls3 = 65;
        bp = 35;
        tp = Math.round(bottleHeight - 30);
        wp = Math.round(bottleHeight + 74);
        np1 = 40;
        np2 = Math.round(bottleHeight * 0.20);
        np3 = Math.round(bottleHeight * 0.80);
        conv_m = 60.00; conv_l = 0.00;
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

    // Минимально безопасная задержка подъёма по вязкости
    const delayMinSafe = visc < 800
        ? 3.0 - (visc / 800) * 1.5
        : 1.5;
    if (delay < delayMinSafe) {
        delay = parseFloat(delayMinSafe.toFixed(1));
    }

    let t2 = Math.round(vol * k_t2);
    let t3 = Math.round(vol * k_t3);

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
        'val_fill_volume': vol.toFixed(1),
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
// 2. ЛОГИКА ВКЛАДОК
// ============================================================

function switchTab(tabName) {
    ['filling', 'labeling', 'capping', 'simulator', 'help'].forEach(t => {
        const content = document.getElementById(`content-${t}`);
        const btn = document.getElementById(`btn-tab-${t}`);
        if (content) content.classList.toggle('tab-content-active', t === tabName);
        if (btn) btn.classList.toggle('tab-active', t === tabName);
    });
}

// ============================================================
// 3. КАЛЬКУЛЯТОР ЭТИКЕТОВЩИКА
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
let engDirty           = false;
let engSnapshot        = null;
let engPinUnlocked     = false;
let engPrevLine        = null;
let pendingEngAction   = null;

function emptyDrive() {
    return { a: null, b: null, r2: null, points: [], maxHz: null, calibrated: null };
}

function initEngStorage() {
    try { labelerCoeffs = JSON.parse(localStorage.getItem(ENG_STORAGE_KEY)) || {}; }
    catch { labelerCoeffs = {}; }

    KNOWN_LINES.forEach(l => {
        if (!labelerCoeffs[l]) {
            if (l === 'LINE_1_1') {
                labelerCoeffs[l] = {
                    conveyor: { ...LABELER_DEFAULTS_LINE_1_1.conveyor, r2: null, points: [], calibrated: 'factory' },
                    press:    { ...LABELER_DEFAULTS_LINE_1_1.press,    r2: null, points: [], calibrated: 'factory' },
                    roller:   { ...LABELER_DEFAULTS_LINE_1_1.roller,   r2: null, points: [], calibrated: 'factory' }
                };
            } else {
                labelerCoeffs[l] = { conveyor: emptyDrive(), press: emptyDrive(), roller: emptyDrive() };
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

function takeEngSnapshot() { engSnapshot = JSON.stringify(labelerCoeffs); }
function isEngDirty() { return engSnapshot !== null && JSON.stringify(labelerCoeffs) !== engSnapshot; }

function setLabelerMode(mode) {
    labelerMode = mode;
    document.getElementById('mode-btn-speed').classList.toggle('mode-active', mode === 'speed');
    document.getElementById('mode-btn-hz').classList.toggle('mode-active', mode === 'hz');
    const label = document.getElementById('labeler-input-label');
    label.textContent = mode === 'speed' ? '📏 Скорость конвейера, м/мин' : '⚙ Частота конвейера, Гц';
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
    if (labelerMode === 'speed') speed = input;
    else speed = (input - coeffs.conveyor.b) / coeffs.conveyor.a;

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
// 4. УГОЛ НОЖА
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
    html += `<div class="step-item"><span class="step-number">1</span><span class="step-text"><strong>Инклинометр на конвейере поперёк движения</strong> → <span class="step-highlight">обнулить</span> (конвейер остановлен)</span></div>`;
    html += `<div class="step-item step-active"><span class="step-number">2</span><span class="step-text"><strong>Флакон под прижимом</strong> → замер наклона стенки по центру: <span class="step-highlight">${wallAngle.toFixed(1)}°</span></span></div>`;
    if (wallAngle === 0) {
        html += `<div class="step-item step-done"><span class="step-number">💡</span><span class="step-text">Угол стенки = 0° — флакон перпендикулярен конвейеру. Настройка не требуется.</span></div>`;
    }
    html += `<div class="step-item"><span class="step-number">3</span><span class="step-text"><strong>Перенести угол ${wallAngle.toFixed(1)}°</strong> на соответствующий нож</span></div>`;
    html += `<div class="step-item"><span class="step-number">4</span><span class="step-text"><strong>Повторить процедуру</strong> для <span class="step-highlight">противоположной стороны</span></span></div>`;
    html += `<div class="knife-section-title">➡️ Продольная калибровка (параллельность конвейеру)</div>`;
    html += `<div class="step-item"><span class="step-number">5</span><span class="step-text"><strong>Инклинометр вдоль движения конвейера</strong> → <span class="step-highlight">обнулить</span></span></div>`;
    html += `<div class="step-item"><span class="step-number">6</span><span class="step-text"><strong>Инклинометр к торцу ножа</strong> → выставить <span class="step-highlight">0°</span></span></div>`;
    html += `<div class="step-item"><span class="step-number">7</span><span class="step-text"><strong>Повторить процедуру</strong> для <span class="step-highlight">противоположной стороны</span></span></div>`;
    if (hasRounding) {
        html += `<div class="knife-section-title">🔄 Скругление</div>`;
        html += `<div class="step-item step-active"><span class="step-number">8</span><span class="step-text"><strong>Замер угла скругления транспортиром</strong> → <span class="step-highlight">${roundingAngle.toFixed(1)}°</span></span></div>`;
        html += `<div class="step-item"><span class="step-number">9</span><span class="step-text"><strong>Расстояние от ножа до флакона</strong> в самой широкой части <span class="step-highlight">≤ 5 мм</span></span></div>`;
        html += `<div class="step-item"><span class="step-number">10</span><span class="step-text"><strong>Вылет этикетки</strong> — между ножом и самой узкой частью стенки</span></div>`;
    }

    let recommendation = '';
    if (wallAngle > 0) {
        recommendation = `Установите нож под углом ${wallAngle.toFixed(1)}° (поперечная) и 0° (продольная)`;
        if (hasRounding && roundingAngle > 0) recommendation += `, поворот ножа на ${roundingAngle.toFixed(1)}°`;
    } else if (hasRounding && roundingAngle > 0) {
        recommendation = `Поворот ножа на ${roundingAngle.toFixed(1)}° для скругления. Зазор ≤ 5 мм.`;
    } else {
        recommendation = 'Нож параллелен конвейеру в двух плоскостях. Настройка выполнена.';
    }

    recommendationText.textContent = recommendation;
    recommendationBlock.classList.remove('hidden');
    container.innerHTML = html;
}

function checkKnifeAngles() { updateKnifeInstructions(); }

function resetKnifeForm() {
    document.getElementById('knife-bottle-type').value = 'flat';
    document.getElementById('knife-wall-angle').value = '0.0';
    document.getElementById('knife-rounding-angle').value = '0.0';
    updateKnifeInstructions();
}

// ============================================================
// 5. УКУПОР
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

    const V_spindle = 73.00 * mf.spindle * sizeFactor;
    const T_3balls = 0.30 * mf.time / sizeFactor;
    const V_capper = 73.00 * mf.capper * sizeFactor;
    const T_single = 0.50 * mf.time / sizeFactor;
    const P_capper = mf.pressure;

    let useCapper = (capType !== 'trigger');
    const T_total = useCapper ? (T_3balls + 0 + T_single) : T_3balls;
    const productivity = 3600 / T_total;

    displayCappingResult({
        capType, material, D_cap, H_bottle, H_cap,
        V_conv_ms, V_conv_mmin, V_spindle, T_3balls, V_capper, T_single, P_capper,
        useCapper, T_sensor_delay: 0.73, T_delay: 0.00, T_total, productivity
    });
}

function displayCappingResult(params) {
    const resultBlock = document.getElementById('capping-result');
    const paramsList = document.getElementById('capping-params-list');
    const pneumaticList = document.getElementById('capping-pneumatic-list');
    const mechanicalList = document.getElementById('capping-mechanical-list');
    const performanceList = document.getElementById('capping-performance-list');
    const stepsList = document.getElementById('capping-steps-list');

    paramsList.innerHTML = ''; pneumaticList.innerHTML = '';
    mechanicalList.innerHTML = ''; performanceList.innerHTML = '';
    stepsList.innerHTML = '';

    const typeLabel = params.capType === 'cap' ? '🏷 Крышка' : '🔫 Триггер';
    const materialLabels = { 'pet': 'ПЭТ (пластик)', 'metal': 'Металл', 'cork': 'Пробка', 'aluminum': 'Алюминий' };

    paramsList.innerHTML += `<li>CONVEYOR SPEED: <span class="v">${params.V_conv_mmin.toFixed(2)}</span> м/мин</li>`;
    paramsList.innerHTML += `<li>SIDE BELTS SPEED (3 BALL): <span class="v">${params.V_spindle.toFixed(2)}</span> Гц/%</li>`;
    if (params.useCapper) {
        paramsList.innerHTML += `<li>SIDE BELTS SPEED (SINGLE CAPPING): <span class="v">${params.V_capper.toFixed(2)}</span> Гц/%</li>`;
        paramsList.innerHTML += `<li>CAP CLOSING TIME (3 BALLS): <span class="v">${params.T_3balls.toFixed(2)}</span> сек</li>`;
        paramsList.innerHTML += `<li>CAP CLOSING TIME (SINGLE CAPPING): <span class="v">${params.T_single.toFixed(2)}</span> сек</li>`;
    } else {
        paramsList.innerHTML += `<li>SIDE BELTS SPEED (SINGLE): <span class="v-danger">❌ не используется</span></li>`;
        paramsList.innerHTML += `<li>CAP CLOSING TIME (3 BALLS): <span class="v">${params.T_3balls.toFixed(2)}</span> сек</li>`;
        paramsList.innerHTML += `<li>CAP CLOSING TIME (SINGLE): <span class="v-danger">❌ не используется</span></li>`;
    }
    paramsList.innerHTML += `<li>CAP CLOSING SENSOR DELAY: <span class="v">${params.T_sensor_delay.toFixed(2)}</span> сек</li>`;
    paramsList.innerHTML += `<li>CAP CLOSING DELAY: <span class="v">${params.T_delay.toFixed(2)}</span> сек</li>`;

    pneumaticList.innerHTML += `<li>Давление на входе: <span class="v-warn">5.0</span> бар</li>`;
    if (params.useCapper) {
        pneumaticList.innerHTML += `<li>Давление добивалки: <span class="v-warn">${params.P_capper.toFixed(1)}</span> бар</li>`;
        pneumaticList.innerHTML += `<li>Фильтр-влагоотделитель: <span class="v-warn">слить конденсат</span></li>`;
        pneumaticList.innerHTML += `<li>Маслораспылитель: <span class="v-warn">проверить уровень</span></li>`;
    } else {
        pneumaticList.innerHTML += `<li>Добивалка: <span class="v-danger">❌ не используется (триггер)</span></li>`;
    }

    mechanicalList.innerHTML += `<li>Зазор ролик-крышка: <span class="v-warn">0.5–1.0</span> мм</li>`;
    mechanicalList.innerHTML += `<li>Шпиндель 1: <span class="v-warn">чистый, эластичный</span></li>`;
    mechanicalList.innerHTML += `<li>Шпиндель 2: <span class="v-warn">чистый, эластичный</span></li>`;
    mechanicalList.innerHTML += `<li>Шпиндель 3: <span class="v-warn">гладкий, без задиров</span></li>`;
    mechanicalList.innerHTML += `<li>Ремень: <span class="v-warn">натянут (прогиб 5–10 мм)</span></li>`;
    if (params.useCapper) {
        mechanicalList.innerHTML += `<li>Добивалка: <span class="v-warn">ход свободный, зазор 0.5 мм</span></li>`;
    } else {
        mechanicalList.innerHTML += `<li>Добивалка: <span class="v-danger">❌ не используется</span></li>`;
    }

    performanceList.innerHTML += `<li>Тип укупорки: <span class="v-warn">${typeLabel}</span></li>`;
    performanceList.innerHTML += `<li>Материал: <span class="v-warn">${materialLabels[params.material]}</span></li>`;
    performanceList.innerHTML += `<li>Скорость: <span class="v">${params.V_conv_ms.toFixed(2)}</span> м/с (${params.V_conv_mmin.toFixed(1)} м/мин)</li>`;
    performanceList.innerHTML += `<li>Полное время цикла: <span class="v">${params.T_total.toFixed(2)}</span> сек</li>`;
    performanceList.innerHTML += `<li>Производительность: <span class="v">${params.productivity.toFixed(0)}</span> бут/час</li>`;

    stepsList.innerHTML += `<li class="v-warn">📋 Пошаговая инструкция:</li>`;
    stepsList.innerHTML += `<li>ШАГ 1: проверить пневматику — 5.0 бар</li>`;
    stepsList.innerHTML += `<li>ШАГ 2: проверить механику — ролики, ремень</li>`;
    stepsList.innerHTML += `<li>ШАГ 3: ввести параметры в панель</li>`;
    stepsList.innerHTML += `<li>ШАГ 4: нажать «Отправка рецепта»</li>`;
    stepsList.innerHTML += `<li>ШАГ 5: тестовая партия 5–10 флаконов</li>`;
    stepsList.innerHTML += `<li>ШАГ 6: проверить качество закрутки</li>`;
    stepsList.innerHTML += `<li>ШАГ 7: скорректировать при необходимости</li>`;
    stepsList.innerHTML += `<li>ШАГ 8: записать в протокол</li>`;

    resultBlock.classList.remove('hidden');
    resultBlock.scrollIntoView({ behavior: 'smooth' });
}

function copyCappingParams(e) {
    const text = document.getElementById('capping-params-list').innerText;
    navigator.clipboard.writeText(text).then(() => {
        const btn = e.currentTarget;
        const original = btn.textContent;
        btn.textContent = '✅ Скопировано!';
        setTimeout(() => { btn.textContent = original; }, 2000);
    }).catch(() => alert('Не удалось скопировать.'));
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
// 6. ОТПРАВКА В ПЛК
// ============================================================

function openSendModal() { renderSendParams(); document.getElementById('send-modal-overlay').classList.remove('hidden'); }
function closeSendModal() { document.getElementById('send-modal-overlay').classList.add('hidden'); }

function renderSendParams() {
    const mainList = document.getElementById('send-list-main');
    const timingList = document.getElementById('send-list-timing');
    const get = (id) => document.getElementById(id)?.textContent || '—';

    mainList.innerHTML = `
        <li><span>1. Скорость насоса</span><b>${get('val_pump_speed_1')}</b></li>
        <li><span>2. Скорость насоса</span><b>${get('val_pump_speed_2')}</b></li>
        <li><span>3. Скорость насоса</span><b>${get('val_pump_speed_3')}</b></li>
        <li><span>1. Скорость подъёма</span><b>${get('val_lift_speed_1')}</b></li>
        <li><span>2. Скорость подъёма</span><b>${get('val_lift_speed_2')}</b></li>
        <li><span>3. Скорость подъёма</span><b>${get('val_lift_speed_3')}</b></li>
        <li><span>1. Положение сопла</span><b>${get('val_nozzle_pos_1')}</b></li>
        <li><span>2. Положение сопла</span><b>${get('val_nozzle_pos_2')}</b></li>
        <li><span>3. Положение сопла</span><b>${get('val_nozzle_pos_3')}</b></li>
        <li><span>Нижн. положение сопла</span><b>${get('val_bottom_pos')}</b></li>
        <li><span>Верхний налив</span><b>${get('val_top_pour')}</b></li>
        <li><span>Верхнее положение сопла</span><b>${get('val_wait_point')}</b></li>
        <li><span>Общий объём заполнения</span><b>${get('val_fill_volume')} мл</b></li>`;
    timingList.innerHTML = `
        <li><span>Объём перехода 2</span><b>${get('val_trans_volume_2')}</b></li>
        <li><span>Объём перехода 3</span><b>${get('val_trans_volume_3')}</b></li>
        <li><span>Закр. шибера вход</span><b>${get('val_shiber_close_in')}</b></li>
        <li><span>Откр. шибера вход</span><b>${get('val_shiber_open_in')}</b></li>
        <li><span>Закр. шибера выход</span><b>${get('val_shiber_close_out')}</b></li>
        <li><span>Задержка подъёма</span><b>${get('sub_nozzle_lift_delay')}</b></li>
        <li><span>Скорость опускания траверсы</span><b>${get('val_traverse_down_speed')}</b></li>
        <li><span>Основная скорость конвейера</span><b>${get('val_conveyor_main_speed')}</b></li>
        <li><span>Низкая скорость конвейера</span><b>${get('val_conveyor_low_speed')}</b></li>
        <li><span>Рецепт</span><b>${get('val_product_label')}</b></li>`;
}

function copySendParams() {
    const lines = [];
    document.querySelectorAll('#send-params-block .send-list li').forEach((li) => {
        const label = li.querySelector('span')?.textContent || '';
        const value = li.querySelector('b')?.textContent || '';
        lines.push(`${label}: ${value}`);
    });
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
        document.querySelectorAll('#send-modal-overlay .btn-primary').forEach((btn) => {
            const original = btn.textContent;
            btn.textContent = '✅ Скопировано!';
            setTimeout(() => { btn.textContent = original; }, 1800);
        });
    }).catch(() => alert('Не удалось скопировать.'));
}

// ============================================================
// 7. ПОДЕЛИТЬСЯ ССЫЛКОЙ
// ============================================================

function shareApp() {
    const url = window.location.origin + window.location.pathname;
    const title = 'Mobile Assistant 2.0';
    const text = 'Помощник наладчика линии розлива';
    if (navigator.share) {
        navigator.share({ title, text, url }).catch(() => {});
    } else {
        navigator.clipboard.writeText(url).then(() => alert('Ссылка скопирована:\n' + url))
            .catch(() => prompt('Скопируйте ссылку:', url));
    }
}

// ============================================================
// 8. ЖУРНАЛ НАЛАДОК
// ============================================================

const JOURNAL_KEY = 'line-assistant-journal';
const JOURNAL_MAX = 100;
let journal = [];

function loadJournal() {
    try { journal = JSON.parse(localStorage.getItem(JOURNAL_KEY)) || []; }
    catch { journal = []; }
}
function saveJournalToStorage() {
    try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal)); }
    catch { alert('Не удалось сохранить журнал.'); }
}
function openJournal() { loadJournal(); renderJournal(); document.getElementById('journal-overlay').classList.remove('hidden'); }
function closeJournal() { document.getElementById('journal-overlay').classList.add('hidden'); }

function saveCurrentToJournal() {
    const line = document.getElementById('lineSelect').value;
    const lineName = document.getElementById('lineSelect').selectedOptions[0].textContent;
    const bottleHeight = parseFloat(document.getElementById('bottleHeightInput').value) || 0;
    const bottleVolume = parseFloat(document.getElementById('bottleVolumeInput').value) || 0;
    const targetWeight = parseFloat(document.getElementById('targetWeightInput').value) || 0;
    const density = parseFloat(document.getElementById('densityInput').value) || 1.0;
    const viscosity = parseFloat(document.getElementById('viscosityInput').value) || 0;

    if (bottleHeight <= 0 || targetWeight <= 0) { alert('Заполните высоту флакона и целевой вес.'); return; }

    const fillVolume = parseFloat(document.getElementById('val_fill_volume').textContent) || 0;
    const delay = parseFloat(document.getElementById('sub_nozzle_lift_delay').textContent) || 0;

    const entry = {
        id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        timestamp: new Date().toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        line, lineName, bottleHeight, bottleVolume, targetWeight, density, fillVolume, viscosity, delay
    };

    journal.unshift(entry);
    if (journal.length > JOURNAL_MAX) journal = journal.slice(0, JOURNAL_MAX);
    saveJournalToStorage();

    const overlay = document.getElementById('journal-overlay');
    if (!overlay.classList.contains('hidden')) renderJournal();
    else alert('Сохранено в журнал.');
}

function renderJournal() {
    const listEl = document.getElementById('journal-list');
    const emptyEl = document.getElementById('journal-empty');
    if (!journal.length) { listEl.innerHTML = ''; emptyEl.classList.remove('hidden'); return; }
    emptyEl.classList.add('hidden');
    listEl.innerHTML = journal.map(e => `
        <div class="journal-entry" data-id="${e.id}">
            <div class="journal-entry-head">
                <span class="journal-time">${e.timestamp}</span>
                <span class="journal-line">${e.lineName}</span>
                <button class="journal-delete" onclick="deleteJournalEntry('${e.id}')" title="Удалить">✕</button>
            </div>
            <div class="journal-entry-grid">
                <div><span>Флакон</span><b>${e.bottleVolume} мл</b></div>
                <div><span>Целевой вес</span><b>${e.targetWeight} г</b></div>
                <div><span>Плотность</span><b>${e.density.toFixed(2)}</b></div>
                <div><span>Объём заполн.</span><b>${e.fillVolume.toFixed(1)} мл</b></div>
                <div><span>Вязкость</span><b>${e.viscosity} ед.</b></div>
                <div><span>Высота</span><b>${e.bottleHeight} мм</b></div>
            </div>
            <div class="journal-entry-footer">
                <button class="btn btn-ghost btn-sm" onclick="restoreJournalEntry('${e.id}')">↩ Загрузить в форму</button>
            </div>
        </div>`).join('');
}

function deleteJournalEntry(id) {
    if (!confirm('Удалить запись из журнала?')) return;
    journal = journal.filter(e => e.id !== id);
    saveJournalToStorage(); renderJournal();
}

function restoreJournalEntry(id) {
    const e = journal.find(x => x.id === id);
    if (!e) return;
    document.getElementById('lineSelect').value = e.line;
    document.getElementById('bottleHeightInput').value = e.bottleHeight;
    document.getElementById('bottleVolumeInput').value = e.bottleVolume;
    document.getElementById('targetWeightInput').value = e.targetWeight;
    document.getElementById('densityInput').value = e.density;
    document.getElementById('viscosityInput').value = e.viscosity;
    closeJournal(); switchTab('filling'); runUniversalCalculation();
}

function clearJournal() {
    if (!journal.length) return;
    if (!confirm('Удалить все записи журнала?')) return;
    journal = []; saveJournalToStorage(); renderJournal();
}

function exportJournal() {
    if (!journal.length) { alert('Журнал пуст.'); return; }
    const blob = new Blob([JSON.stringify(journal, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
}

// ============================================================
// 9. ИНЖЕНЕРНОЕ МЕНЮ
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
        askUnsavedChanges('В инженерном меню есть несохранённые изменения. Что сделать?', () => {
            engDirty = false;
            document.getElementById('eng-menu-overlay').classList.add('hidden');
        });
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
        askUnsavedChanges('Есть несохранённые изменения. Что делать?', () => {
            sel.value = newLine;
            engPrevLine = newLine;
            loadEngLine();
            takeEngSnapshot();
            engDirty = false;
        });
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
        const maxHzId = { conveyor: 'eng-conv-maxhz', press: 'eng-press-maxhz', roller: 'eng-roller-maxhz' }[drive];
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
            <td><input type="number" step="0.1" min="0" value="${p.hz}" oninput="onEngRowInput('${drive}', ${idx}, 'hz', this.value)"></td>
            <td><input type="number" step="0.1" min="0" value="${p.speed}" oninput="onEngRowInput('${drive}', ${idx}, 'speed', this.value)"></td>
            <td><button class="remove-row" onclick="removeEngRow('${drive}', ${idx})">✕</button></td>`;
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
    const hintId = { conveyor: 'eng-conv-maxspeed', press: 'eng-press-maxspeed', roller: 'eng-roller-maxspeed' }[drive];
    const el = document.getElementById(hintId);
    if (!el) return;
    if (driveObj.a > 0 && driveObj.maxHz > 0) {
        const maxSpeed = (driveObj.maxHz - (driveObj.b || 0)) / driveObj.a;
        el.textContent = `= ${maxSpeed.toFixed(1)} м/мин`;
    } else el.textContent = '—';
}

function updateEngFit(drive, driveObj) {
    const fitEl = document.getElementById(`eng-fit-${drive}`);
    const pts = (driveObj.points || [])
        .map(p => ({ hz: parseFloat(p.hz), speed: parseFloat(p.speed) }))
        .filter(p => p.hz > 0 && p.speed > 0);

    if (pts.length === 0) { fitEl.textContent = '—'; fitEl.classList.remove('warn'); return; }

    if (pts.length === 1) {
        const a = pts[0].hz / pts[0].speed;
        driveObj.a = a; driveObj.b = 0; driveObj.r2 = null;
        fitEl.textContent = `Hz = ${a.toFixed(3)} × speed  (1 точка)`;
        fitEl.classList.remove('warn');
        updateEngMaxHzHint(drive, driveObj);
        return;
    }

    const xs = pts.map(p => p.speed), ys = pts.map(p => p.hz);
    const n = xs.length;
    const sx  = xs.reduce((a, b) => a + b, 0);
    const sy  = ys.reduce((a, b) => a + b, 0);
    const sxy = xs.reduce((a, b, i) => a + b * ys[i], 0);
    const sxx = xs.reduce((a, b) => a + b * b, 0);
    const denom = n * sxx - sx * sx;

    if (Math.abs(denom) < 1e-9) {
        fitEl.textContent = '⚠️ Все точки имеют одинаковую скорость';
        fitEl.classList.add('warn');
        return;
    }

    const a = (n * sxy - sx * sy) / denom;
    const b = (sy - a * sx) / n;
    const meanY = sy / n;
    const ssTot = ys.reduce((acc, y) => acc + (y - meanY) ** 2, 0);
    const ssRes = ys.reduce((acc, y, i) => acc + (y - (a * xs[i] + b)) ** 2, 0);
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 1;

    driveObj.a = a; driveObj.b = b; driveObj.r2 = r2;
    const sign = b >= 0 ? '+' : '−';
    fitEl.textContent = `Hz = ${a.toFixed(3)} × speed ${sign} ${Math.abs(b).toFixed(3)}  |  R² = ${r2.toFixed(4)}  (${n} точек)`;
    fitEl.classList.toggle('warn', r2 < 0.98);
    if (r2 < 0.98) fitEl.textContent += '  ⚠️ низкое качество';
    updateEngMaxHzHint(drive, driveObj);
}

function driveLabel(d) { return { conveyor: 'Конвейер', press: 'Прижимная лента', roller: 'Обкатчик' }[d]; }

function saveEngCoeffs(silent = false) {
    const line = document.getElementById('eng-line-select').value;
    const c = getCoeffsForLine(line);
    for (const drive of ['conveyor', 'press', 'roller']) {
        const d = c[drive];
        if (!d.a || d.a <= 0 || d.a > 100) { alert(`Привод "${driveLabel(drive)}": недостаточно данных.`); return false; }
        if (!d.maxHz || d.maxHz < 1 || d.maxHz > 200) { alert(`Привод "${driveLabel(drive)}": укажите максимум Гц (1–200).`); return false; }
    }
    const today = new Date().toISOString().slice(0, 10);
    ['conveyor', 'press', 'roller'].forEach(d => { if ((c[d].points || []).length > 0) c[d].calibrated = today; });
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
        labelerCoeffs[line] = { conveyor: emptyDrive(), press: emptyDrive(), roller: emptyDrive() };
    }
    localStorage.setItem(ENG_STORAGE_KEY, JSON.stringify(labelerCoeffs));
    loadEngLine(); calculateLabelerFrequencies(); takeEngSnapshot();
    engDirty = false; engPrevLine = line;
}

function _downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

function exportEngAll() {
    _downloadJson(`labeler-calibration-all-${new Date().toISOString().slice(0, 10)}.json`, labelerCoeffs);
}

function exportEngCurrent() {
    const line = document.getElementById('eng-line-select').value;
    _downloadJson(`labeler-calibration-${line}-${new Date().toISOString().slice(0, 10)}.json`, { [line]: labelerCoeffs[line] });
}

function importEngCoeffs() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);
                const imported = [], skipped = [];
                for (const line of Object.keys(data)) {
                    if (!KNOWN_LINES.includes(line)) { skipped.push(line); continue; }
                    const drive = data[line];
                    const isValid = drive && typeof drive === 'object'
                        && ['conveyor','press','roller'].every(d => drive[d] && typeof drive[d] === 'object');
                    if (!isValid) { skipped.push(line); continue; }
                    labelerCoeffs[line] = drive;
                    imported.push(line);
                }
                if (imported.length === 0) { alert('Файл не содержит данных по известным линиям.'); return; }
                localStorage.setItem(ENG_STORAGE_KEY, JSON.stringify(labelerCoeffs));
                loadEngLine(); calculateLabelerFrequencies(); takeEngSnapshot(); engDirty = false;
                let msg = `Импортировано линий: ${imported.length}\n` + imported.map(l => `  • ${l}`).join('\n');
                if (skipped.length) msg += `\n\nПропущено:\n` + skipped.map(l => `  • ${l}`).join('\n');
                alert(msg);
            } catch { alert('Не удалось прочитать файл.'); }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ============================================================
// 10. PIN И ПОДТВЕРЖДЕНИЯ
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

function closePinChange() { document.getElementById('eng-pin-change-overlay').classList.add('hidden'); }

function submitPinChange() {
    const oldPin = document.getElementById('pin-old').value;
    const newPin = document.getElementById('pin-new').value;
    const newPin2 = document.getElementById('pin-new2').value;
    const err = document.getElementById('pin-change-error');
    const saved = localStorage.getItem(ENG_PIN_KEY) || DEFAULT_PIN;
    const fail = (msg) => { err.textContent = msg; err.classList.remove('hidden'); };
    if (oldPin !== saved) return fail('Текущий PIN неверный');
    if (!/^\d{4,6}$/.test(newPin)) return fail('PIN 4–6 цифр');
    if (newPin !== newPin2) return fail('PIN-коды не совпадают');
    localStorage.setItem(ENG_PIN_KEY, newPin);
    closePinChange(); alert('PIN изменён.');
}

// ============================================================
// 11. ДРОПДАУН ЭКСПОРТА
// ============================================================

function toggleExportMenu(event) { event.stopPropagation(); document.getElementById('export-dropdown').classList.toggle('hidden'); }
function closeExportMenu() { document.getElementById('export-dropdown')?.classList.add('hidden'); }

document.addEventListener('click', (e) => {
    const menu = document.getElementById('export-dropdown');
    if (!menu || menu.classList.contains('hidden')) return;
    if (!e.target.closest('.dropdown')) closeExportMenu();
});

// ============================================================
// 12. ESC
// ============================================================

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeExportMenu();
    const overlays = ['eng-confirm-overlay', 'eng-pin-change-overlay', 'user-recipes-overlay',
                      'sim-name-overlay', 'journal-overlay', 'send-modal-overlay'];
    for (const id of overlays) {
        const el = document.getElementById(id);
        if (el && !el.classList.contains('hidden')) {
            if (id === 'eng-confirm-overlay') engConfirmCancel();
            else if (id === 'eng-pin-change-overlay') closePinChange();
            else if (id === 'user-recipes-overlay') closeUserRecipes();
            else if (id === 'sim-name-overlay') simSkipName();
            else if (id === 'journal-overlay') closeJournal();
            else if (id === 'send-modal-overlay') closeSendModal();
            return;
        }
    }
    const engOverlay = document.getElementById('eng-menu-overlay');
    if (engOverlay && !engOverlay.classList.contains('hidden')) closeEngMenu();
});

['journal-overlay', 'eng-menu-overlay', 'send-modal-overlay'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', (e) => {
        if (e.target.id === id) {
            if (id === 'journal-overlay') closeJournal();
            else if (id === 'send-modal-overlay') closeSendModal();
            else closeEngMenu();
        }
    });
});

window.addEventListener('beforeunload', (e) => {
    if (engPinUnlocked && isEngDirty()) { e.preventDefault(); e.returnValue = ''; }
});

// ============================================================
// 13. ТРЕНАЖЁР НАЛИВА · ПОЛНАЯ ВЕРСИЯ 3.0
// ============================================================

const SIM_STORAGE_KEY      = 'line-assistant-sim-stats';
const SIM_LB_KEY           = 'line-assistant-sim-leaderboard';
const SIM_USER_RECIPES_KEY = 'line-assistant-user-recipes';

const SIM_DIFFICULTIES = {
    easy: {
        name: 'НОВИЧОК', tolerance: 0.20, multiplier: 1,
        fields: ['pump_speed_1', 'pump_speed_2', 'pump_speed_3', 'lift_speed_1', 'lift_speed_2', 'delay']
    },
    medium: {
        name: 'ОПЕРАТОР', tolerance: 0.15, multiplier: 1.5,
        fields: [
            'pump_speed_1', 'pump_speed_2', 'pump_speed_3',
            'lift_speed_1', 'lift_speed_2', 'lift_speed_3',
            'nozzle_pos_1', 'nozzle_pos_2', 'nozzle_pos_3',
            'trans_volume_2', 'trans_volume_3',
            'delay', 'shiber_open_in'
        ]
    },
    hard: {
        name: 'МАСТЕР', tolerance: 0.10, multiplier: 2,
        fields: [
            'pump_speed_1', 'pump_speed_2', 'pump_speed_3',
            'lift_speed_1', 'lift_speed_2', 'lift_speed_3',
            'nozzle_pos_1', 'nozzle_pos_2', 'nozzle_pos_3',
            'trans_volume_2', 'trans_volume_3',
            'wait_point', 'top_pour', 'bottom_pos',
            'delay',
            'shiber_close_in', 'shiber_open_in', 'shiber_close_out',
            'traverse_down_speed',
            'conveyor_main_speed', 'conveyor_low_speed'
        ]
    }
};

const SIM_FIELD_LABELS = {
    pump_speed_1:        '1. Скорость насоса',
    pump_speed_2:        '2. Скорость насоса',
    pump_speed_3:        '3. Скорость насоса',
    lift_speed_1:        '1. Скорость подъёма',
    lift_speed_2:        '2. Скорость подъёма',
    lift_speed_3:        '3. Скорость подъёма',
    nozzle_pos_1:        '1. Полож. сопла, мм',
    nozzle_pos_2:        '2. Полож. сопла, мм',
    nozzle_pos_3:        '3. Полож. сопла, мм',
    trans_volume_2:      'Объём перехода 2, мл',
    trans_volume_3:      'Объём перехода 3, мл',
    wait_point:          'Верх. полож. сопла, мм',
    top_pour:            'Верхний налив, мм',
    bottom_pos:          'Нижн. полож. сопла, мм',
    delay:               'Задержка подъёма, с',
    shiber_close_in:     'Закр. шибера вход, с',
    shiber_open_in:      'Откр. шибера вход, с',
    shiber_close_out:    'Закр. шибера выход, с',
    traverse_down_speed: 'Скор. опуск. траверсы',
    conveyor_main_speed: 'Осн. скорость конвейера, м/мин',
    conveyor_low_speed:  'Низк. скорость конвейера, м/мин'
};

const SIM_PLC_LIMITS = { pump_speed_1: 80, pump_speed_2: 80, pump_speed_3: 45 };

const SIM_CRUSH_LABELS = [
    'БРАТ, ТЫ ЧТО ТВОРИШЬ?!',
    'БРАТ, ТЫ ФЛАКОНЫ МНЁШЬ!',
    'БРАТ, ЗАДЕРЖКУ ПОДНИМИ!'
];

let simCrushLabelIndex = 0;

function simComputeDelayMin(visc) {
    return visc < 800 ? 3.0 - (visc / 800) * 1.5 : 1.5;
}

const SIM_ACCIDENTS = [
    { title: '⚠️ ПЕНА ПРИ НАЛИВЕ', description: 'Пена. 1-я ступень слишком быстрая — снизьте её на 20%.', field: 'pump_speed_1', factor: 0.80 },
    { title: '⚠️ НЕДОЛИВ 5%', description: 'Флаконы недолиты. Увеличьте 3-ю скорость на 10%.', field: 'pump_speed_3', factor: 1.10 },
    { title: '⚠️ ПЕРЕЛИВ', description: 'Перелив через край. Уменьшите 2-ю скорость на 15%.', field: 'pump_speed_2', factor: 0.85 },
    { title: '⚠️ ПРОДОЛЖИТЕЛЬНЫЙ ПОДЪЁМ', description: 'Сопло долго поднимается. Уменьшите задержку подъёма на 25%.', field: 'delay', factor: 0.75 },
    { title: '⚠️ НЕСТАБИЛЬНЫЙ ПОТОК', description: 'Помпа пульсирует. 3-я скорость завышена на 15%.', field: 'pump_speed_3', factor: 1.15 }
];

let simState = { score: 0, streak: 0, wins: 0, attempts: 0, bestScore: 0 };
let simCurrent = null;
let simMode = 'classic';
let simTrainingMode = false;
let simPendingDifficulty = null;
let simLeaderboard = [];
let simUserRecipes = [];
let simMP = null;

function simLoadStats() {
    try { simState = { ...simState, ...(JSON.parse(localStorage.getItem(SIM_STORAGE_KEY)) || {}) }; } catch {}
    try { simLeaderboard = JSON.parse(localStorage.getItem(SIM_LB_KEY)) || []; } catch { simLeaderboard = []; }
    try { simUserRecipes = JSON.parse(localStorage.getItem(SIM_USER_RECIPES_KEY)) || []; } catch { simUserRecipes = []; }
}
function simSaveStats() { try { localStorage.setItem(SIM_STORAGE_KEY, JSON.stringify(simState)); } catch {} }
function simSaveLeaderboard() { try { localStorage.setItem(SIM_LB_KEY, JSON.stringify(simLeaderboard)); } catch {} }
function simSaveUserRecipes() { try { localStorage.setItem(SIM_USER_RECIPES_KEY, JSON.stringify(simUserRecipes)); } catch {} }

function simUpdateStatsUI() {
    document.getElementById('sim-stat-score').textContent    = simState.score;
    document.getElementById('sim-stat-streak').textContent   = simState.streak;
    document.getElementById('sim-stat-wins').textContent     = simState.wins;
    document.getElementById('sim-stat-attempts').textContent = simState.attempts;
}

function simHideAll() {
    ['sim-menu', 'sim-difficulty', 'sim-line-select', 'sim-task', 'sim-result',
     'sim-leaderboard', 'sim-mp-setup', 'sim-mp-score'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
    });
}

function simBackToMenu() {
    simHideAll();
    document.getElementById('sim-menu').classList.remove('hidden');
    simUpdateStatsUI();
}

function simOpenDifficulty(mode) {
    const training = (event && event.currentTarget && event.currentTarget.dataset.training === '1');
    simTrainingMode = !!training;
    simMode = mode;
    simHideAll();
    document.getElementById('sim-difficulty').classList.remove('hidden');
    const title = simTrainingMode ? '🎓 Режим: ТРЕНИРОВКА'
        : (mode === 'accident' ? '⚠️ Режим: АВАРИЯ' : '🎯 Режим: КЛАССИКА');
    document.getElementById('sim-diff-title').textContent = title;
}

function simOpenLeaderboard() {
    simHideAll();
    document.getElementById('sim-leaderboard').classList.remove('hidden');
    simRenderLeaderboard();
}

function simRenderLeaderboard() {
    const listEl = document.getElementById('sim-lb-list');
    const emptyEl = document.getElementById('sim-lb-empty');
    if (!simLeaderboard.length) { listEl.innerHTML = ''; emptyEl.classList.remove('hidden'); return; }
    emptyEl.classList.add('hidden');
    listEl.innerHTML = simLeaderboard.slice(0, 10).map((entry, i) => `
        <li class="rank-${i + 1}">
            <span class="sim-lb-rank">#${i + 1}</span>
            <span class="sim-lb-name">${entry.name}</span>
            <span class="sim-lb-diff">${entry.diff}</span>
            <span class="sim-lb-score">${entry.score}</span>
        </li>`).join('');
}

function simClearLeaderboard() {
    if (!confirm('Очистить таблицу лидеров?')) return;
    simLeaderboard = []; simSaveLeaderboard(); simRenderLeaderboard();
}

function simCheckHighScore() {
    if (simState.score < 100) return false;
    const worst = simLeaderboard.length >= 10 ? simLeaderboard[9].score : 0;
    return simState.score > worst;
}

function simPushToLeaderboard(name) {
    const diff = simCurrent ? simCurrent.difficultyConfig.name : '—';
    simLeaderboard.push({ name: name || 'Аноним', score: simState.score, diff });
    simLeaderboard.sort((a, b) => b.score - a.score);
    if (simLeaderboard.length > 10) simLeaderboard = simLeaderboard.slice(0, 10);
    simSaveLeaderboard();
}

function simStart(difficulty) {
    simPendingDifficulty = difficulty;
    simHideAll();
    document.getElementById('sim-line-select').classList.remove('hidden');
}

function simPickLine(line) {
    if (!simPendingDifficulty) return;
    const difficulty = simPendingDifficulty;
    simPendingDifficulty = null;
    const diff = SIM_DIFFICULTIES[difficulty];
    if (!diff) return;
    const task = simGenerateTask(line);
    const ideal = simCalculateIdeal(task.params);
    let accident = null, brokenValue = null;
    if (simMode === 'accident') {
        accident = SIM_ACCIDENTS[Math.floor(Math.random() * SIM_ACCIDENTS.length)];
        brokenValue = ideal[accident.field] * accident.factor;
    }
    simCurrent = {
        difficulty, difficultyConfig: diff, task, ideal, accident, brokenValue,
        attemptIndex: simState.attempts + 1
    };
    simRenderTask();
    simHideAll();
    document.getElementById('sim-task').classList.remove('hidden');
}

function simGenerateTask(line) {
    const userForLine = simUserRecipes.filter(r => r.line === line);
    if (userForLine.length > 0 && Math.random() < 0.6) {
        const r = userForLine[Math.floor(Math.random() * userForLine.length)];
        return {
            product: r,
            params: { line, volume: r.volume, height: r.height || 245, density: r.density, viscosity: r.viscosity },
            isUserRecipe: true
        };
    }
    const volume   = Math.round((300 + Math.random() * 4700) / 50) * 50;
    const height   = 200 + Math.round((Math.random() * 130) / 5) * 5;
    const density  = parseFloat((0.95 + Math.random() * 0.15).toFixed(2));
    const viscPick = Math.random();
    let viscosity;
    if (viscPick < 0.35)      viscosity = 0;
    else if (viscPick < 0.55) viscosity = 500;
    else if (viscPick < 0.75) viscosity = 1500;
    else if (viscPick < 0.9)  viscosity = 2500;
    else                      viscosity = 3500;
    const names = ['Продукт А', 'Продукт Б', 'Партия №' + (100 + Math.floor(Math.random() * 900)),
                   'Заказ №' + (1000 + Math.floor(Math.random() * 9000))];
    const name = names[Math.floor(Math.random() * names.length)];
    return {
        product: { name, line, volume, density, viscosity },
        params: { line, volume, height, density, viscosity },
        isUserRecipe: false
    };
}

function simCancel() {
    simMP = null; simPendingDifficulty = null; simTrainingMode = false;
    simBackToMenu();
}

function simCalculateIdeal(params) {
    const saved = {
        line: document.getElementById('lineSelect').value,
        height: document.getElementById('bottleHeightInput').value,
        bottleVol: document.getElementById('bottleVolumeInput').value,
        weight: document.getElementById('targetWeightInput').value,
        density: document.getElementById('densityInput').value,
        visc: document.getElementById('viscosityInput').value
    };
    document.getElementById('lineSelect').value        = params.line;
    document.getElementById('bottleHeightInput').value = params.height;
    document.getElementById('bottleVolumeInput').value = params.volume;
    document.getElementById('targetWeightInput').value = Math.round(params.volume * params.density);
    document.getElementById('densityInput').value      = params.density;
    document.getElementById('viscosityInput').value    = params.viscosity;
    runUniversalCalculation();

    const pump2Text = document.getElementById('val_pump_speed_2').textContent;
    let pump2Ideal;
    if (pump2Text.includes('ДОН')) {
        const match = pump2Text.match(/\(ДОН\.\)\s*([\d.]+)/);
        pump2Ideal = match ? parseFloat(match[1]) : parseFloat(pump2Text) || 0;
    } else pump2Ideal = parseFloat(pump2Text) || 0;

    let shiberOpenIn = parseFloat(document.getElementById('val_shiber_open_in').textContent) || 0;
    if (shiberOpenIn < 0.4) shiberOpenIn = 0.5;

    const ideal = {
        pump_speed_1:        parseFloat(document.getElementById('val_pump_speed_1').textContent) || 0,
        pump_speed_2:        pump2Ideal,
        pump_speed_3:        parseFloat(document.getElementById('val_pump_speed_3').textContent) || 0,
        lift_speed_1:        parseInt(document.getElementById('val_lift_speed_1').textContent) || 0,
        lift_speed_2:        parseInt(document.getElementById('val_lift_speed_2').textContent) || 0,
        lift_speed_3:        parseInt(document.getElementById('val_lift_speed_3').textContent) || 0,
        nozzle_pos_1:        parseInt(document.getElementById('val_nozzle_pos_1').textContent) || 0,
        nozzle_pos_2:        parseInt(document.getElementById('val_nozzle_pos_2').textContent) || 0,
        nozzle_pos_3:        parseInt(document.getElementById('val_nozzle_pos_3').textContent) || 0,
        trans_volume_2:      parseInt(document.getElementById('val_trans_volume_2').textContent) || 0,
        trans_volume_3:      parseInt(document.getElementById('val_trans_volume_3').textContent) || 0,
        wait_point:          parseInt(document.getElementById('val_wait_point').textContent) || 0,
        top_pour:            parseInt(document.getElementById('val_top_pour').textContent) || 0,
        bottom_pos:          parseInt(document.getElementById('val_bottom_pos').textContent) || 0,
        delay:               parseFloat(document.getElementById('sub_nozzle_lift_delay').textContent) || 0,
        shiber_close_in:     parseFloat(document.getElementById('val_shiber_close_in').textContent) || 0,
        shiber_open_in:      shiberOpenIn,
        shiber_close_out:    parseFloat(document.getElementById('val_shiber_close_out').textContent) || 0,
        traverse_down_speed: parseInt(document.getElementById('val_traverse_down_speed').textContent) || 0,
        conveyor_main_speed: parseFloat(document.getElementById('val_conveyor_main_speed').textContent) || 0,
        conveyor_low_speed:  parseFloat(document.getElementById('val_conveyor_low_speed').textContent) || 0
    };

    document.getElementById('lineSelect').value        = saved.line;
    document.getElementById('bottleHeightInput').value = saved.height;
    document.getElementById('bottleVolumeInput').value = saved.bottleVol;
    document.getElementById('targetWeightInput').value = saved.weight;
    document.getElementById('densityInput').value      = saved.density;
    document.getElementById('viscosityInput').value    = saved.visc;
    runUniversalCalculation();
    return ideal;
}

function simRenderTask() {
    if (!simCurrent) return;
    const { task, difficultyConfig, accident, brokenValue } = simCurrent;
    document.getElementById('sim-task-diff').textContent = difficultyConfig.name;
    const attemptLabel = simMP
        ? `Раунд ${simMP.currentRound} · ${simMP.players[simMP.currentTurn].name}`
        : `Задание ${simCurrent.attemptIndex}`;
    document.getElementById('sim-task-progress').textContent = attemptLabel;

    const streakEl = document.getElementById('sim-task-streak');
    if (simState.streak >= 2 && !simMP) {
        streakEl.textContent = `🔥 x${simState.streak} · ×${simGetStreakMultiplier()}`;
        streakEl.classList.remove('hidden');
    } else streakEl.classList.add('hidden');

    const titleEl = document.getElementById('sim-screen-title');
    const listEl = document.getElementById('sim-product-list');
    const prm = task.params;

    if (simMode === 'accident' && accident) {
        titleEl.textContent = accident.title;
        listEl.innerHTML = `
            <li style="grid-column: span 2; padding: 6px 0; color:#ffb020; font-family:var(--font-ui); font-size:12px; line-height:1.5;">${accident.description}</li>
            <li><span>Линия</span><b>Линия ${prm.line.replace('LINE_', '')}</b></li>
            <li><span>Объём</span><b>${prm.volume} мл</b></li>
            <li><span>Высота</span><b>${prm.height} мм</b></li>
            <li><span>Плотность</span><b>${prm.density.toFixed(2)}</b></li>
            <li><span>Вязкость</span><b>${prm.viscosity} ед.</b></li>
            ${difficultyConfig.fields.includes('delay') ? `
                <li style="border-top: 1px dashed rgba(255,176,32,0.3); padding-top: 4px; margin-top: 2px;">
                    <span style="color: rgba(255,176,32,0.7);">⚠️ Мин. задержка подъёма</span>
                    <b style="color: #ffb020;">${simComputeDelayMin(prm.viscosity).toFixed(1)} с</b>
                </li>` : ''}
            <li style="grid-column: span 2; border-top: 1px dashed rgba(255,176,32,0.3); padding-top: 6px; margin-top: 4px;">
                <span style="color: #ffb020;">⚠️ Аварийное ${SIM_FIELD_LABELS[accident.field]}:</span>
                <b style="color: #ff3344;">${accident.field === 'delay' ? brokenValue.toFixed(1) : Math.round(brokenValue)}</b>
            </li>`;
    } else {
        titleEl.textContent = '📋 ИСХОДНЫЕ ДАННЫЕ';
        listEl.innerHTML = `
            <li><span>Линия</span><b>Линия ${prm.line.replace('LINE_', '')}</b></li>
            <li><span>Объём флакона</span><b>${prm.volume} мл</b></li>
            <li><span>Высота флакона</span><b>${prm.height} мм</b></li>
            <li><span>Плотность</span><b>${prm.density.toFixed(2)}</b></li>
            <li><span>Вязкость</span><b>${prm.viscosity} ед.</b></li>
            <li><span>Целевой вес (V×ρ)</span><b>${Math.round(prm.volume * prm.density)} г</b></li>
            ${difficultyConfig.fields.includes('delay') ? `
                <li style="border-top: 1px dashed rgba(255,176,32,0.3); padding-top: 4px; margin-top: 2px;">
                    <span style="color: rgba(255,176,32,0.7);">⚠️ Мин. задержка подъёма</span>
                    <b style="color: #ffb020;">${simComputeDelayMin(prm.viscosity).toFixed(1)} с</b>
                </li>` : ''}
            ${task.isUserRecipe ? `<li style="grid-column: span 2; text-align:center; font-size:10px; color:#66e3ff;">📝 Из моих рецептов</li>` : ''}`;
    }

    const container = document.getElementById('sim-inputs');
    container.innerHTML = '';
    difficultyConfig.fields.forEach(field => {
        const row = document.createElement('div');
        row.className = 'sim-input-row';
        const stepMap = {
            pump_speed_1: '0.1', pump_speed_2: '0.1', pump_speed_3: '0.1',
            lift_speed_1: '1', lift_speed_2: '1', lift_speed_3: '1',
            nozzle_pos_1: '1', nozzle_pos_2: '1', nozzle_pos_3: '1',
            trans_volume_2: '1', trans_volume_3: '1',
            wait_point: '1', top_pour: '1', bottom_pos: '1',
            delay: '0.1',
            shiber_close_in: '0.1', shiber_open_in: '0.1', shiber_close_out: '0.1',
            traverse_down_speed: '1',
            conveyor_main_speed: '0.1', conveyor_low_speed: '0.1'
        };
        const step = stepMap[field] || '1';
        let suffix = '';
        if (field === 'delay' || field.startsWith('shiber_')) suffix = ' с';
        else if (field.startsWith('nozzle_pos_') || field === 'wait_point' || field === 'top_pour' || field === 'bottom_pos') suffix = ' мм';
        else if (field.startsWith('trans_volume_')) suffix = ' мл';
        else if (field.startsWith('conveyor_')) suffix = ' м/мин';
        row.innerHTML = `
            <label for="sim-input-${field}">${SIM_FIELD_LABELS[field]}${suffix}</label>
            <input id="sim-input-${field}" type="number" step="${step}" min="0" value="" autocomplete="off">`;
        container.appendChild(row);
    });

    document.getElementById('sim-hint').classList.add('hidden');

    const trainBanner = document.getElementById('sim-training-info');
    if (simTrainingMode) trainBanner.classList.remove('hidden');
    else trainBanner.classList.add('hidden');

    const limitsInfo = document.getElementById('sim-limits-info');
    if (limitsInfo) limitsInfo.style.display = simMode === 'accident' ? 'none' : 'block';

    const first = container.querySelector('input');
    if (first) setTimeout(() => first.focus(), 200);
}

function simShowHint() {
    if (!simCurrent) return;
    const { difficulty, accident } = simCurrent;
    let hintText;
    if (simMode === 'accident' && accident) {
        hintText = `💡 Авария в поле «${SIM_FIELD_LABELS[accident.field]}». Восстановите нормальное значение.`;
    } else {
        const hints = {
            easy:   `💡 Вода: базовые скорости. Мыло: скорость ниже, 2-я — выше. ⚠️ ПЛК: насос 1 ≤ 80 · насос 2 ≤ 80 · насос 3 ≤ 45.`,
            medium: `💡 Больше объём — выше 2-я скорость подъёма. Вязкий продукт — скорости ниже. ⚠️ Откр. шибера вход ≥ 0.4 с. Задержка подъёма: вода → 3.0 с, мыло → 1.5 с. Если сопла слишком глубоко погружаются — уменьшайте плавно по 0.2 с. Насос 1,2 ≤ 80 · насос 3 ≤ 45.`,
            hard:   `💡 Позиция 2 = 20% высоты, позиция 3 = 80%. ⚠️ Откр. шибера вход ≥ 0.4 с. Задержка ≥ 3.0 − (вязкость/800)×1.5. Если сопла слишком глубоко — шаг 0.2 с. Насос 1,2 ≤ 80 · насос 3 ≤ 45.`
        };
        hintText = hints[difficulty];
    }
    const hintEl = document.getElementById('sim-hint');
    hintEl.textContent = hintText;
    hintEl.classList.remove('hidden');
}

function simGetStreakMultiplier() {
    if (simState.streak >= 10) return 3;
    if (simState.streak >= 5)  return 2;
    if (simState.streak >= 3)  return 1.5;
    return 1;
}

function simCheckPLCOverload(fields) {
    for (const field of fields) {
        const limit = SIM_PLC_LIMITS[field];
        if (!limit) continue;
        const input = document.getElementById(`sim-input-${field}`);
        const value = parseFloat(input?.value);
        if (isFinite(value) && value > limit) return { field, value, limit };
    }
    return null;
}

function simCheck() {
    if (!simCurrent) return;
    const { difficultyConfig, task, ideal } = simCurrent;
    const target = task.ideal || ideal;

    if (difficultyConfig.fields.includes('shiber_open_in')) {
        const shiberInput = document.getElementById('sim-input-shiber_open_in');
        const shiberValue = parseFloat(shiberInput?.value);
        if (isFinite(shiberValue) && shiberValue >= 0 && shiberValue < 0.4) {
            simShowAccidentOverlay(); return;
        }
    }

    const overloadedField = simCheckPLCOverload(difficultyConfig.fields);
    if (overloadedField) { simShowOverloadOverlay(overloadedField); return; }

    let allOk = true;
    const results = [];
    document.querySelectorAll('.sim-input-hint, .sim-input-explain').forEach(el => el.remove());
    const taskVisc = task.params ? task.params.viscosity : 0;

    difficultyConfig.fields.forEach(field => {
        const input = document.getElementById(`sim-input-${field}`);
        const userValue = parseFloat(input.value);
        const idealValue = target[field];
        let ok = false, deviation = 0, delta = 0;
        if (isFinite(userValue) && idealValue > 0) {
            delta = userValue - idealValue;
            deviation = Math.abs(delta) / idealValue;
            ok = deviation <= difficultyConfig.tolerance;
        }
        let belowSafeDelay = false;
        if (field === 'delay' && isFinite(userValue)) {
            const delayMinSafe = simComputeDelayMin(taskVisc);
            if (userValue < delayMinSafe) { ok = false; belowSafeDelay = true; }
        }
        results.push({ field, userValue, idealValue, deviation, delta, ok, belowSafeDelay });
        input.classList.remove('is-correct', 'is-wrong');
        input.classList.add(ok ? 'is-correct' : 'is-wrong');

        const row = input.closest('.sim-input-row');
        const hintEl = document.createElement('span');
        hintEl.className = 'sim-input-hint';
        if (!isFinite(userValue)) { hintEl.classList.add('down'); hintEl.textContent = '?'; }
        else if (ok) { hintEl.classList.add('ok'); hintEl.textContent = '✓'; }
        else if (delta > 0) { hintEl.classList.add('up'); hintEl.textContent = '↑'; }
        else { hintEl.classList.add('down'); hintEl.textContent = '↓'; }
        row.appendChild(hintEl);

        if (!ok && isFinite(userValue) && idealValue > 0) {
            const expl = document.createElement('div');
            expl.className = 'sim-input-explain';
            const dirText = delta > 0 ? 'уменьшить' : 'увеличить';
            const diffAbs = Math.abs(delta);
            const diffText = ['pump_speed_1','pump_speed_2','pump_speed_3'].includes(field)
                ? diffAbs.toFixed(2) : Math.round(diffAbs);
            expl.innerHTML = `↑ <b>${dirText}</b> на <b>${diffText}</b> (допуск ±${(difficultyConfig.tolerance*100).toFixed(0)}%)`;
            row.appendChild(expl);
        }
        if (!ok) allOk = false;
    });

    if (simTrainingMode) {
        simShowOverlay(allOk, 0, results, allOk ? 'train-win' : 'train-lose');
        return;
    }

    simState.attempts++;
    let points = 0;
    if (allOk) {
        const tightness = results.reduce((acc, r) => {
            if (r.deviation <= 0.05) return acc + 2;
            if (r.deviation <= difficultyConfig.tolerance / 2) return acc + 1;
            return acc;
        }, 0);
        const perField = 100 + (tightness / results.length) * 100;
        points = Math.round(results.length * perField * difficultyConfig.multiplier * simGetStreakMultiplier());
        simState.score += points;
        simState.streak++;
        simState.wins++;
    } else simState.streak = 0;

    if (simState.score > simState.bestScore) simState.bestScore = simState.score;
    simSaveStats();

    let quality = 'fail';
    if (allOk) {
        const avgDev = results.reduce((a, r) => a + r.deviation, 0) / results.length;
        if (avgDev <= 0.03)      quality = 'perfect';
        else if (avgDev <= 0.07) quality = 'excellent';
        else if (avgDev <= 0.12) quality = 'good';
        else                     quality = 'ok';
    }
    simShowOverlay(allOk, points, results, quality);
}

function simShowAccidentOverlay() {
    const overlay = document.getElementById('sim-overlay');
    const badgeEl = document.getElementById('sim-overlay-badge');
    const textEl = document.getElementById('sim-overlay-text');
    const pointsEl = document.getElementById('sim-overlay-points');
    const subEl = document.getElementById('sim-overlay-sub');
    const particlesEl = document.getElementById('sim-particles');
    const crushEl = document.getElementById('sim-crush-anim');

    overlay.classList.remove('win', 'lose', 'flash', 'accident', 'overload');
    void overlay.offsetWidth;
    overlay.classList.add('accident', 'flash');
    particlesEl.innerHTML = '';
    badgeEl.textContent = '💥';
    textEl.textContent = 'ЗАМЯТИЕ ФЛАКОНА';
    pointsEl.textContent = 'ЗАДЕРЖКА < 0.4 с';
    subEl.textContent = SIM_CRUSH_LABELS[simCrushLabelIndex];
    simCrushLabelIndex = (simCrushLabelIndex + 1) % SIM_CRUSH_LABELS.length;

    if (crushEl) {
        crushEl.innerHTML = '';
        crushEl.classList.remove('hidden');
        for (let i = 0; i < 5; i++) {
            const b = document.createElement('div');
            b.className = 'sim-crush-bottle';
            crushEl.appendChild(b);
        }
        setTimeout(() => { crushEl.classList.add('hidden'); crushEl.innerHTML = ''; }, 1800);
    }
    simPlaySound('accident');
    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 500]);
    simSpawnParticles(false, 50);
    overlay.classList.remove('hidden');
    if (!simTrainingMode) { simState.attempts++; simState.streak = 0; simSaveStats(); }
    setTimeout(() => { overlay.classList.add('hidden'); simRenderAccidentResult(); }, 2800);
}

function simRenderAccidentResult() {
    document.getElementById('sim-task').classList.add('hidden');
    document.getElementById('sim-result').classList.remove('hidden');
    document.getElementById('sim-result-title').textContent = '💥 ЗАМЯТИЕ ФЛАКОНА — БРАК';
    const trainBadge = document.getElementById('sim-training-badge');
    if (simTrainingMode) trainBadge.classList.remove('hidden'); else trainBadge.classList.add('hidden');

    const shiberValue = parseFloat(document.getElementById('sim-input-shiber_open_in').value) || 0;
    document.getElementById('sim-result-body').innerHTML = `
        <div class="sim-result-row is-bad" style="border-left-width:5px; border-left-color:#ff5500;">
            <span class="sim-result-label">Откр. шибера вход</span>
            <span class="sim-result-user">${shiberValue.toFixed(1)} с</span>
            <span class="sim-result-ideal">→ ≥ 0.4 с</span>
            <span class="sim-result-delta"><span class="sim-arrow sim-arrow-up">!</span> КРИТИЧНО</span>
        </div>`;
    const explainBlock = document.getElementById('sim-explain-block');
    document.getElementById('sim-explain-list').innerHTML = `
        <li class="is-danger"><b>Задержка открытия входного шибера ниже 0.4 с.</b> Шибер открывается мгновенно — продукт бьёт в флакон, давление сминает его.</li>
        <li class="is-danger">Это критический режим. ПЛК может отклонить уставку или на линии произойдёт замятие.</li>
        <li>Всегда проверяйте: <b>Откр. шибера вход ≥ 0.4 с</b>. Типовое значение — 0.5 с.</li>`;
    explainBlock.classList.remove('hidden');
}

function simShowOverloadOverlay(overload) {
    const overlay = document.getElementById('sim-overlay');
    const badgeEl = document.getElementById('sim-overlay-badge');
    const textEl = document.getElementById('sim-overlay-text');
    const pointsEl = document.getElementById('sim-overlay-points');
    const subEl = document.getElementById('sim-overlay-sub');
    const particlesEl = document.getElementById('sim-particles');

    overlay.classList.remove('win', 'lose', 'flash', 'accident', 'overload');
    void overlay.offsetWidth;
    overlay.classList.add('overload', 'flash');
    particlesEl.innerHTML = '';
    badgeEl.textContent = '⚡';
    textEl.textContent = 'ПЕРЕГРУЗ НАСОСА';
    pointsEl.textContent = `${SIM_FIELD_LABELS[overload.field]}: ${overload.value} > ${overload.limit}`;
    subEl.textContent = 'ПЛК НЕ ПРИМЕТ ТАКУЮ УСТАВКУ!';
    simPlaySound('overload');
    if (navigator.vibrate) navigator.vibrate([200, 80, 200, 80, 400]);
    simSpawnParticles(false, 40);
    overlay.classList.remove('hidden');
    if (!simTrainingMode) { simState.attempts++; simState.streak = 0; simSaveStats(); }
    setTimeout(() => { overlay.classList.add('hidden'); simRenderOverloadResult(overload); }, 2800);
}

function simRenderOverloadResult(overload) {
    document.getElementById('sim-task').classList.add('hidden');
    document.getElementById('sim-result').classList.remove('hidden');
    document.getElementById('sim-result-title').textContent = '⚡ ПЕРЕГРУЗ НАСОСА — ОТКАЗ ПЛК';
    const trainBadge = document.getElementById('sim-training-badge');
    if (simTrainingMode) trainBadge.classList.remove('hidden'); else trainBadge.classList.add('hidden');

    document.getElementById('sim-result-body').innerHTML = `
        <div class="sim-result-row is-bad" style="border-left-width:5px; border-left-color:#ff5500;">
            <span class="sim-result-label">${SIM_FIELD_LABELS[overload.field]}</span>
            <span class="sim-result-user">${overload.value}</span>
            <span class="sim-result-ideal">→ ≤ ${overload.limit}</span>
            <span class="sim-result-delta"><span class="sim-arrow sim-arrow-up">!</span> КРИТИЧНО</span>
        </div>`;
    const explainBlock = document.getElementById('sim-explain-block');
    document.getElementById('sim-explain-list').innerHTML = `
        <li class="is-danger"><b>${SIM_FIELD_LABELS[overload.field]} = ${overload.value}</b> превышает максимум ПЛК (<b>${overload.limit}</b>).</li>
        <li class="is-danger">Контроллер откажется принять уставку или включит защиту по перегрузке.</li>
        <li>Запомните ограничения: <b>насос 1 ≤ 80 · насос 2 ≤ 80 · насос 3 ≤ 45</b>.</li>`;
    explainBlock.classList.remove('hidden');
}

function simShowOverlay(win, points, results, quality) {
    const overlay = document.getElementById('sim-overlay');
    const badgeEl = document.getElementById('sim-overlay-badge');
    const textEl = document.getElementById('sim-overlay-text');
    const pointsEl = document.getElementById('sim-overlay-points');
    const subEl = document.getElementById('sim-overlay-sub');
    const particlesEl = document.getElementById('sim-particles');

    overlay.classList.remove('win', 'lose', 'flash', 'accident', 'overload');
    particlesEl.innerHTML = '';
    badgeEl.textContent = '';
    subEl.textContent = '';
    void overlay.offsetWidth;
    overlay.classList.add(win ? 'win' : 'lose', 'flash');

    if (win) {
        const qualityMap = {
            perfect:   { badge: '💎', text: 'ИДЕАЛЬНО', sub: '★ АБСОЛЮТНАЯ ТОЧНОСТЬ ★' },
            excellent: { badge: '🏅', text: 'ОТЛИЧНО',  sub: '★ МАСТЕРСКАЯ РАБОТА ★' },
            good:      { badge: '⭐', text: 'ХОРОШО',   sub: '★ ГРАМОТНЫЙ ПОДХОД ★' },
            ok:        { badge: '✅', text: 'ЗАЧЁТ',    sub: '★ НАЛАДКА ПРИНЯТА ★' },
            'train-win':  { badge: '🎓', text: 'ОТРАБОТАНО', sub: '★ РЕЖИМ ТРЕНИРОВКИ ★' },
            'train-lose': { badge: '🎓', text: 'РАЗБОР',    sub: '★ ПОСМОТРИ НИЖЕ ★' }
        };
        const q = qualityMap[quality] || qualityMap.ok;
        badgeEl.textContent = q.badge;
        textEl.textContent = q.text;
        subEl.textContent = q.sub;

        if (simTrainingMode || quality === 'train-win') {
            pointsEl.textContent = 'БЕЗ ОЧКОВ (ТРЕНИРОВКА)';
            simPlaySound('win');
            simSpawnParticles(true, 40);
        } else {
            pointsEl.textContent = `+${points} ОЧКОВ${simState.streak >= 3 ? `  (×${simGetStreakMultiplier()})` : ''}`;
            simPlaySound(quality === 'perfect' ? 'perfect' : 'win');
            if (navigator.vibrate) navigator.vibrate([40, 30, 40, 30, 80]);
            simSpawnParticles(true, quality === 'perfect' ? 80 : 50);
            if (quality === 'perfect') setTimeout(() => simSpawnParticles(true, 60), 300);
        }
    } else {
        badgeEl.textContent = '💀';
        textEl.textContent = 'ПРОВАЛ';
        const okCount = results.filter(r => r.ok).length;
        pointsEl.textContent = `${okCount} / ${results.length}`;
        subEl.textContent = '★ ПОПРОБУЙ ЕЩЁ РАЗ ★';
        simPlaySound('lose');
        if (navigator.vibrate) navigator.vibrate([200, 80, 200, 80, 300]);
        simSpawnParticles(false, 20);
    }
    overlay.classList.remove('hidden');
    setTimeout(() => { overlay.classList.add('hidden'); simRenderResult(win, points, results); }, 2800);
}

function simSpawnParticles(win, count) {
    const container = document.getElementById('sim-particles');
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'sim-particle';
        const angle = Math.random() * Math.PI * 2;
        const distance = 120 + Math.random() * 320;
        p.style.left = '50%'; p.style.top = '50%';
        p.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
        p.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
        const colors = win ? ['#00ff44', '#00d4ff', '#ffb020', '#66e3ff'] : ['#ff3344', '#881122'];
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.boxShadow = `0 0 12px ${p.style.background}`;
        p.style.animationDelay = (Math.random() * 0.4) + 's';
        p.style.animationDuration = (1.4 + Math.random() * 0.8) + 's';
        container.appendChild(p);
    }
}

function simRenderResult(win, points, results) {
    document.getElementById('sim-task').classList.add('hidden');
    document.getElementById('sim-result').classList.remove('hidden');
    const titleEl = document.getElementById('sim-result-title');
    const trainBadge = document.getElementById('sim-training-badge');
    if (simTrainingMode) {
        titleEl.textContent = win ? '🎓 Отработано без ошибок' : '🎓 Тренировка — разбор ошибок';
        trainBadge.classList.remove('hidden');
    } else {
        titleEl.textContent = win ? '★ Задание выполнено' : '✖ Задание провалено';
        trainBadge.classList.add('hidden');
    }

    const body = document.getElementById('sim-result-body');
    body.innerHTML = '';
    results.forEach(r => {
        const row = document.createElement('div');
        row.className = 'sim-result-row' + (r.ok ? '' : ' is-bad');
        const userDisplay = isFinite(r.userValue) ? r.userValue : '—';
        const deltaPercent = r.idealValue > 0 ? ((r.userValue - r.idealValue) / r.idealValue * 100).toFixed(1) : '0';
        let arrow;
        if (!isFinite(r.userValue)) arrow = '<span class="sim-arrow sim-arrow-up">↑</span>';
        else if (r.ok) arrow = '<span class="sim-arrow sim-arrow-ok">✓</span>';
        else if (r.delta > 0) arrow = '<span class="sim-arrow sim-arrow-up">↑</span>';
        else arrow = '<span class="sim-arrow sim-arrow-down">↓</span>';
        if (r.belowSafeDelay) arrow = '<span class="sim-arrow sim-arrow-up">!</span>';
        const deltaText = r.ok ? '' : (r.delta > 0 ? '+' : '') + deltaPercent + '%';
        row.innerHTML = `
            <span class="sim-result-label">${SIM_FIELD_LABELS[r.field]}</span>
            <span class="sim-result-user">${userDisplay}</span>
            <span class="sim-result-ideal">→ ${r.idealValue}</span>
            <span class="sim-result-delta">${arrow} ${deltaText}</span>`;
        body.appendChild(row);
    });

    const explainBlock = document.getElementById('sim-explain-block');
    const explainList = document.getElementById('sim-explain-list');
    const needExplain = simTrainingMode || !win;
    if (needExplain) {
        const explanations = simBuildExplanations(results, simCurrent);
        if (explanations.length) {
            explainList.innerHTML = explanations.map(e => `<li class="${e.cls || ''}">${e.text}</li>`).join('');
            explainBlock.classList.remove('hidden');
        } else explainBlock.classList.add('hidden');
    } else explainBlock.classList.add('hidden');

    if (win && !simTrainingMode && simCheckHighScore() && !simMP) setTimeout(() => simAskName(), 400);
}

function simBuildExplanations(results, ctx) {
    const list = [];
    if (!ctx) return list;
    const task = ctx.task || {};
    const params = task.params || {};
    const visc = params.viscosity || 0;
    const bads = results.filter(r => !r.ok);

    if (!bads.length) {
        list.push({ cls: 'is-ok', text: '<b>Все уставки в допуске.</b> Можно запускать тестовую партию 5–10 флаконов.' });
        return list;
    }

    bads.forEach(r => {
        const field = r.field;
        const userValue = r.userValue;
        const isHigher = r.delta > 0;
        const diffAbs = Math.abs(r.delta);
        let reason = '';

        if (field === 'pump_speed_1') {
            reason = isHigher
                ? `1-я скорость завышена. ${visc > 1000 ? `При вязкости ${visc} ед. продукт пенится — первую ступень снижают на 20–30%.` : `Для маловязких продуктов первая ступень должна быть мягче.`} Снизьте на ≈${diffAbs.toFixed(2)}.`
                : `1-я скорость занижена. Слишком медленный старт. Добавьте ≈${diffAbs.toFixed(2)}.`;
        } else if (field === 'pump_speed_2') {
            reason = isHigher
                ? `2-я скорость завышена — основной поток. Уменьшите на ≈${diffAbs.toFixed(2)}.`
                : `2-я скорость занижена — продукт не успевает заполнить флакон. Добавьте ≈${diffAbs.toFixed(2)}.`;
        } else if (field === 'pump_speed_3') {
            reason = isHigher
                ? `3-я скорость завышена. Верхний долив слишком резкий — будут брызги. Снизьте на ≈${diffAbs.toFixed(2)}.`
                : `3-я скорость занижена — недолив по верхней кромке. Добавьте ≈${diffAbs.toFixed(2)}.`;
        } else if (field.startsWith('lift_speed_')) {
            reason = isHigher
                ? `Скорость подъёма завышена — брызги и капли на горлышке. Уменьшите на ≈${Math.round(diffAbs)}.`
                : `Скорость подъёма занижена — теряется такт. Добавьте ≈${Math.round(diffAbs)}.`;
        } else if (field === 'bottom_pos') {
            reason = `Нижнее положение сопла задано неверно. Отклонение ${isHigher ? '+' : '−'}${Math.round(diffAbs)} мм.`;
        } else if (field === 'top_pour') {
            reason = `Верхний налив задан неверно. Ориентир: высота флакона − 30 мм. Отклонение ${isHigher ? '+' : '−'}${Math.round(diffAbs)} мм.`;
        } else if (field === 'delay') {
            const delayMinSafe = simComputeDelayMin(visc);
            if (r.belowSafeDelay) {
                list.push({ cls: 'is-danger', text: `<b>Задержка подъёма ${userValue.toFixed(1)} с ниже безопасного минимума ${delayMinSafe.toFixed(1)} с</b> для вязкости ${visc} ед. Чем жиже продукт, тем дольше сопло должно быть в нижней точке.` });
                return;
            }
            reason = isHigher
                ? `Задержка подъёма завышена. Сопло слишком долго в нижней точке. <b>Уменьшайте плавно по 0.2 с.</b>`
                : `Задержка подъёма занижена. Минимум для вязкости ${visc} ед. — ${delayMinSafe.toFixed(1)} с.`;
        } else if (field === 'shiber_open_in') {
            reason = `Открытие входного шибера настроено неверно. Норма ≥ 0.4 с. ${isHigher ? 'Слишком долгая задержка снижает такт.' : 'Слишком быстрая — риск замятия.'}`;
        } else if (field.startsWith('nozzle_pos_')) {
            const num = field.slice(-1);
            const ref = num === '1' ? '40 мм' : num === '2' ? '20% от высоты' : '80% от высоты';
            reason = `Положение сопла ${num} задано неверно. Ориентир: ${ref}. Отклонение ${isHigher ? '+' : '−'}${Math.round(diffAbs)} мм.`;
        } else if (field.startsWith('trans_volume_')) {
            reason = `Объём перехода ${field.slice(-1)} задан неверно. Отклонение ${isHigher ? '+' : '−'}${Math.round(diffAbs)} мл.`;
        } else if (field === 'wait_point') {
            reason = `Верхнее положение сопла — точка ожидания. Ориентир: высота + 100 мм. Отклонение ${isHigher ? '+' : '−'}${Math.round(diffAbs)} мм.`;
        } else if (field === 'shiber_close_in' || field === 'shiber_close_out') {
            const name = field === 'shiber_close_in' ? 'входа' : 'выхода';
            reason = `Тайминг закрытия шибера ${name}: ${isHigher ? 'слишком долгая пауза — снижается такт.' : 'слишком быстрая — риск протечки.'}`;
        } else if (field === 'traverse_down_speed') {
            reason = `Скорость опускания траверсы: ${isHigher ? 'слишком быстро — удары и износ.' : 'слишком медленно — теряется такт.'}`;
        } else if (field === 'conveyor_main_speed' || field === 'conveyor_low_speed') {
            const name = field === 'conveyor_main_speed' ? 'Основная' : 'Низкая';
            reason = `${name} скорость конвейера задана неверно. Отклонение ${isHigher ? '+' : '−'}${diffAbs.toFixed(2)} м/мин.`;
        }
        if (reason) list.push({ text: reason });
    });
    return list;
}

function simAskName() {
    document.getElementById('sim-name-input').value = '';
    document.getElementById('sim-name-overlay').classList.remove('hidden');
    setTimeout(() => document.getElementById('sim-name-input').focus(), 200);
}

function simSubmitName() {
    const name = document.getElementById('sim-name-input').value.trim() || 'Аноним';
    simPushToLeaderboard(name);
    document.getElementById('sim-name-overlay').classList.add('hidden');
}

function simSkipName() {
    simPushToLeaderboard('Аноним');
    document.getElementById('sim-name-overlay').classList.add('hidden');
}

function simNext() {
    if (!simCurrent) { simBackToMenu(); return; }
    if (simMP) { simMPNext(); return; }
    const line = simCurrent.task.params.line;
    simPendingDifficulty = simCurrent.difficulty;
    simPickLine(line);
}

function simShowCalc() {
    if (!simCurrent) return;
    const prm = simCurrent.task.params;
    document.getElementById('lineSelect').value = prm.line;
    document.getElementById('bottleHeightInput').value = prm.height;
    document.getElementById('bottleVolumeInput').value = prm.volume;
    document.getElementById('targetWeightInput').value = Math.round(prm.volume * prm.density);
    document.getElementById('densityInput').value = prm.density;
    document.getElementById('viscosityInput').value = prm.viscosity;
    runUniversalCalculation();
    switchTab('filling');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function simOpenMultiplayer() {
    simHideAll();
    document.getElementById('sim-mp-setup').classList.remove('hidden');
}

function simMPStart() {
    const p1 = document.getElementById('sim-mp-p1').value.trim() || 'Игрок 1';
    const p2 = document.getElementById('sim-mp-p2').value.trim() || 'Игрок 2';
    const rounds = parseInt(document.getElementById('sim-mp-rounds').value) || 5;
    simMP = {
        players: [{ name: p1, score: 0 }, { name: p2, score: 0 }],
        currentTurn: 0, currentRound: 1, totalRounds: rounds
    };
    simMode = 'classic'; simTrainingMode = false;
    const lines = ['LINE_1_1', 'LINE_1_2', 'LINE_1_3', 'LINE_1_4', 'LINE_1_5', 'LINE_1_6'];
    simPendingDifficulty = 'medium';
    simPickLine(lines[Math.floor(Math.random() * lines.length)]);
    simMPRenderScoreboard();
}

function simMPRenderScoreboard() {
    if (!simMP) return;
    document.getElementById('sim-mp-score').classList.remove('hidden');
    document.getElementById('sim-mp-p1-name').textContent  = simMP.players[0].name;
    document.getElementById('sim-mp-p2-name').textContent  = simMP.players[1].name;
    document.getElementById('sim-mp-p1-score').textContent = simMP.players[0].score;
    document.getElementById('sim-mp-p2-score').textContent = simMP.players[1].score;
    document.getElementById('sim-mp-round').textContent = `Раунд ${simMP.currentRound} / ${simMP.totalRounds}`;
    document.getElementById('sim-mp-p1-card').classList.toggle('active', simMP.currentTurn === 0);
    document.getElementById('sim-mp-p2-card').classList.toggle('active', simMP.currentTurn === 1);
}

function simMPNext() {
    if (!simMP) return;
    if (simMP.currentTurn === 0) simMP.currentTurn = 1;
    else { simMP.currentTurn = 0; simMP.currentRound++; }
    if (simMP.currentRound > simMP.totalRounds) { simMPFinish(); return; }
    const lines = ['LINE_1_1', 'LINE_1_2', 'LINE_1_3', 'LINE_1_4', 'LINE_1_5', 'LINE_1_6'];
    simPendingDifficulty = 'medium';
    simPickLine(lines[Math.floor(Math.random() * lines.length)]);
    simMPRenderScoreboard();
}

function simMPFinish() {
    if (!simMP) return;
    const p1 = simMP.players[0], p2 = simMP.players[1];
    const winner = p1.score > p2.score ? p1 : (p2.score > p1.score ? p2 : null);
    simHideAll();
    const overlay = document.getElementById('sim-overlay');
    const badgeEl = document.getElementById('sim-overlay-badge');
    const textEl = document.getElementById('sim-overlay-text');
    const pointsEl = document.getElementById('sim-overlay-points');
    const subEl = document.getElementById('sim-overlay-sub');
    overlay.classList.remove('win', 'lose', 'accident', 'overload');
    overlay.classList.add(winner ? 'win' : 'lose', 'flash');
    if (winner) {
        badgeEl.textContent = '🏆';
        textEl.textContent = winner.name;
        pointsEl.textContent = `${p1.name}: ${p1.score} · ${p2.name}: ${p2.score}`;
        subEl.textContent = '★ ПОБЕДА ★';
        simPlaySound('perfect');
    } else {
        badgeEl.textContent = '🤝';
        textEl.textContent = 'НИЧЬЯ';
        pointsEl.textContent = `${p1.score} : ${p2.score}`;
        subEl.textContent = '★ РАВНЫЙ БОЙ ★';
        simPlaySound('win');
    }
    simSpawnParticles(!!winner, 60);
    overlay.classList.remove('hidden');
    setTimeout(() => { overlay.classList.add('hidden'); simMP = null; simBackToMenu(); }, 4000);
}

// ============================================================
// 14. ЗВУКИ
// ============================================================

let simAudioCtx = null;

function simPlaySound(type) {
    try {
        if (!simAudioCtx) simAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = simAudioCtx;
        const playBeep = (freq, startTime, duration, volume = 0.15, waveType = 'square') => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = waveType;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
            gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(ctx.currentTime + startTime);
            osc.stop(ctx.currentTime + startTime + duration);
        };
        if (type === 'accident') {
            playBeep(1046, 0.00, 0.08, 0.20, 'sawtooth');
            playBeep(784,  0.08, 0.10, 0.20, 'sawtooth');
            playBeep(523,  0.18, 0.12, 0.20, 'sawtooth');
            playBeep(261,  0.30, 0.25, 0.20, 'sawtooth');
            playBeep(130,  0.55, 0.50, 0.15, 'sawtooth');
        } else if (type === 'overload') {
            playBeep(180, 0.00, 0.10, 0.18, 'square');
            playBeep(180, 0.12, 0.10, 0.18, 'square');
            playBeep(220, 0.24, 0.10, 0.18, 'square');
            playBeep(220, 0.36, 0.10, 0.18, 'square');
            playBeep(140, 0.50, 0.40, 0.20, 'square');
            playBeep(110, 0.90, 0.60, 0.18, 'square');
        } else if (type === 'win') {
            playBeep(523, 0.00, 0.12); playBeep(659, 0.12, 0.12);
            playBeep(784, 0.24, 0.12); playBeep(1046, 0.36, 0.30);
        } else if (type === 'perfect') {
            playBeep(523, 0.00, 0.10); playBeep(659, 0.10, 0.10);
            playBeep(784, 0.20, 0.10); playBeep(1046, 0.30, 0.15);
            playBeep(1318, 0.45, 0.15); playBeep(1568, 0.60, 0.40, 0.18, 'sawtooth');
        } else if (type === 'lose') {
            playBeep(392, 0.00, 0.15); playBeep(311, 0.15, 0.15);
            playBeep(261, 0.30, 0.20); playBeep(196, 0.50, 0.35);
        }
    } catch {}
}

// ============================================================
// 15. МОИ РЕЦЕПТЫ
// ============================================================

function openUserRecipes() {
    document.getElementById('user-recipes-overlay').classList.remove('hidden');
    userRecipeRender();
}
function closeUserRecipes() { document.getElementById('user-recipes-overlay').classList.add('hidden'); }

function userRecipeRender() {
    const list = document.getElementById('user-recipe-list');
    const empty = document.getElementById('user-recipe-empty');
    if (!simUserRecipes.length) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');
    list.innerHTML = simUserRecipes.map((r, i) => `
        <div class="sim-prod-item">
            <b>${r.name}</b>
            <span>${r.line.replace('LINE_', 'Л')}</span>
            <span>${r.volume} мл</span>
            <span>ρ=${r.density.toFixed(2)} η=${r.viscosity}</span>
            <button class="sim-prod-del" onclick="userRecipeDel(${i})" title="Удалить">✕</button>
        </div>`).join('');
}

function userRecipeAdd() {
    const name = document.getElementById('ur-name').value.trim();
    const line = document.getElementById('ur-line').value;
    const volume = parseFloat(document.getElementById('ur-volume').value) || 0;
    const density = parseFloat(document.getElementById('ur-density').value) || 1.0;
    const viscosity = parseFloat(document.getElementById('ur-visc').value) || 0;
    if (!name) { alert('Введите название'); return; }
    if (volume < 50 || volume > 6000) { alert('Объём 50–6000 мл'); return; }
    if (density < 0.75 || density > 1.30) { alert('Плотность 0.75–1.30'); return; }
    simUserRecipes.push({ name, line, volume, density, viscosity });
    simSaveUserRecipes();
    userRecipeRender();
    document.getElementById('ur-name').value = '';
    document.getElementById('ur-volume').value = '500';
    document.getElementById('ur-density').value = '1.00';
    document.getElementById('ur-visc').value = '0';
    document.getElementById('ur-name').focus();
}

function userRecipeDel(idx) {
    if (!confirm('Удалить этот рецепт?')) return;
    simUserRecipes.splice(idx, 1);
    simSaveUserRecipes();
    userRecipeRender();
}

function userRecipeClear() {
    if (!simUserRecipes.length) return;
    if (!confirm('Удалить все мои рецепты?')) return;
    simUserRecipes = []; simSaveUserRecipes(); userRecipeRender();
}

function simInit() {
    simLoadStats();
    simUpdateStatsUI();
}

// ============================================================
// 16. ИНИЦИАЛИЗАЦИЯ
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
    initEngStorage();
    loadJournal();
    simInit();
    runUniversalCalculation();
    switchTab('filling');
    calculateLabelerFrequencies();
    updateKnifeInstructions();
    selectCappingType('cap');

    document.getElementById('eng-confirm-save')?.addEventListener('click', engConfirmSave);
    document.getElementById('eng-confirm-discard')?.addEventListener('click', engConfirmDiscard);
    document.getElementById('eng-confirm-cancel')?.addEventListener('click', engConfirmCancel);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js').catch((e) => {
            console.log('SW не зарегистрирован:', e);
        });
    }

    console.log('✅ Mobile Assistant 2.0 загружен');
});
