'use strict';

const { createApp, ref, onMounted, onUnmounted, nextTick } = window.Vue;
const Sortable = window.Sortable;
const store = window.store;

const app = createApp({
    setup() {
        const time = ref('');
        const date = ref('');
        const weekday = ref('');

        const updateTime = () => {
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes();
            time.value = (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);

            const month = now.getMonth() + 1;
            const day = now.getDate();
            date.value = month + '月' + day + '日';

            const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            weekday.value = days[now.getDay()];
        };

        let timeInterval = null;
        let batteryInterval = null;

        const battery = ref(100);
        const updateBattery = () => {
            if (battery.value > 1) {
                battery.value -= 1;
            }
        };

        const temperature = ref('26°C');
        const weatherDesc = ref('晴转多云');

        const openApp = (id, e) => {
            if (e && e.currentTarget) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = rect.left + (rect.width / 2);
                const y = rect.top + (rect.height / 2);
                document.documentElement.style.setProperty('--app-origin-x', x + 'px');
                document.documentElement.style.setProperty('--app-origin-y', y + 'px');
            } else {
                document.documentElement.style.setProperty('--app-origin-x', '50%');
                document.documentElement.style.setProperty('--app-origin-y', '50%');
            }
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
            const grid = document.getElementById('desktop-grid');
            if (!grid || !Sortable) return;

            Sortable.create(grid, {
                animation: 250,
                ghostClass: 'sortable-ghost',
                delay: 300,
                delayOnTouchOnly: true,
                swap: true,
                swapClass: 'sortable-swap-highlight',
                scroll: true,             
                scrollSensitivity: 80,    
                scrollSpeed: 15,          
                onEnd: (evt) => {
                    const oldIdx = evt.oldIndex;
                    const newIdx = evt.newIndex;
                    if (oldIdx === newIdx) return;

                    const items = [...store.desktopItems];
                    const temp = items[oldIdx];
                    items[oldIdx] = items[newIdx];
                    items[newIdx] = temp;

                    store.desktopItems = items;
                }
            });
        };

        const getItemClass = (item) => {
            if (item.type === 'app') return 'app-icon';
            if (item.widgetType === 'dialog_2x2') return 'transparent-widget';
            return 'widget-box';
        };

        const getWidgetStyle = (item) => {
            if (item.type !== 'widget' || !item.span) return {};
            const parts = String(item.span).split('/');
            if (parts.length < 2) return {};
            return {
                gridColumn: 'span ' + parts[0].trim(),
                gridRow: 'span ' + parts[1].trim()
            };
        };

        const handleItemClick = (item, e) => {
            if (item.type === 'app') {
                openApp(item.id, e);
            }
        };

        onMounted(() => {
            updateTime();
            timeInterval = setInterval(updateTime, 1000);

            battery.value = 100;
            batteryInterval = setInterval(updateBattery, 60000);

            nextTick(() => {
                initSortable();
            });
        });

        onUnmounted(() => {
            if (timeInterval) clearInterval(timeInterval);
            if (batteryInterval) clearInterval(batteryInterval);
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
            homeTouchEnd,
            getItemClass,
            getWidgetStyle,
            handleItemClick
        };
    }
});

if (window.widgetApp) app.component('widgetApp', window.widgetApp);
if (window.themeApp) app.component('theme', window.themeApp);
if (window.settingsApp) app.component('settings', window.settingsApp);
if (window.qqApp) app.component('qq', window.qqApp);

app.mount('#app');
