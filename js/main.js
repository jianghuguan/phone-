/* eslint-disable */
/* jshint esversion: 8 */
/* global window, document, navigator */
'use strict';

const { createApp, ref, onMounted, onUnmounted, nextTick } = window.Vue;

const app = createApp({
    setup: function () {
        const store = window.store;

        const time = ref('');
        const date = ref('');
        const weekday = ref('');

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
            if (battery.value > 1) battery.value -= 1;
        };
        const temperature = ref('26°C');
        const weatherDesc = ref('晴转多云');

        const openApp = function (id, e) { 
            if (e && e.currentTarget) {
                const rect = e.currentTarget.getBoundingClientRect();
                window.document.documentElement.style.setProperty('--app-origin-x', (rect.left + rect.width / 2) + 'px');
                window.document.documentElement.style.setProperty('--app-origin-y', (rect.top + rect.height / 2) + 'px');
            }
            store.currentApp = id; 
        };
        const closeApp = function () { store.currentApp = null; };

        let homeStartY = 0;
        const homeTouchStart = function (e) { if (e.touches && e.touches.length > 0) homeStartY = e.touches[0].clientY; };
        const homeTouchMove = function (e) { e.preventDefault(); };
        const homeTouchEnd = function (e) {
            if (e.changedTouches && e.changedTouches.length > 0 && homeStartY - e.changedTouches[0].clientY > 30) closeApp();
        };

        // --- 全新自由网格拖拽系统 ---
        const dragState = ref(null);
        const ghostX = ref(0);
        const ghostY = ref(0);
        let holdTimer = null;
        let cloneEl = null;

        const onItemTouchStart = function (item, e) {
            if (dragState.value) return;
            const touch = e.touches[0];
            const target = e.currentTarget;
            
            holdTimer = setTimeout(function () {
                if (navigator.vibrate) navigator.vibrate(50);
                const rect = target.getBoundingClientRect();
                
                cloneEl = target.cloneNode(true);
                cloneEl.classList.add('drag-clone');
                cloneEl.style.width = rect.width + 'px';
                cloneEl.style.height = rect.height + 'px';
                cloneEl.style.left = rect.left + 'px';
                cloneEl.style.top = rect.top + 'px';
                document.body.appendChild(cloneEl);

                dragState.value = {
                    item: item,
                    offsetX: touch.clientX - rect.left,
                    offsetY: touch.clientY - rect.top
                };
                ghostX.value = item.x;
                ghostY.value = item.y;
            }, 400); 
        };

        const onItemTouchEnd = function () { 
            if (holdTimer) clearTimeout(holdTimer); 
        };

        const checkCollisionsAndPush = function (droppedItem, newX, newY) {
            const testRect = { x: newX, y: newY, w: droppedItem.w, h: droppedItem.h };
            const collided = [];
            store.desktopItems.forEach(function (i) {
                if (i.id === droppedItem.id) return;
                if (!(testRect.x + testRect.w <= i.x || i.x + i.w <= testRect.x || testRect.y + testRect.h <= i.y || i.y + i.h <= testRect.y)) {
                    collided.push(i);
                }
            });

            const findEmptySpot = function (w, h, ignoreIds, startY) {
                let r = startY;
                while (r < 100) {
                    for (let c = 0; c <= 4 - w; c++) {
                        const tr = { x: c, y: r, w: w, h: h };
                        let hit = false;
                        for (let k = 0; k < store.desktopItems.length; k++) {
                            let item = store.desktopItems[k];
                            if (ignoreIds.includes(item.id)) continue;
                            if (!(tr.x + tr.w <= item.x || item.x + item.w <= tr.x || tr.y + tr.h <= item.y || item.y + item.h <= tr.y)) {
                                hit = true; 
                                break;
                            }
                        }
                        if (!hit) return { x: c, y: r };
                    }
                    r++;
                }
                return { x: 0, y: startY + 2 };
            };

            collided.forEach(function (cItem) {
                const spot = findEmptySpot(cItem.w, cItem.h, [droppedItem.id, cItem.id], Math.max(0, newY - 1));
                cItem.x = spot.x;
                cItem.y = spot.y;
            });
        };

        const handleGlobalTouchMove = function (e) {
            if (holdTimer) clearTimeout(holdTimer);
            if (!dragState.value) return;
            e.preventDefault(); 
            
            const touch = e.touches[0];
            if (cloneEl) {
                cloneEl.style.left = (touch.clientX - dragState.value.offsetX) + 'px';
                cloneEl.style.top = (touch.clientY - dragState.value.offsetY) + 'px';
            }

            const desktopEl = document.getElementById('desktop-grid');
            const gridRect = desktopEl.getBoundingClientRect();
            
            if (touch.clientY > window.innerHeight - 80) desktopEl.scrollTop += 15;
            if (touch.clientY < 100) desktopEl.scrollTop -= 15;

            const cellW = (gridRect.width - 40 - 45) / 4;
            const x = touch.clientX - gridRect.left - 20;
            const y = touch.clientY - gridRect.top - 20 + desktopEl.scrollTop;

            let tX = Math.round(x / (cellW + 15));
            let tY = Math.round(y / (cellW + 15));

            tX = Math.max(0, Math.min(tX, 4 - dragState.value.item.w));
            tY = Math.max(0, tY);

            ghostX.value = tX;
            ghostY.value = tY;
        };

        const handleGlobalTouchEnd = function () {
            if (holdTimer) clearTimeout(holdTimer);
            if (!dragState.value) return;

            const item = dragState.value.item;
            checkCollisionsAndPush(item, ghostX.value, ghostY.value);
            item.x = ghostX.value;
            item.y = ghostY.value;

            if (cloneEl) {
                cloneEl.remove();
                cloneEl = null;
            }
            dragState.value = null;
        };

        onMounted(function () {
            updateTime();
            timeInterval = window.setInterval(updateTime, 1000);
            batteryInterval = window.setInterval(updateBattery, 60000);

            window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
            window.addEventListener('touchend', handleGlobalTouchEnd);
            window.addEventListener('touchcancel', handleGlobalTouchEnd);
        });

        onUnmounted(function () {
            if (timeInterval) window.clearInterval(timeInterval);
            if (batteryInterval) window.clearInterval(batteryInterval);
            window.removeEventListener('touchmove', handleGlobalTouchMove);
            window.removeEventListener('touchend', handleGlobalTouchEnd);
            window.removeEventListener('touchcancel', handleGlobalTouchEnd);
        });

        return {
            store: store, time: time, date: date, weekday: weekday, battery: battery, temperature: temperature, weatherDesc: weatherDesc,
            openApp: openApp, closeApp: closeApp, homeTouchStart: homeTouchStart, homeTouchMove: homeTouchMove, homeTouchEnd: homeTouchEnd,
            dragState: dragState, ghostX: ghostX, ghostY: ghostY, onItemTouchStart: onItemTouchStart, onItemTouchEnd: onItemTouchEnd
        };
    }
});

if (window.widgetApp) app.component('widgetApp', window.widgetApp);
if (window.themeApp) app.component('theme', window.themeApp);
if (window.settingsApp) app.component('settings', window.settingsApp);
if (window.qqApp) app.component('qq', window.qqApp);

app.mount('#app');
