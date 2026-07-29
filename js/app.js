/**
 * ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ
 */

let transactions = [];
let currentTab = 'expense';

/**
 * Инициализация приложения
 */
function initApp() {
    TelegramApp.init();
    
    // Чтение параметров из URL (от бота)
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    // Автоматическое переключение на нужный режим
    if (mode === 'income') {
        switchTab('income');
    } else if (mode === 'expense') {
        switchTab('expense');
    } else if (mode === 'report') {
        // Пока заглушка
        TelegramApp.showAlert('Режим отчета будет доступен скоро!');
    }
    
    updateCategorySelect();
    loadTransactions();
    
    console.log('Приложение инициализировано');
}

/**
 * Переключение вкладок
 */
function switchTab(type) {
    currentTab = type;
    
    document.getElementById('tabExpense').classList.remove('active');
    document.getElementById('tabIncome').classList.remove('active');
    
    if (type === 'expense') {
        document.getElementById('tabExpense').classList.add('active');
        document.getElementById('pageTitle').textContent = ' Мои расходы';
    } else {
        document.getElementById('tabIncome').classList.add('active');
        document.getElementById('pageTitle').textContent = '💵 Мои доходы';
    }
    
    updateCategorySelect();
    renderList();
}

/**
 * Обновление списка категорий
 */
function updateCategorySelect() {
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = '';
    
    CATEGORIES[currentTab].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
    });
    
    updateSubcategorySelect();
}

/**
 * Обновление списка подкатегорий
 */
function updateSubcategorySelect() {
    const subcategorySelect = document.getElementById('subcategory');
    subcategorySelect.innerHTML = '';
    
    const selectedCategory = document.getElementById('category').value;
    const category = CATEGORIES[currentTab].find(c => c.name === selectedCategory);
    
    if (category && category.subs.length > 0) {
        category.subs.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            subcategorySelect.appendChild(option);
        });
        subcategorySelect.style.display = 'block';
    } else {
        subcategorySelect.style.display = 'none';
    }
}

document.getElementById('category').addEventListener('change', updateSubcategorySelect);

/**
 * Загрузка транзакций
 */
async function loadTransactions() {
    try {
        const response = await fetch(CONFIG.API_URL);
        const text = await response.text();
        const result = JSON.parse(text);
        
        if (result.success) {
            transactions = result.data;
            renderList();
        } else {
            console.error('Ошибка загрузки:', result.error);
            TelegramApp.showAlert('Ошибка загрузки данных: ' + result.error);
        }
    } catch (error) {
        console.error('Ошибка соединения:', error);
        TelegramApp.showAlert('Ошибка соединения с сервером');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

/**
 * Добавление транзакции
 */
async function addTransaction() {
    const amountInput = document.getElementById('amount');
    const categoryInput = document.getElementById('category');
    const subcategoryInput = document.getElementById('subcategory');
    const commentInput = document.getElementById('comment');

    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        TelegramApp.showAlert("Введите корректную сумму");
        TelegramApp.haptic('error');
        return;
    }

    const newTransaction = {
        secretKey: CONFIG.SECRET_KEY,
        type: currentTab,
        amount: amount,
        category: categoryInput.value,
        subcategory: subcategoryInput.value || '-',
        comment: commentInput.value || '-'
    };

    transactions.push({
        date: new Date().toLocaleDateString('ru-RU'),
        type: currentTab,
        amount: amount,
        category: categoryInput.value,
        subcategory: subcategoryInput.value || '-',
        comment: commentInput.value || '-'
    });
    renderList();

    amountInput.value = '';
    commentInput.value = '';

    TelegramApp.showProgress(true);
    TelegramApp.haptic('success');

    fetch(CONFIG.API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction)
    }).catch(() => {
        console.log('Отправка в фоне не удалась');
    });

    setTimeout(() => {
        loadTransactions();
        TelegramApp.showProgress(false);
    }, CONFIG.SETTINGS.RELOAD_DELAY);
}

/**
 * Отрисовка списка
 */
function renderList() {
    const list = document.getElementById('transactionList');
    list.innerHTML = '';
    let total = 0;
    
    const filtered = transactions.filter(t => t.type === currentTab);
    
    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state">Нет записей. Добавьте первую транзакцию!</div>';
        document.getElementById('total').innerText = '0';
        return;
    }
    
    filtered.slice().reverse().forEach(t => {
        const amount = parseFloat(t.amount) || 0;
        total += amount;
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
            <div class="item-info">
                <span class="item-amt ${t.type}">${t.type === 'income' ? '+' : '-'}${amount} ₽</span>
                <span class="item-cat">${t.category}${t.subcategory && t.subcategory !== '-' ? ' • ' + t.subcategory : ''}</span>
                ${t.comment && t.comment !== '-' ? `<span class="item-cat">${t.comment}</span>` : ''}
            </div>
        `;
        list.appendChild(div);
    });
    
    document.getElementById('total').innerText = total.toFixed(2);
}

document.getElementById('amount').addEventListener('input', (e) => {
    const amount = parseFloat(e.target.value);
    TelegramApp.toggleMainButton(amount && amount > 0);
});

document.addEventListener('DOMContentLoaded', initApp);
