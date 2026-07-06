// Новые глобальные переменные
let passagesData = {};          // Сюда мы загрузим все тексты из JSON
let currentDifficulty = 'medium'; // Сложность по умолчанию
let currentText = '';           // Текущий текст, который юзер должен набрать

// Захватываем элементы из HTML DOM дерева
const wordsWrapper = document.getElementById('words-wrapper');
const hiddenInput = document.getElementById('keyboard-hidden-input');
const wpmDisplay = document.getElementById('cpm-value');
const accuracyDisplay = document.getElementById('accuracy');
const timeDisplay = document.getElementById('time'); // Убедись, что этот id есть в HTML
const restartBtn = document.getElementById('restart-btn');
const personalBestScore = document.getElementById('personalBest');
const charElements = wordsWrapper.querySelectorAll('.char');
const modePanel = document.getElementById('mode__buttons');
const diffPanel = document.getElementById('difficulty__buttons');
const diffButtons = document.querySelectorAll('.diff-btn');

// Глобальные переменные состояния приложения
let timeLeft = 30;              // Задаем стартовое время (режим 30 секунд)
let timerInterval = null;       // Сюда запишем ID интервала, чтобы управлять им
let totalMistakes = 0;          // Абсолютный счетчик ВСЕХ ошибок (не уменьшается при Backspace)
let isTestActive = true;        // Флаг, блокирующий ввод, когда время вышло
let bestScore = 0;
let timeMode = false;

// Функция загрузки текстов из файла data.json
function loadPassages() {
  fetch('data.json')
    .then(response => response.json()) // Превращаем текстовый ответ в объект JS
    .then(data => {
      passagesData = data; // Сохраняем базу данных в нашу переменную
      resetTest();         // Сразу же запускаем игру с новым текстом!
    })
    .catch(error => console.error("Ошибка загрузки текстов:", error));
}

modePanel.addEventListener('click', (event) => {
  if (event.target.classList.contains('mode-btn')) {
    const clickedBtn = event.target;

    const currentActiveBtn = modePanel.querySelector('.btn-active');
    console.log(currentActiveBtn);
    if (currentActiveBtn) {
      currentActiveBtn.classList.remove('btn-active');
    }
    
    clickedBtn.classList.add('btn-active');
    clickedBtn.querySelectorAll('')
  }
});

diffPanel.addEventListener('click', (event) => {
    const clickedBtn = event.target;

    const currentActiveBtn = diffPanel.querySelector('.btn-active');
    console.log(currentActiveBtn);
    if (currentActiveBtn) {
        currentActiveBtn.classList.remove('btn-active');
    }

    clickedBtn.classList.add('btn-active');
});

diffButtons.forEach(btn => {
    btn.addEventListener('click', (event) => {
        const selectedDifficulty = event.target.getAttribute('data-difficulty');
        if (selectedDifficulty === currentDifficulty) return;
        currentDifficulty = selectedDifficulty;
        resetTest();
    })
});

wordsWrapper.addEventListener('click', () => {
    if (isTestActive) hiddenInput.focus();
});

// Функция отрисовки текста на экране
function renderPassage(text) {
    wordsWrapper.innerHTML = '';
    text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.classList.add('char');

        // Ставим курсор на самый первый символ при инициализации
        if (index === 0) span.classList.add('current');

        wordsWrapper.appendChild(span);
    });
}

let maxWPM = 0;
// Функция работы таймера
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        timeDisplay.textContent = timeLeft + ' sec.'; // Каждую секунду обновляем цифру на экране
        // Считаем WPM в реальном времени, пока идет таймер
        const totalTyped = hiddenInput.value.length;
        const timePassedInMinutes = (30 - timeLeft) / 60;
        if (timePassedInMinutes > 0 && totalTyped > 0) {
            const wpm = (totalTyped / 5) / timePassedInMinutes;
            wpmDisplay.textContent = Math.round(wpm);
            maxWPM = wpm > maxWPM ? wpm : maxWPM;
            personalBestScore.textContent = maxWPM;
        }
        stopTimer();
    }, 1000);
}

