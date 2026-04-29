// @ts-nocheck
/* eslint-disable */
/* jshint esversion: 11 */
/* global window */
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
            if (battery.value > 1) {
                battery.value -= 1;
            }
        };

        const temperature = ref('26°C');
        const weatherDesc = ref('晴转多云');

        const openApp = function (id, e) { 
            if (e && e.currentTarget) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                window.document.documentElement.style.setProperty('--app-origin-x', x + 'px');
                window.document.documentElement.style.setProperty('--app-origin-y', y + 'px');
            } else {
                window.document.documentElement.style.setProperty('--app-origin-x', '50%');
                window.document.documentElement.style.setProperty('--app-origin-y', '50%');
            }
            store.currentApp = id; 
        };
        
        const closeApp = function () { 
            store.currentApp = null; 
        };

        let homeStartY = 0;
        const homeTouchStart = function (e) {
            if (e.touches && e.touches.length > 0) homeStartY = e.touches[0].clientY;
        };
        const homeTouchMove = function (e) { 
            e.preventDefault(); 
        };
        const homeTouchEnd = function (e) {
            if (e.changedTouches && e.changedTouches.length > 0) {
                const endY = e.changedTouches[0].clientY;
                if (homeStartY - endY > 30) closeApp();
            }
        };

        const initSortable = function () {
            const grid = window.document.getElementById('desktop-grid');
            if (!grid) return;

            window.Sortable.create(grid, {
                animation: 250,
                ghostClass: 'sortable-ghost',
                delay: 300,             
                delayOnTouchOnly: true,
                swap: true,             
                swapClass: 'sortable-swap-highlight', 
                onEnd: function (evt) {
                    const oldIdx = evt.oldIndex;
                    const newIdx = evt.newIndex;
                    if (oldIdx === newIdx) return;
                    
                    const items = store.desktopItems.slice();
                    const temp = items[oldIdx];
                    items[oldIdx] = items[newIdx];
                    items[newIdx] = temp;
                    
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
            if (timeInterval) window.clearInterval(timeInterval);
            if (batteryInterval) window.clearInterval(batteryInterval);
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
            homeTouchEnd: homeTouchEnd
        };
    }
});

if (window.widgetApp) app.component('widgetApp', window.widgetApp);
if (window.themeApp) app.component('theme', window.themeApp);
if (window.settingsApp) app.component('settings', window.settingsApp);
if (window.qqApp) app.component('qq', window.qqApp);

app.mount('#app');
