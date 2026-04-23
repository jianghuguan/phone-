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

        // 每次打开为100满电，随着时间每分钟固定减少1电量
        const battery = ref(100);
        let timeInterval = null;
        let secCount = 0;

        const openApp = (id) => { store.currentApp = id; };
        const closeApp = () => { store.currentApp = null; };

        let homeStartY = 0;
        const homeTouchStart = (e) => {
            if (e.touches && e.touches.length > 0) homeStartY = e.touches[0].clientY;
        };
        const homeTouchMove = (e) => { e.preventDefault(); };
        const homeTouchEnd = (e) => {
            if (e.changedTouches && e.changedTouches.length > 0) {
                const endY = e.changedTouches[0].clientY;
                if (homeStartY - endY > 30) closeApp();
            }
        };

        const initSortable = () => {
            const grid = window.document.getElementById('desktop-grid');
            if (!grid) return;

            window.Sortable.create(grid, {
                animation: 250,
                ghostClass: 'sortable-ghost',
                delay: 200,
                delayOnTouchOnly: true,
                onEnd: (evt) => {
                    const oldIdx = evt.oldIndex;
                    const newIdx = evt.newIndex;
                    if (oldIdx === newIdx) return;
                    const items = [...store.desktopItems];
                    const [movedItem] = items.splice(oldIdx, 1);
                    items.splice(newIdx, 0, movedItem);
                    store.desktopItems = items;
                }
            });
        };

        onMounted(() => {
            updateTime();
            // 核心计时器：每秒更新时间，累积 60 秒后掉 1 点电量
            timeInterval = window.setInterval(() => {
                updateTime();
                secCount++;
                if (secCount >= 60) {
                    secCount = 0;
                    if (battery.value > 1) {
                        battery.value -= 1;
                    }
                }
            }, 1000);

            nextTick(() => { initSortable(); });
        });

        onUnmounted(() => {
            if (timeInterval) window.clearInterval(timeInterval);
        });

        return {
            store, time, date, weekday,
            battery, temperature: ref('26°C'), weatherDesc: ref('晴转多云'),
            openApp, closeApp, homeTouchStart, homeTouchMove, homeTouchEnd
        };
    }
});

if (window.widgetApp) app.component('widgetApp', window.widgetApp);
if (window.themeApp) app.component('theme', window.themeApp);
if (window.weiboApp) app.component('weibo', window.weiboApp);
if (window.settingsApp) app.component('settings', window.settingsApp);
if (window.qqApp) app.component('qq', window.qqApp);

app.mount('#app');
