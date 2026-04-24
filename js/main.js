/* eslint-disable */
/* eslint-env browser, es2021 */
'use strict';

const { createApp, ref, onMounted, onUnmounted, nextTick } = window.Vue;

const app = createApp({
    setup() {
        const store = window.store;

        const time = ref('');
        const date = ref('');
        const weekday = ref('');

        const updateTime = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            time.value = `${hours}:${minutes}`;

            const month = now.getMonth() + 1;
            const day = now.getDate();
            date.value = `${month}月${day}日`;

            const days = [
                '星期日', '星期一', '星期二', '星期三',
                '星期四', '星期五', '星期六'
            ];
            weekday.value = days[now.getDay()];
        };

        let timeInterval = null;
        let batteryInterval = null;

        // 电量逻辑：每次打开为100，每分钟掉1点
        const battery = ref(100);
        const updateBattery = () => {
            if (battery.value > 1) {
                battery.value -= 1;
            }
        };

        const temperature = ref('26°C');
        const weatherDesc = ref('晴转多云');

        const openApp = (id) => {
            store.currentApp = id;
        };

        const closeApp = () => {
            store.currentApp = null;
        };

        let homeStartY = 0;

        const homeTouchStart = (e) => {
            if (e.touches && e.touches.length > 0) {
                homeStartY = e.touches[0].clientY;
            }
        };

        const homeTouchMove = (e) => {
            e.preventDefault();
        };

        const homeTouchEnd = (e) => {
            if (e.changedTouches && e.changedTouches.length > 0) {
                const endY = e.changedTouches[0].clientY;
                if (homeStartY - endY > 30) {
                    closeApp();
                }
            }
        };

        const initSortable = () => {
            const grid = window.document.getElementById('desktop-grid');
            if (!grid) {
                return;
            }

            window.Sortable.create(grid, {
                animation: 250,
                ghostClass: 'sortable-ghost',
                delay: 200,
                delayOnTouchOnly: true,
                onEnd: (evt) => {
                    const oldIdx = evt.oldIndex;
                    const newIdx = evt.newIndex;
                    if (oldIdx === newIdx) {
                        return;
                    }
                    const items = [...store.desktopItems];
                    const [movedItem] = items.splice(oldIdx, 1);
                    items.splice(newIdx, 0, movedItem);
                    store.desktopItems = items;
                }
            });
        };

        onMounted(() => {
            updateTime();
            timeInterval = window.setInterval(updateTime, 1000);
            
            // 每 60,000 毫秒(1分钟)触发一次掉电
            batteryInterval = window.setInterval(updateBattery, 60000);
            
            nextTick(() => {
                initSortable();
            });
        });

        onUnmounted(() => {
            if (timeInterval) {
                window.clearInterval(timeInterval);
            }
            if (batteryInterval) {
                window.clearInterval(batteryInterval);
            }
        });

        return {
            store,
            time,
            date,
            weekday,
            battery,
            temperature,
            weatherDesc,
            openApp,
            closeApp,
            homeTouchStart,
            homeTouchMove,
            homeTouchEnd
        };
    }
});

if (window.widgetApp) {
    app.component('widgetApp', window.widgetApp);
}
if (window.themeApp) {
    app.component('theme', window.themeApp);
}
if (window.weiboApp) {
    app.component('weibo', window.weiboApp);
}
if (window.settingsApp) {
    app.component('settings', window.settingsApp);
}
if (window.qqApp) {
    app.component('qq', window.qqApp);
}

app.mount('#app');
