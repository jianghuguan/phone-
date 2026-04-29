/* eslint-disable */
/* jshint expr: true, asi: true */
/* global window, document, setInterval, clearInterval, Date, String */
'use strict';

(function () {
    var Vue = window.Vue;
    var Sortable = window.Sortable;

    var app = Vue.createApp({
        setup: function () {
            var store = window.store;

            var time = Vue.ref('');
            var date = Vue.ref('');
            var weekday = Vue.ref('');

            var updateTime = function () {
                var now = new Date();
                var h = now.getHours();
                var m = now.getMinutes();
                time.value = (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);

                var month = now.getMonth() + 1;
                var day = now.getDate();
                date.value = month + '月' + day + '日';

                var days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
                weekday.value = days[now.getDay()];
            };

            var timeInterval = null;
            var batteryInterval = null;

            var battery = Vue.ref(100);
            var updateBattery = function () {
                if (battery.value > 1) {
                    battery.value -= 1;
                }
            };

            var temperature = Vue.ref('26°C');
            var weatherDesc = Vue.ref('晴转多云');

            var openApp = function (id, e) {
                if (e && e.currentTarget) {
                    var rect = e.currentTarget.getBoundingClientRect();
                    var x = rect.left + (rect.width / 2);
                    var y = rect.top + (rect.height / 2);
                    document.documentElement.style.setProperty('--app-origin-x', x + 'px');
                    document.documentElement.style.setProperty('--app-origin-y', y + 'px');
                } else {
                    document.documentElement.style.setProperty('--app-origin-x', '50%');
                    document.documentElement.style.setProperty('--app-origin-y', '50%');
                }
                store.currentApp = id;
            };

            var closeApp = function () {
                store.currentApp = null;
            };

            var homeStartY = 0;
            var homeTouchStart = function (e) {
                if (e.touches && e.touches.length > 0) {
                    homeStartY = e.touches[0].clientY;
                }
            };
            var homeTouchMove = function (e) {
                e.preventDefault();
            };
            var homeTouchEnd = function (e) {
                if (e.changedTouches && e.changedTouches.length > 0) {
                    var endY = e.changedTouches[0].clientY;
                    if (homeStartY - endY > 30) {
                        closeApp();
                    }
                }
            };

            var initSortable = function () {
                var grid = document.getElementById('desktop-grid');
                if (!grid || !Sortable) return;

                Sortable.create(grid, {
                    animation: 250,
                    ghostClass: 'sortable-ghost',
                    delay: 300,
                    delayOnTouchOnly: true,
                    swap: true,
                    swapClass: 'sortable-swap-highlight',
                    scroll: true,             // 开启横向边缘翻页能力
                    scrollSensitivity: 80,    // 边缘滚动灵敏度
                    scrollSpeed: 15,          // 滚动速度
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

            var getItemClass = function (item) {
                if (item.type === 'app') return 'app-icon';
                if (item.widgetType === 'dialog_2x2') return 'transparent-widget';
                return 'widget-box';
            };

            var getWidgetStyle = function (item) {
                if (item.type !== 'widget' || !item.span) return {};
                var parts = String(item.span).split('/');
                if (parts.length < 2) return {};
                return {
                    gridColumn: 'span ' + parts[0].replace(/^\s+|\s+$/g, ''),
                    gridRow: 'span ' + parts[1].replace(/^\s+|\s+$/g, '')
                };
            };

            var handleItemClick = function (item, e) {
                if (item.type === 'app') {
                    openApp(item.id, e);
                }
            };

            Vue.onMounted(function () {
                updateTime();
                timeInterval = setInterval(updateTime, 1000);

                battery.value = 100;
                batteryInterval = setInterval(updateBattery, 60000);

                Vue.nextTick(function () {
                    initSortable();
                });
            });

            Vue.onUnmounted(function () {
                if (timeInterval) clearInterval(timeInterval);
                if (batteryInterval) clearInterval(batteryInterval);
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
})();
