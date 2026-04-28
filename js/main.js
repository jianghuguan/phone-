/* eslint-disable */
/* eslint-env browser, es2021 */
'use strict';

const { createApp, ref, onMounted, onUnmounted, nextTick, computed } = window.Vue;

const app = createApp({
    setup() {
        const store = window.store;

        const time = ref('');
        const date = ref('');
        const weekday = ref('');

        const desktopAppActive = ref(false);
        const isAppAnimating = ref(false);
        const launchRect = ref(null);

        const updateTime = function () {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            time.value = hours + ':' + minutes;

            const month = now.getMonth() + 1;
            const day = now.getDate();
            date.value = month + '月' + day + '日';

            const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            weekday.value = days[now.getDay()];
        };

        let timeInterval = null;
        let batteryInterval = null;

        const battery = ref(100);
        const updateBattery = function () {
            if (battery.value > 1) {
                battery.value -= 1;
            }
        };

        const temperature = ref('26°C');
        const weatherDesc = ref('晴转多云');

        const appVisible = computed(function () {
            return !!store.currentApp;
        });

        const getLauncherRectById = function (id) {
            const el = window.document.querySelector('.app-launcher[data-app-id="' + id + '"]');
            if (!el) {
                return null;
            }
            return el.getBoundingClientRect();
        };

        const buildTransformFromRect = function (rect) {
            if (!rect) {
                return 'translate3d(0, 40px, 0) scale(0.92)';
            }

            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const rectCx = rect.left + rect.width / 2;
            const rectCy = rect.top + rect.height / 2;
            const viewCx = vw / 2;
            const viewCy = vh / 2;

            const dx = rectCx - viewCx;
            const dy = rectCy - viewCy;
            const sx = Math.max(rect.width / vw, 0.08);
            const sy = Math.max(rect.height / vh, 0.08);

            return 'translate3d(' + dx + 'px, ' + dy + 'px, 0) scale(' + sx + ', ' + sy + ')';
        };

        const animateElement = function (el, keyframes, options) {
            return new Promise(function (resolve) {
                if (!el || !el.animate) {
                    resolve();
                    return;
                }

                const anim = el.animate(keyframes, options);

                anim.onfinish = function () {
                    resolve();
                };

                anim.oncancel = function () {
                    resolve();
                };
            });
        };

        const playOpenAnimation = async function () {
            const appEl = window.document.getElementById('app-view-panel');
            if (!appEl) {
                return;
            }

            const fromTransform = buildTransformFromRect(launchRect.value);

            appEl.style.transformOrigin = 'center center';
            appEl.style.borderRadius = '24px';
            appEl.style.opacity = '0';

            await animateElement(
                appEl,
                [
                    {
                        transform: fromTransform,
                        opacity: 0.25,
                        borderRadius: '24px'
                    },
                    {
                        transform: 'translate3d(0, 0, 0) scale(1, 1)',
                        opacity: 1,
                        borderRadius: '0px'
                    }
                ],
                {
                    duration: 380,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    fill: 'forwards'
                }
            );

            appEl.style.transform = '';
            appEl.style.opacity = '';
            appEl.style.borderRadius = '';
        };

        const playCloseAnimation = async function (id) {
            const appEl = window.document.getElementById('app-view-panel');
            if (!appEl) {
                return;
            }

            const rect = getLauncherRectById(id) || launchRect.value;
            const toTransform = buildTransformFromRect(rect);

            appEl.style.transformOrigin = 'center center';

            await animateElement(
                appEl,
                [
                    {
                        transform: 'translate3d(0, 0, 0) scale(1, 1)',
                        opacity: 1,
                        borderRadius: '0px'
                    },
                    {
                        transform: toTransform,
                        opacity: 0.15,
                        borderRadius: '24px'
                    }
                ],
                {
                    duration: 340,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    fill: 'forwards'
                }
            );
        };

        const openApp = async function (id, evt) {
            if (isAppAnimating.value || store.currentApp) {
                return;
            }

            const launcher = evt && evt.currentTarget
                ? evt.currentTarget
                : window.document.querySelector('.app-launcher[data-app-id="' + id + '"]');

            launchRect.value = launcher ? launcher.getBoundingClientRect() : null;

            desktopAppActive.value = true;
            store.currentApp = id;
            isAppAnimating.value = true;

            await nextTick();
            await playOpenAnimation();

            isAppAnimating.value = false;
        };

        const closeApp = async function () {
            if (!store.currentApp || isAppAnimating.value) {
                return;
            }

            const closingId = store.currentApp;
            desktopAppActive.value = false;
            isAppAnimating.value = true;

            await playCloseAnimation(closingId);

            store.currentApp = null;
            isAppAnimating.value = false;
        };

        let homeStartY = 0;

        const homeTouchStart = function (e) {
            if (e.touches && e.touches.length > 0) {
                homeStartY = e.touches[0].clientY;
            }
        };

        const homeTouchMove = function (e) {
            e.preventDefault();
        };

        const homeTouchEnd = function (e) {
            if (e.changedTouches && e.changedTouches.length > 0) {
                const endY = e.changedTouches[0].clientY;
                if (homeStartY - endY > 30) {
                    closeApp();
                }
            }
        };

        const initSortable = function () {
            const grid = window.document.getElementById('desktop-grid');
            if (!grid || !window.Sortable) {
                return;
            }

            window.Sortable.create(grid, {
                animation: 250,
                ghostClass: 'sortable-ghost',
                delay: 200,
                delayOnTouchOnly: true,
                onEnd: function (evt) {
                    const oldIdx = evt.oldIndex;
                    const newIdx = evt.newIndex;

                    if (oldIdx === newIdx) {
                        return;
                    }

                    const items = store.desktopItems.slice();
                    const movedItem = items.splice(oldIdx, 1)[0];
                    items.splice(newIdx, 0, movedItem);
                    store.desktopItems = items;
                }
            });
        };

        onMounted(function () {
            updateTime();
            timeInterval = window.setInterval(updateTime, 1000);

            battery.value = 100;
            batteryInterval = window.setInterval(updateBattery, 60000);

            nextTick(function () {
                initSortable();
            });
        });

        onUnmounted(function () {
            if (timeInterval) {
                window.clearInterval(timeInterval);
            }
            if (batteryInterval) {
                window.clearInterval(batteryInterval);
            }
        });

        return {
            store: store,
            time: time,
            date: date,
            weekday: weekday,
            battery: battery,
            temperature: temperature,
            weatherDesc: weatherDesc,
            openApp: openApp,
            closeApp: closeApp,
            homeTouchStart: homeTouchStart,
            homeTouchMove: homeTouchMove,
            homeTouchEnd: homeTouchEnd,
            desktopAppActive: desktopAppActive,
            appVisible: appVisible
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

Promise.resolve(window.storeReady).finally(function () {
    app.mount('#app');
});
