/* eslint-disable */
/* jshint ignore:start */
'use strict';

var Vue = window.Vue;
var createApp = Vue.createApp;
var ref = Vue.ref;
var onMounted = Vue.onMounted;
var onUnmounted = Vue.onUnmounted;
var nextTick = Vue.nextTick;

var app = createApp({
    setup: function () {
        var store = window.store;

        var time = ref('');
        var date = ref('');
        var weekday = ref('');

        var updateTime = function () {
            var now = new Date();
            var hours = String(now.getHours()).padStart(2, '0');
            var minutes = String(now.getMinutes()).padStart(2, '0');
            time.value = hours + ':' + minutes;

            var month = now.getMonth() + 1;
            var day = now.getDate();
            date.value = month + '月' + day + '日';

            var days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            weekday.value = days[now.getDay()];
        };

        var timeInterval = null;
        var batteryInterval = null;

        var battery = ref(100);
        var updateBattery = function () {
            if (battery.value > 1) {
                battery.value -= 1;
            }
        };

        var temperature = ref('26°C');
        var weatherDesc = ref('晴转多云');

        var openApp = function (id, e) {
            if (e && e.currentTarget) {
                var rect = e.currentTarget.getBoundingClientRect();
                var x = rect.left + rect.width / 2;
                var y = rect.top + rect.height / 2;
                window.document.documentElement.style.setProperty('--app-origin-x', x + 'px');
                window.document.documentElement.style.setProperty('--app-origin-y', y + 'px');
            } else {
                window.document.documentElement.style.setProperty('--app-origin-x', '50%');
                window.document.documentElement.style.setProperty('--app-origin-y', '50%');
            }
            store.currentApp = id;
        };

        var closeApp = function () {
            store.currentApp = null;
        };

        var homeStartY = 0;
        var homeTouchStart = function (e) {
            if (e.touches && e.touches.length > 0) homeStartY = e.touches[0].clientY;
        };
        var homeTouchMove = function (e) {
            e.preventDefault();
        };
        var homeTouchEnd = function (e) {
            if (e.changedTouches && e.changedTouches.length > 0) {
                var endY = e.changedTouches[0].clientY;
                if (homeStartY - endY > 30) closeApp();
            }
        };

        var initSortable = function () {
            var grid = window.document.getElementById('desktop-grid');
            if (!grid) return;

            window.Sortable.create(grid, {
                animation: 250,
                ghostClass: 'sortable-ghost',
                delay: 300,
                delayOnTouchOnly: true,
                swap: true,
                swapClass: 'sortable-swap-highlight',
                onEnd: function (evt) {
                    var oldIdx = evt.oldIndex;
                    var newIdx = evt.newIndex;
                    if (oldIdx === newIdx) return;
                    
                    var items = store.desktopItems.slice();
                    var temp = items[oldIdx];
                    items[oldIdx] = items[newIdx];
                    items[newIdx] = temp;
                    
                    store.desktopItems = items;
                }
            });
        };

        // 处理原来HTML中复杂的类名判断
        var getItemClass = function (item) {
            if (item.type === 'app') return 'app-icon';
            if (item.widgetType === 'dialog_2x2') return 'transparent-widget';
            return 'widget-box';
        };

        // 处理原来HTML中复杂的行列计算逻辑
        var getWidgetStyle = function (item) {
            if (item.type !== 'widget' || !item.span) return {};
            var parts = String(item.span).split('/');
            if (parts.length < 2) return {};
            return {
                gridColumn: 'span ' + parts[0].trim(),
                gridRow: 'span ' + parts[1].trim()
            };
        };

        // 处理图标点击事件
        var handleItemClick = function (item, e) {
            if (item.type === 'app') {
                openApp(item.id, e);
            }
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
            homeTouchEnd: homeTouchEnd,
            getItemClass: getItemClass,
            getWidgetStyle: getWidgetStyle,
            handleItemClick: handleItemClick
        };
    }
});

if (window.widgetApp) app.component('widgetApp', window.widgetApp);
if (window.themeApp) app.component('theme', window.themeApp);
if (window.settingsApp) app.component('settings', window.settingsApp);
if (window.qqApp) app.component('qq', window.qqApp);

app.mount('#app');
