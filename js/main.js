/* eslint-disable */
/* eslint-env browser, es2021 */
'use strict';

const { createApp, ref, onMounted, onUnmounted, nextTick } = window.Vue;

const app = createApp({
    setup() {
        const store = window.store;
        const isStoreLoaded = window.isStoreLoaded;

        const time = ref('');
        const date = ref('');
        const weekday = ref('');

        const updateTime = () => {
            const now = new Date();
            time.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            date.value = `${now.getMonth() + 1}月${now.getDate()}日`;
            weekday.value = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()];
        };

        const battery = ref(100);
        const temperature = ref('26°C');
        const weatherDesc = ref('晴转多云');

        let timeInterval = null;
        let batteryInterval = null;

        const updateBattery = () => {
            battery.value = battery.value <= 1 ? 100 : battery.value - 1;
        };

        const appRect = ref(null);

        const openApp = (id, event) => {
            if (event && event.currentTarget) {
                const rect = event.currentTarget.getBoundingClientRect();
                appRect.value = {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                };
            } else {
                appRect.value = null;
            }
            store.currentApp = id;
        };

        const closeApp = () => {
            store.currentApp = null;
        };

        let homeStartY = 0;
        const homeTouchStart = (e) => {
            if (e.touches && e.touches.length) homeStartY = e.touches[0].clientY;
        };
        const homeTouchMove = (e) => {
            e.preventDefault();
        };
        const homeTouchEnd = (e) => {
            if (!e.changedTouches || !e.changedTouches.length) return;
            const endY = e.changedTouches[0].clientY;
            if (homeStartY - endY > 30) closeApp();
        };

        const getScaleFromRect = () => {
            if (!appRect.value) return { sx: 1, sy: 1 };
            return {
                sx: appRect.value.width / window.innerWidth,
                sy: appRect.value.height / window.innerHeight
            };
        };

        const beforeEnter = (el) => {
            const rect = appRect.value;
            if (rect) {
                const { sx, sy } = getScaleFromRect();
                el.style.transformOrigin = 'top left';
                el.style.transform = `translate(${rect.left}px, ${rect.top}px) scale(${sx}, ${sy})`;
                el.style.borderRadius = '32px';
                el.style.opacity = '0';
            } else {
                el.style.transform = 'scale(0.98)';
                el.style.opacity = '0';
            }
        };

        const enter = (el, done) => {
            el.offsetHeight;
            el.style.transition = 'transform .42s cubic-bezier(.22,1,.36,1), opacity .25s ease, border-radius .42s cubic-bezier(.22,1,.36,1)';
            el.style.transform = 'translate(0,0) scale(1,1)';
            el.style.borderRadius = '0';
            el.style.opacity = '1';
            const onEnd = (ev) => {
                if (ev.target === el) {
                    el.removeEventListener('transitionend', onEnd);
                    done();
                }
            };
            el.addEventListener('transitionend', onEnd);
        };

        const leave = (el, done) => {
            const rect = appRect.value;
            el.style.transition = 'transform .42s cubic-bezier(.22,1,.36,1), opacity .25s ease, border-radius .42s cubic-bezier(.22,1,.36,1)';
            if (rect) {
                const { sx, sy } = getScaleFromRect();
                el.style.transformOrigin = 'top left';
                el.style.transform = `translate(${rect.left}px, ${rect.top}px) scale(${sx}, ${sy})`;
                el.style.borderRadius = '32px';
            } else {
                el.style.transform = 'scale(0.98)';
            }
            el.style.opacity = '0';
            const onEnd = (ev) => {
                if (ev.target === el) {
                    el.removeEventListener('transitionend', onEnd);
                    done();
                }
            };
            el.addEventListener('transitionend', onEnd);
        };

        const initSortable = () => {
            const grid = document.getElementById('desktop-grid');
            if (!grid || !window.Sortable) return;

            if (grid._sortableInstance) {
                try { grid._sortableInstance.destroy(); } catch (e) {}
            }

            grid._sortableInstance = window.Sortable.create(grid, {
                animation: 220,
                ghostClass: 'sortable-ghost',
                delay: 180,
                delayOnTouchOnly: true,
                onEnd: (evt) => {
                    const oldIdx = evt.oldIndex;
                    const newIdx = evt.newIndex;
                    if (oldIdx === newIdx) return;
                    const items = [...store.desktopItems];
                    const [moved] = items.splice(oldIdx, 1);
                    items.splice(newIdx, 0, moved);
                    store.desktopItems = items;
                }
            });
        };

        onMounted(() => {
            updateTime();
            timeInterval = setInterval(updateTime, 1000);
            batteryInterval = setInterval(updateBattery, 60000);

            nextTick(() => {
                const timer = setInterval(() => {
                    if (document.getElementById('desktop-grid')) {
                        initSortable();
                        clearInterval(timer);
                    }
                }, 100);
            });
        });

        onUnmounted(() => {
            if (timeInterval) clearInterval(timeInterval);
            if (batteryInterval) clearInterval(batteryInterval);
        });

        return {
            store,
            isStoreLoaded,
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
            beforeEnter,
            enter,
            leave
        };
    }
});

if (window.widgetApp) app.component('widgetApp', window.widgetApp);
if (window.themeApp) app.component('theme', window.themeApp);
if (window.weiboApp) app.component('weibo', window.weiboApp);
if (window.settingsApp) app.component('settings', window.settingsApp);
if (window.qqApp) app.component('qq', window.qqApp);

app.mount('#app');
