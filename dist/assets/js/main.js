'use strict';

/**
 * ==========================================================================
 * Preloader
 * Скрывает прелоадер после полной загрузки страницы (событие window "load").
 * ==========================================================================
 */
function initPreloader() {
    const preloader = document.querySelector('.preloader');
    if (!preloader) return;

    window.addEventListener('load', () => {
        preloader.classList.add('loaded');

        setTimeout(() => {
            preloader.style.transition = 'opacity 0.4s ease';
            preloader.style.opacity = '0';

            setTimeout(() => {
                preloader.style.display = 'none';
            }, 400);
        }, 600);
    });
}


/**
 * ==========================================================================
 * Валидация форм (form.needs-validation)
 * ==========================================================================
 */
function initFormValidation() {
    const forms = document.querySelectorAll('form.needs-validation');
    if (!forms.length) return;

    forms.forEach(setupFormValidation);
}

function setupFormValidation(form) {
    function getState(input) {
        if (!input.value.trim()) return 'error';
        if (!input.validity.valid) return 'error';
        return 'valid';
    }

    function setFieldState(input, state) {
        const wrapper = input.closest('.has-validation');
        if (!wrapper) return;

        wrapper.classList.remove('is-error', 'is-warning');

        if (state === 'error') wrapper.classList.add('is-error');
        if (state === 'warning') wrapper.classList.add('is-warning');
    }

    function validateField(input) {
        const state = getState(input);
        setFieldState(input, state);
        return state === 'valid';
    }

    form.querySelectorAll('input[required]').forEach(input => {
        input.addEventListener('input', () => {
            if (!form.dataset.submitted) return;
            validateField(input);
        });
    });

    form.addEventListener('submit', async e => {
        e.preventDefault();
        e.stopPropagation();
        form.dataset.submitted = 'true';

        const inputs = [...form.querySelectorAll('input[required]')];
        const allValid = inputs.map(validateField).every(Boolean);

        if (!allValid) return;

        // try {
        //   const res = await fetch('/api/login', { method: 'POST', ... });
        //   const data = await res.json();
        //
        //   if (data.error === 'email_not_found') {
        //     setFieldState(form.querySelector('input[type="email"]'), 'warning');
        //     return;
        //   }
        //   if (data.error === 'wrong_password') {
        //     setFieldState(form.querySelector('input[type="password"]'), 'error');
        //     return;
        //   }
        // } catch (err) {
        //   console.error(err);
        // }
    });
}


/**
 * ==========================================================================
 * Красивый переключатель с плавающим фоном (.tab-group)
 * ==========================================================================
 */
function initTabSliders() {
    const groups = document.querySelectorAll('.tab-group');
    if (!groups.length) return;

    groups.forEach(setupTabSlider);
}

function setupTabSlider(group) {
    const slider = group.querySelector('.tab-slider');
    const buttons = group.querySelectorAll('.tab-btn');
    const activeBtn = group.querySelector('.tab-btn.active');

    if (!slider || !buttons.length || !activeBtn) return;

    function moveSlider(el) {
        const groupRect = group.getBoundingClientRect();
        const btnRect = el.getBoundingClientRect();
        slider.style.width = btnRect.width + 'px';
        slider.style.transform = `translateX(${btnRect.left - groupRect.left - 4}px)`;
    }

    moveSlider(activeBtn);

    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            moveSlider(btn);
        });

        btn.addEventListener('mouseleave', () => {
            buttons.forEach(b => b.classList.remove('active'));
            activeBtn.classList.add('active');
            moveSlider(activeBtn);
        });
    });
}


/**
 * ==========================================================================
 * Кнопка с таймером в модалках ([data-bs-target] / [data-coreui-target])
 * ==========================================================================
 */
function initModalTimerButtons() {
    const triggers = document.querySelectorAll('[data-bs-target], [data-coreui-target]');
    if (!triggers.length) return;

    triggers.forEach(setupModalTimerButton);
}