function stopTimer() {
    // Если время вышло — останавливаем тест
    if (timeLeft <= 0 || wordsWrapper.childElementCount <= hiddenInput.value.length) {
        clearInterval(timerInterval);
        isTestActive = false;
        hiddenInput.disabled = true; // Блокируем инпут
        alert("Время вышло! Тест завершен.");
    }
}

// Функция выдачи случайного текста на основе выбранной сложности
function getRandomPassage(difficulty) {
  const passagesArray = passagesData[difficulty];
  // Математическая формула для выбора случайного элемента из массива
  const randomIndex = Math.floor(Math.random() * passagesArray.length);
  return passagesArray[randomIndex];
}

// Функция сброса (Рестарт)
function resetTest() {
    const currentText = getRandomPassage(currentDifficulty);
        
    // 1. Очищаем таймер
    clearInterval(timerInterval);
    timerInterval = null;

    // 2. Сбрасываем переменные состояния
    timeLeft = 30;
    totalMistakes = 0;
    isTestActive = true;

    // 3. Сбрасываем инпуты и DOM-элементы
    hiddenInput.value = '';
    hiddenInput.disabled = false;

    timeDisplay.textContent = '30 sec.';
    wpmDisplay.textContent = '0';
    accuracyDisplay.textContent = 'Accuracy: 100%';

    // 4. Перерисовываем текст с нуля
    renderPassage(currentText);

    // 5. Возвращаем фокус
    hiddenInput.focus();
}

// Обработчик фокуса при клике по тексту
wordsWrapper.addEventListener('click', () => {
    if (isTestActive) hiddenInput.focus();
});

// Главный обработчик ввода пользователя
hiddenInput.addEventListener('input', (event) => {
    if (!isTestActive) return;

    // Запуск таймера при первом нажатии клавиши
    if (timerInterval === null && hiddenInput.value.length > 0) {
        startTimer();
    }

    const charElements = wordsWrapper.querySelectorAll('.char');

    const typedTextArray = hiddenInput.value.split('');
    const currentLength = typedTextArray.length;

    // Жесткий учет ошибок: если пользователь только что ввел неправильный символ
    // (проверяем, что это не нажатие Backspace, то есть длина инпута увеличилась)
    if (event.inputType !== 'deleteContentBackward' && currentLength > 0) {
        const lastTypedIndex = currentLength - 1;
        if (typedTextArray[lastTypedIndex] !== charElements[lastTypedIndex].textContent) {
            totalMistakes++; // Ошибка зафиксирована навсегда
        }
    }

    // Обновление стилей символов и курсора
    charElements.forEach((charSpan, index) => {
        const typedChar = typedTextArray[index];

        // Убираем старый курсор
        charSpan.classList.remove('current');

        if (typedChar == null) {
            charSpan.classList.remove('correct', 'incorrect');
            // Ставим кастомный курсор строго перед активной буквой
            if (index === currentLength) {
                charSpan.classList.add('current');
            }
        } else if (typedChar === charSpan.textContent) {
            charSpan.classList.add('correct');
            charSpan.classList.remove('incorrect');
        } else {
            charSpan.classList.add('incorrect');
            charSpan.classList.remove('correct');
        }
    });
    // Расчет точности (Accuracy) с учетом накопленных ошибок
    if (currentLength > 0) {
        // Чтобы точность не уходила в минус, используем Math.max(0, ...)
        const accuracy = (Math.max(0, currentLength - totalMistakes) / currentLength) * 100;
        accuracyDisplay.textContent = 'Accuracy: ' + Math.round(accuracy) + '%';
    } else {
        accuracyDisplay.textContent = 'Accuracy: 100%';
    }
});

// Вешаем событие клика на кнопку Рестарт
restartBtn.addEventListener('click', resetTest);

loadPassages();