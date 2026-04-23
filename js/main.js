/* global Vue, Sortable, window, document, navigator, setInterval, clearInterval */
'use strict';

const { createApp, ref, onMounted, onUnmounted, nextTick } = Vue;

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

            const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            weekday.value = days[now.getDay()];
        };

        let timeInterval;

        const battery = ref(100);
        const updateBattery = async () => {
            if (navigator.getBattery) {
                try {
                    const batt = await navigator.getBattery();
                    battery.value = Math.round(batt.level * 100);
                    batt.addEventListener('levelchange', () => {
                        battery.value = Math.round(batt.level * 100);
                    });
                } catch (error) {
                    void error; // 标记变量已使用，防止规范检查报错
                    battery.value = 98;
                }
            } else {
                battery.value = 98;
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

        // 上滑返回桌面手势
        let homeStartY = 0;
        const homeTouchStart = (e) => {
            homeStartY = e.touches[0].clientY;
        };
        const homeTouchMove = (e) => {
            e.preventDefault();
        };
        const homeTouchEnd = (e) => {
            const endY = e.changedTouches[0].clientY;
            if (homeStartY - endY > 30) {
                closeApp();
            }
        };

        const initSortable = () => {
            const grid = document.getElementById('desktop-grid');
            if (!grid) {
                return;
            }
            
            Sortable.create(grid, {
                animation: 250,
                ghostClass: 'sortable-ghost',
                delay: 200,
                delayOnTouchOnly: true,
                onEnd: (evt) => {
                    const { oldIndex, newIndex } = evt;
                    if (oldIndex === newIndex) {
                        return;
                    }
                    const items = [...store.desktopItems];
                    const [movedItem] = items.splice(oldIndex, 1);
                    items.splice(newIndex, 0, movedItem);
                    store.desktopItems = items;
                }
            });
        };

        onMounted(() => {
            updateTime();
            updateBattery();
            timeInterval = setInterval(updateTime, 1000);
            nextTick(() => {
                initSortable();
            });
        });

        onUnmounted(() => {
            clearInterval(timeInterval);
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

if (window.widgetApp) { app.component('widgetApp', window.widgetApp); }
if (window.themeApp) { app.component('theme', window.themeApp); }
if (window.weiboApp) { app.component('weibo', window.weiboApp); }
if (window.settingsApp) { app.component('settings', window.settingsApp); }
if (window.qqApp) { app.component('qq', window.qqApp); }

app.mount('#app');