function setupModalTimerButton(trigger) {
    const targetSelector = trigger.dataset.bsTarget || trigger.dataset.coreuiTarget;
    if (!targetSelector) return;

    const modal = document.querySelector(targetSelector);
    if (!modal) return;

    const timerBtn = modal.querySelector('.button-timer')?.closest('button');
    if (!timerBtn) return;

    const DURATION = 55; // секунды
    const originalHTML = timerBtn.innerHTML;
    let interval = null;

    function formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    function startTimer() {
        let seconds = DURATION;

        // Восстанавливаем оригинальный текст и состояние
        timerBtn.innerHTML = originalHTML;
        timerBtn.classList.add('btn-outline-secondary', 'disabled');
        timerBtn.classList.remove('btn-primary');
        timerBtn.disabled = true;

        // После восстановления HTML — переинициализируем ссылку на span
        const timerSpan = timerBtn.querySelector('.button-timer');

        clearInterval(interval);
        interval = setInterval(() => {
            seconds--;
            timerSpan.textContent = formatTime(seconds);

            if (seconds <= 0) {
                clearInterval(interval);
                timerBtn.classList.remove('btn-outline-secondary', 'disabled');
                timerBtn.classList.add('btn-primary');
                timerBtn.disabled = false;
                timerBtn.textContent = 'Отправить повторно'; // ← меняем весь текст
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(interval);
    }

    // CoreUI / Bootstrap оба бросают эти события на элементе модалки
    modal.addEventListener('show.bs.modal', startTimer);
    modal.addEventListener('show.coreui.modal', startTimer);
    modal.addEventListener('hide.bs.modal', stopTimer);
    modal.addEventListener('hide.coreui.modal', stopTimer);
}


/**
 * ==========================================================================
 * Поля .mustFilled — кнопка становится активной, только когда ВСЕ
 * обязательные поля внутри формы заполнены
 * ==========================================================================
 */
function initMustFilledFields() {
    const fields = document.querySelectorAll('.mustFilled');
    if (!fields.length) return;

    const forms = new Set();
    fields.forEach(field => {
        const form = field.closest('form');
        if (form) forms.add(form);
    });

    forms.forEach(setupMustFilledForm);
}

function setupMustFilledForm(form) {
    const fields = form.querySelectorAll('.mustFilled');
    const btn = form.querySelector('button[type="submit"], button.btn-primary');

    if (!fields.length || !btn) return;

    function isFieldFilled(field) {
        if (field.type === 'checkbox' || field.type === 'radio') return field.checked;
        return field.value.trim() !== '';
    }

    function toggleBtn() {
        const allFilled = [...fields].every(isFieldFilled);
        btn.disabled = !allFilled;
    }

    toggleBtn(); // выставляем правильное состояние сразу при загрузке

    fields.forEach(field => {
        const eventType = (field.tagName === 'SELECT' || field.type === 'checkbox' || field.type === 'radio')
            ? 'change'
            : 'input';

        field.addEventListener(eventType, toggleBtn);
    });
}


/**
 * ==========================================================================
 * Кнопки submit с data-coreui-target / data-bs-target — открывают модалку
 * вместо стандартной отправки формы
 * ==========================================================================
 */
function initSubmitModals() {
    const buttons = document.querySelectorAll(
        'button[type="submit"][data-coreui-target], button[type="submit"][data-bs-target]'
    );
    if (!buttons.length) return;

    buttons.forEach(setupSubmitModalButton);
}

function setupSubmitModalButton(btn) {
    const form = btn.closest('form');
    if (!form) return;

    const targetSelector = btn.dataset.coreuiTarget || btn.dataset.bsTarget;
    if (!targetSelector) return;

    const modalEl = document.querySelector(targetSelector);
    if (!modalEl) return;

    form.addEventListener('submit', e => {
        e.preventDefault();

        const ModalClass = window.coreui?.Modal || window.bootstrap?.Modal;
        if (!ModalClass) return;

        ModalClass.getOrCreateInstance(modalEl).show();
    });
}


/**
 * ==========================================================================
 * Нативные тултипы CoreUI/Bootstrap ([data-coreui-toggle="tooltip"] / [data-bs-toggle="tooltip"])
 * ==========================================================================
 */
function initTooltips() {
    const triggers = document.querySelectorAll(
        '[data-coreui-toggle="tooltip"], [data-bs-toggle="tooltip"]'
    );
    if (!triggers.length) return;

    const TooltipClass = window.coreui?.Tooltip || window.bootstrap?.Tooltip;
    if (!TooltipClass) {
        console.warn('Tooltip недоступен: библиотека CoreUI/Bootstrap не подключена');
        return;
    }

    triggers.forEach(trigger => {
        TooltipClass.getOrCreateInstance(trigger);
    });
}


/**
 * ==========================================================================
 * Radio-группы с collapse-триггером (label[data-coreui-toggle="collapse"])
 * При выборе ДРУГОГО radio в той же группе — collapse закрывается,
 * а все поля внутри него очищаются
 * ==========================================================================
 */
function initRadioCollapseReset() {
    const collapseTriggers = document.querySelectorAll(
        'label[data-coreui-toggle="collapse"][for], label[data-bs-toggle="collapse"][for]'
    );
    if (!collapseTriggers.length) return;

    collapseTriggers.forEach(setupRadioCollapseReset);
}

function setupRadioCollapseReset(triggerLabel) {
    const triggerInput = document.getElementById(triggerLabel.htmlFor);
    if (!triggerInput || triggerInput.type !== 'radio' || !triggerInput.name) return;

    const targetSelector = triggerLabel.dataset.coreuiTarget || triggerLabel.dataset.bsTarget;
    if (!targetSelector) return;

    const collapseEl = document.querySelector(targetSelector);
    if (!collapseEl) return;

    const groupRadios = document.querySelectorAll(`input[type="radio"][name="${triggerInput.name}"]`);
    if (!groupRadios.length) return;

    function clearCollapseFields() {
        collapseEl.querySelectorAll('input, textarea, select').forEach(field => {
            if (field.type === 'checkbox' || field.type === 'radio') {
                field.checked = false;
            } else {
                field.value = '';
            }
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    function closeCollapse() {
        const CollapseClass = window.coreui?.Collapse || window.bootstrap?.Collapse;
        if (!CollapseClass) return;

        const instance = CollapseClass.getInstance(collapseEl);
        instance?.hide();
    }

    groupRadios.forEach(radio => {
        if (radio === triggerInput) return; // сам триггер не трогаем

        radio.addEventListener('change', () => {
            if (!radio.checked) return;
            if (!collapseEl.classList.contains('show')) return;

            closeCollapse();
            clearCollapseFields();
        });
    });
}


/**
 * ==========================================================================
 * Модалка #modalEstateCardDeleteDraft2 — автозакрытие через 5 секунд
 * ==========================================================================
 */
function initAutoCloseModal() {
    const modal = document.getElementById('modalEstateCardDeleteDraft2');
    if (!modal) return;

    const AUTO_CLOSE_DELAY = 2000; // мс
    let timer = null;

    function closeModal() {
        const ModalClass = window.coreui?.Modal || window.bootstrap?.Modal;
        if (!ModalClass) return;

        const instance = ModalClass.getInstance(modal);
        instance?.hide();
    }

    function handleShow() {
        clearTimeout(timer);
        timer = setTimeout(closeModal, AUTO_CLOSE_DELAY);
    }

    function handleHide() {
        clearTimeout(timer);
    }

    modal.addEventListener('shown.bs.modal', handleShow);
    modal.addEventListener('shown.coreui.modal', handleShow);
    modal.addEventListener('hide.bs.modal', handleHide);
    modal.addEventListener('hide.coreui.modal', handleHide);
}


/**
 * ==========================================================================
 * Notifications cards — кнопка "Читать дальше" (.item-notification)
 * ==========================================================================
 */
function initReadMore() {
    const cards = document.querySelectorAll('.item-notification');
    if (!cards.length) return;

    cards.forEach(setupReadMoreCard);

    if (!initReadMore._resizeBound) {
        initReadMore._resizeBound = true;
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                cards.forEach(setupReadMoreCard);
            }, 150);
        });
    }
}

function setupReadMoreCard(card) {
    const textBox = card.querySelector('.text-box');
    const btnWrap = card.querySelector('.btn-read-more-wrap');
    const toggleBtn = card.querySelector('.btn-read-more');
    const btnSpan = toggleBtn?.querySelector('span');

    if (!textBox || !btnWrap || !toggleBtn || !btnSpan) return;

    // сбрасываем состояние перед проверкой
    textBox.classList.remove('expanded');
    btnSpan.textContent = 'Читать дальше';

    const isClamped = textBox.scrollHeight > textBox.clientHeight + 1;
    btnWrap.style.display = isClamped ? '' : 'none';

    if (!card.dataset.readMoreInit) {
        card.dataset.readMoreInit = 'true';

        toggleBtn.addEventListener('click', () => {
            const expanded = textBox.classList.toggle('expanded');
            btnSpan.textContent = expanded ? 'Свернуть' : 'Читать дальше';
        });
    }
}


/**
 * ==========================================================================
 * Search field CoreUI Autocomplete (#myAutoCompleteExternalData)
 * https://coreui.io/bootstrap/docs/forms/autocomplete/#external-data
 * ==========================================================================
 */
function initAutocompleteExternalData() {
    const el = document.getElementById('myAutoCompleteExternalData');
    if (!el) return;

    if (typeof coreui === 'undefined' || !coreui.Autocomplete) {
        console.warn('CoreUI Autocomplete недоступен: библиотека CoreUI не подключена');
        return;
    }

    const getUsers = async (name = '') => {
        try {
            const response = await fetch(`https://apitest.coreui.io/demos/users?first_name=${name}&limit=10`);
            const users = await response.json();

            return users.records.map(user => ({
                value: user.id,
                label: user.first_name
            }));
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error fetching users:', error);
        }
    };

    const autocomplete = new coreui.Autocomplete(el, {
        cleaner: true,
        highlightOptionsOnSearch: true,
        name: 'autocomplete-external',
        options: [],
        placeholder: 'Введите адрес объекта',
        search: ['external', 'global'], // 🔴 'external' is required for external search
        showHints: true
    });

    let lastQuery = null;
    let debounceTimer = null;

    el.addEventListener('show.coreui.autocomplete', async () => {
        const users = await getUsers();
        autocomplete.update({ options: users });
    });

    el.addEventListener('input.coreui.autocomplete', event => {
        const query = event.value;

        if (query === lastQuery) return;
        lastQuery = query;

        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(async () => {
            const users = await getUsers(query);
            autocomplete.update({ options: users });
        }, 200);
    });
}


/**
 * ==========================================================================
 * Bootstrap: запуск всех модулей после готовности DOM
 * ==========================================================================
 */
function initApp() {
    initPreloader();
    initFormValidation();
    initTabSliders();
    initModalTimerButtons();
    initMustFilledFields();
    initSubmitModals();
    initTooltips();
    initRadioCollapseReset();
    initAutoCloseModal();
    initReadMore();
    initAutocompleteExternalData();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}