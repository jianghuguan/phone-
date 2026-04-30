/* eslint-disable */
/* eslint-env browser, es2021 */
/* jshint ignore:start */
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
            var weatherInterval = null;

            var battery = Vue.ref(100);
            var updateBattery = function () {
                if (battery.value > 1) {
                    battery.value -= 1;
                }
            };

            var temperature = Vue.ref('26°C');
            var weatherDesc = Vue.ref('晴转多云');

            var updateWeather = function () {
                var weatherApi = store.apiSettings && store.apiSettings.weather;
                if (weatherApi && weatherApi.key && weatherApi.city) {
                    var url = 'https://api.openweathermap.org/data/2.5/weather?q=' + window.encodeURIComponent(weatherApi.city) + '&appid=' + weatherApi.key + '&units=metric&lang=zh_cn';
                    window.fetch(url).then(function (res) {
                        return res.ok ? res.json() : null;
                    }).then(function (data) {
                        if (data && data.main) {
                            temperature.value = Math.round(data.main.temp) + '°C';
                            weatherDesc.value = data.weather[0].description;
                        }
                    }).catch(function (e) {
                        console.warn('Weather fetch failed', e);
                    });
                }
            };

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
                    onEnd: function (evt) {
                        var oldIdx = evt.oldIndex;
                        var newIdx = evt.newIndex;
                        if (oldIdx === newIdx) return;
                        
                        var items = [];
                        for (var i = 0; i < store.desktopItems.length; i++) {
                            items.push(store.desktopItems[i]);
                        }
                        var temp = items[oldIdx];
                        items[oldIdx] = items[newIdx];
                        items[newIdx] = temp;
                        store.desktopItems = items;
                    }
                });
            };

            // 彻底杜决 HTML Inline Style 报错：统一在这提供样式数据
            var getStatusBarClass = function () {
                return !store.currentApp ? 'status-bar dark-text' : 'status-bar';
            };
            var getBatteryStyle = function () {
                return { width: battery.value + '%' };
            };
            var getDesktopClass = function () {
                return store.currentApp ? 'desktop desktop-opened' : 'desktop';
            };
            var getDesktopStyle = function () {
                return { backgroundImage: store.desktopBgImage ? 'url(' + store.desktopBgImage + ')' : 'none' };
            };
            var getItemClass = function (item) {
                return item.type === 'app' ? 'app-icon' : 'widget-box';
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
            var getWidgetTimeStyle = function(item) { 
                return { backgroundColor: 'transparent', backgroundImage: item.bgImage ? 'url(' + item.bgImage + ')' : 'none', color: item.bgImage ? '#fff' : '#333' }; 
            };
            var getDateTextStyle = function(item) { 
                return { color: item.bgImage ? '#eee' : '#555' }; 
            };
            var getWidgetPhotoStyle = function(item) { 
                return { backgroundImage: item.bgImage ? 'url(' + item.bgImage + ')' : 'none' }; 
            };
            var getAppIconStyle = function(item) { 
                return { backgroundColor: item.color, backgroundImage: item.iconImage ? 'url(' + item.iconImage + ')' : 'none' }; 
            };

            var handleItemClick = function (item, e) {
                if (item.type === 'app') {
                    openApp(item.id, e);
                }
            };

            Vue.onMounted(function () {
                updateTime();
                updateWeather();

                timeInterval = setInterval(updateTime, 1000);
                batteryInterval = setInterval(updateBattery, 60000);
                weatherInterval = setInterval(updateWeather, 1800000);

                Vue.nextTick(function () {
                    initSortable();
                });
            });

            Vue.watch(function () { return store.apiSettings.weather; }, updateWeather, { deep: true });

            Vue.onUnmounted(function () {
                if (timeInterval) clearInterval(timeInterval);
                if (batteryInterval) clearInterval(batteryInterval);
                if (weatherInterval) clearInterval(weatherInterval);
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
                getStatusBarClass: getStatusBarClass,
                getBatteryStyle: getBatteryStyle,
                getDesktopClass: getDesktopClass,
                getDesktopStyle: getDesktopStyle,
                getItemClass: getItemClass,
                getWidgetStyle: getWidgetStyle,
                getWidgetTimeStyle: getWidgetTimeStyle,
                getDateTextStyle: getDateTextStyle,
                getWidgetPhotoStyle: getWidgetPhotoStyle,
                getAppIconStyle: getAppIconStyle,
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
