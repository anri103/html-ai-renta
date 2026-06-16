// Preloader
window.addEventListener("load", function () {
    const preloader = document.querySelector(".preloader");

    if (!preloader) return;

    preloader.classList.add("loaded");

    setTimeout(() => {
        preloader.style.transition = "opacity 0.4s ease";
        preloader.style.opacity = "0";

        setTimeout(() => {
            preloader.style.display = "none";
        }, 400);
    }, 600);
});


// Валидация форм
document.querySelectorAll('form.needs-validation').forEach(form => {

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
});


// Красивый переключатель с плавающим фоном
document.querySelectorAll('.tab-group').forEach(group => {
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
});


// Кнопка с таймером в модалках
document.querySelectorAll('[data-bs-target], [data-coreui-target]').forEach(trigger => {
    const targetSelector = trigger.dataset.bsTarget || trigger.dataset.coreuiTarget;
    if (!targetSelector) return;

    const modal = document.querySelector(targetSelector);
    if (!modal) return;

    const timerBtn = modal.querySelector('.button-timer')?.closest('button');
    if (!timerBtn) return;

    const timerSpan = timerBtn.querySelector('.button-timer');
    const DURATION = 55; // секунды
    let interval = null;

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

    const originalHTML = timerBtn.innerHTML;

    function stopTimer() {
        clearInterval(interval);
    }

    function formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    // CoreUI / Bootstrap оба бросают эти события на элементе модалки
    modal.addEventListener('show.bs.modal', startTimer);
    modal.addEventListener('show.coreui.modal', startTimer);
    modal.addEventListener('hide.bs.modal', stopTimer);
    modal.addEventListener('hide.coreui.modal', stopTimer);
});


// notifications cards - read more button
function initReadMore() {
    document.querySelectorAll('.item-notification').forEach(card => {
        const textBox = card.querySelector('.text-box');
        const btnWrap = card.querySelector('.btn-read-more-wrap');
        const toggleBtn = card.querySelector('.btn-read-more');
        const btnSpan = toggleBtn?.querySelector('span');

        if (!textBox || !btnWrap || !toggleBtn) return;

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
    });
}

initReadMore();

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initReadMore, 150);
});

// Search field CoreUI Autocomplete
// https://coreui.io/bootstrap/docs/forms/autocomplete/#external-data
function initAutocompleteExternalData() {
    const el = document.getElementById('myAutoCompleteExternalData')
    if (!el) {
        return
    }

    const getUsers = async (name = '') => {
        try {
            const response = await fetch(`https://apitest.coreui.io/demos/users?first_name=${name}&limit=10`)
            const users = await response.json()

            return users.records.map(user => ({
                value: user.id,
                label: user.first_name
            }))
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error fetching users:', error)
        }
    }

    const autocomplete = new coreui.Autocomplete(el, {
        cleaner: true,
        highlightOptionsOnSearch: true,
        name: 'autocomplete-external',
        options: [],
        placeholder: 'Введите адрес объекта',
        search: ['external', 'global'], // 🔴 'external' is required for external search
        showHints: true
    })

    let lastQuery = null
    let debounceTimer = null

    el.addEventListener('show.coreui.autocomplete', async () => {
        const users = await getUsers()
        autocomplete.update({ options: users })
    })

    el.addEventListener('input.coreui.autocomplete', event => {
        const query = event.value

        if (query === lastQuery) {
            return
        }

        lastQuery = query

        clearTimeout(debounceTimer)

        debounceTimer = setTimeout(async () => {
            const users = await getUsers(query)
            autocomplete.update({ options: users })
        }, 200)
    })
}

initAutocompleteExternalData();