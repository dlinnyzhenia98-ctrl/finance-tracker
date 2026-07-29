/**
 * TELEGRAM WEB APP ФУНКЦИИ
 */

const TelegramApp = {
    tg: null,
    isTelegram: false,
    
    init() {
        if (window.Telegram && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp;
            this.isTelegram = true;
            this.tg.expand();
            this.tg.ready();
            
            this.tg.MainButton.setText("ДОБАВИТЬ");
            this.tg.MainButton.onClick(() => window.addTransaction());
            
            console.log('Telegram WebApp инициализирован');
        } else {
            this.tg = {
                showAlert: (msg) => alert(msg),
                MainButton: {
                    setText: () => {},
                    onClick: () => {},
                    show: () => {},
                    hide: () => {},
                    enable: () => {},
                    showProgress: () => {},
                    hideProgress: () => {}
                },
                HapticFeedback: {
                    notificationOccurred: () => {}
                }
            };
            console.log('Запущено в браузере (не Telegram)');
        }
    },
    
    showAlert(message) {
        if (this.isTelegram) {
            this.tg.showAlert(message);
        } else {
            alert(message);
        }
    },
    
    haptic(type = 'success') {
        if (this.isTelegram && this.tg.HapticFeedback) {
            this.tg.HapticFeedback.notificationOccurred(type);
        }
    },
    
    toggleMainButton(show) {
        if (this.isTelegram) {
            if (show) {
                this.tg.MainButton.show();
                this.tg.MainButton.enable();
            } else {
                this.tg.MainButton.hide();
            }
        }
    },
    
    showProgress(show) {
        if (this.isTelegram) {
            if (show) {
                this.tg.MainButton.showProgress(true);
            } else {
                this.tg.MainButton.hideProgress();
            }
        }
    }
};
