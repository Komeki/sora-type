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
const modeButtons = document.querySelectorAll('.mode-btn');
const diffPanel = document.getElementById('difficulty__buttons');
const diffButtons = document.querySelectorAll('.diff-btn');

// Глобальные переменные состояния приложения
let timeElapsed = 0;
let timerInterval = null;       // Сюда запишем ID интервала, чтобы управлять им
let totalMistakes = 0;          // Абсолютный счетчик ВСЕХ ошибок (не уменьшается при Backspace)
let isTestActive = true;        // Флаг, блокирующий ввод, когда время вышло
let bestScore = 0;
let currentMode = 'timed';

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
        clickedBtn.querySelectorAll('mode-btn');
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

// Обработчик переключения режимов (Passage / Timed)
modeButtons.forEach(btn => {
    btn.addEventListener('click', (event) => {
        const selectedMode = event.target.getAttribute('data-mode');

        if (selectedMode === currentMode) return;

        currentMode = selectedMode;

        modeButtons.forEach(mBtn => mBtn.classList.remove('active'));
        event.target.classList.add('active');

        resetTest();
    });
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

// Сразу выводим рекорд на экран при загрузке страницы
personalBestScore.textContent = bestScore;
// Функция завершения теста (чтобы не писать этот код дважды)
function finishTest() {
  clearInterval(timerInterval);
  isTestActive = false;
  hiddenInput.disabled = true;

  // Берем финальный результат с экрана
  const currentWPM = parseInt(wpmDisplay.textContent) || 0;

  // ЛОГИКА РЕКОРДОВ:
  if (bestScore === 0 && currentWPM > 0) {
    // Сценарий 1: Самый первый тест в жизни пользователя
    bestScore = currentWPM;
    localStorage.setItem('typingBestScore', bestScore); // Сохраняем в память
    personalBestScore.textContent = bestScore;
    
    alert(`Baseline Established! Твой первый результат: ${currentWPM} WPM. Теперь попробуй его побить!`);
  
  } else if (currentWPM > bestScore) {
    // Сценарий 2: Старый рекорд побит!
    bestScore = currentWPM;
    localStorage.setItem('typingBestScore', bestScore); // Перезаписываем память
    personalBestScore.textContent = bestScore;
    
    // Вызываем конфетти (опишу ниже, как его подключить)
    triggerConfetti(); 
    
    alert(`High Score Smashed! Новый абсолютный рекорд: ${currentWPM} WPM! 🔥`);
  
  } else {
    // Сценарий 3: Рекорд не побит
    alert(`Тест завершен! Твой результат: ${currentWPM} WPM. (Лучший: ${bestScore} WPM)`);
  }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeElapsed++; // Увеличиваем счетчик каждую секунду

        // 1. Отрисовка времени на экране
        if (currentMode === 'timed') {
            timeDisplay.textContent = 15 - timeElapsed + ' sec.'; // Показываем остаток
        } else {
            timeDisplay.textContent = timeElapsed + ' sec.'; // Показываем прошедшие секунды
        }

        // 2. Расчет WPM (универсальный для обоих режимов)
        const totalTyped = hiddenInput.value.length;
        const timePassedInMinutes = timeElapsed / 60;

        if (timePassedInMinutes > 0 && totalTyped > 0) {
            const wpm = (totalTyped / 5) / timePassedInMinutes;
            wpmDisplay.textContent = Math.round(wpm);
        }

        // 3. Проверка на завершение времени (только для режима timed)
        if (currentMode === 'timed' && timeElapsed >= 15) {
            finishTest();
        } else if (totalTyped >= currentText.length) {
            finishTest()
        }

    }, 1000);
}

// Функция выдачи случайного текста на основе выбранной сложности
function getRandomPassage(difficulty) {
    // 1. Берем оригинальный массив фраз
    const passagesArray = passagesData[difficulty];

    // 2. Создаем копию массива и перемешиваем ее
    const shuffledArray = [...passagesArray].sort(() => Math.random() - 0.5);

    // 3. Склеиваем все фразы в одну строку через пробел
    return shuffledArray.join(' ');
}

function resetTest() {
    clearInterval(timerInterval);
    timerInterval = null;
    timeElapsed = 0; // Сбрасываем прошедшее время в ноль
    totalMistakes = 0;
    isTestActive = true;

    hiddenInput.value = '';
    hiddenInput.disabled = false;

    // Если режим timed - пишем 30. Если passage - пишем 0
    timeDisplay.textContent = currentMode === 'timed' ? '15 sec.' : '0 sec.';
    wpmDisplay.textContent = '0';
    accuracyDisplay.textContent = 'Accuracy: 100%';

    currentText = getRandomPassage(currentDifficulty);
    renderPassage(currentText);
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

    // Если введенный текст ПОЛНОСТЬЮ совпадает с текстом задания
    if (hiddenInput.value === currentText) {
        finishTest(); // Останавливаем таймер и тест
    }
});

// Вешаем событие клика на кнопку Рестарт
restartBtn.addEventListener('click', resetTest);

loadPassages();