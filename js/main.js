/* eslint-disable */
/* jshint ignore:start */
/* global window, document, setInterval, clearInterval, Date, String, parseInt */
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
                date.value = (now.getMonth() + 1) + '月' + now.getDate() + '日';
                var days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
                weekday.value = days[now.getDay()];
            };

            var battery = Vue.ref(100);
            var batteryInterval = null;
            var timeInterval = null;
            
            var updateBattery = function () { 
                if (battery.value > 1) { battery.value -= 1; }
            };
            
            var temperature = Vue.ref('26°C');
            var weatherDesc = Vue.ref('晴转多云');

            var openApp = function (id, e) {
                if (e && e.currentTarget) {
                    var rect = e.currentTarget.getBoundingClientRect();
                    document.documentElement.style.setProperty('--app-origin-x', (rect.left + rect.width / 2) + 'px');
                    document.documentElement.style.setProperty('--app-origin-y', (rect.top + rect.height / 2) + 'px');
                } else {
                    document.documentElement.style.setProperty('--app-origin-x', '50%');
                    document.documentElement.style.setProperty('--app-origin-y', '50%');
                }
                store.currentApp = id;
            };

            var closeApp = function () { store.currentApp = null; };

            var homeStartY = 0;
            var homeTouchStart = function (e) { 
                if (e.touches && e.touches.length > 0) { homeStartY = e.touches[0].clientY; }
            };
            var homeTouchMove = function (e) { e.preventDefault(); };
            var homeTouchEnd = function (e) {
                if (e.changedTouches && e.changedTouches.length > 0) {
                    if (homeStartY - e.changedTouches[0].clientY > 30) { closeApp(); }
                }
            };

            var calcArea = function (item) {
                if (!item.span) { return 1; }
                var parts = String(item.span).split('/');
                if (parts.length === 2) {
                    return parseInt(parts[0].replace(/^\s+|\s+$/g, ''), 10) * parseInt(parts[1].replace(/^\s+|\s+$/g, ''), 10);
                }
                return 1;
            };

            var initSortable = function () {
                var swiper = document.getElementById('desktop-swiper');
                var createSort = function(pageIdx) {
                    var grid = document.getElementById('desktop-page-' + pageIdx);
                    if (!grid || !Sortable) { return; }

                    Sortable.create(grid, {
                        group: 'desktop',
                        animation: 250,
                        ghostClass: 'sortable-ghost',
                        delay: 300,
                        delayOnTouchOnly: true,
                        onStart: function() {
                            if (swiper) { swiper.classList.add('is-dragging'); }
                        },
                        onMove: function(evt, originalEvent) {
                            if (!swiper) { return; }
                            var x = originalEvent.clientX || (originalEvent.touches && originalEvent.touches[0].clientX);
                            if (!x) { return; }
                            if (x < 35) { swiper.scrollTo({ left: 0, behavior: 'smooth' }); }
                            else if (x > window.innerWidth - 35) { swiper.scrollTo({ left: window.innerWidth, behavior: 'smooth' }); }
                        },
                        onEnd: function (evt) {
                            if (swiper) { swiper.classList.remove('is-dragging'); }
                            
                            var oldPageIdx = parseInt(evt.from.id.replace('desktop-page-', ''), 10);
                            var newPageIdx = parseInt(evt.to.id.replace('desktop-page-', ''), 10);
                            var oldIdx = evt.oldIndex;
                            var newIdx = evt.newIndex;

                            if (oldPageIdx === newPageIdx) {
                                if (oldIdx === newIdx) { return; }
                                var items = store.desktopPages[oldPageIdx].slice();
                                var temp = items[oldIdx];
                                items.splice(oldIdx, 1);
                                items.splice(newIdx, 0, temp);
                                store.desktopPages[oldPageIdx] = items;
                            } else {
                                var oldPageItems = store.desktopPages[oldPageIdx].slice();
                                var newPageItems = store.desktopPages[newPageIdx].slice();
                                var item = oldPageItems[oldIdx];
                                var itemArea = calcArea(item);
                                
                                var emptyCount = 0;
                                newPageItems.forEach(function(i) { 
                                    if (i.type === 'empty') { emptyCount++; }
                                });
                                
                                if (emptyCount < itemArea) {
                                    store.desktopPages = [store.desktopPages[0].slice(), store.desktopPages[1].slice()];
                                    window.setTimeout(function() { window.alert('目标页面空间不足！请先移除一些小组件留出空位。'); }, 100);
                                    return;
                                }
                                
                                var moved = 0;
                                for (var i = newPageItems.length - 1; i >= 0; i--) {
                                    if (newPageItems[i].type === 'empty' && moved < itemArea) {
                                        oldPageItems.push(newPageItems.splice(i, 1)[0]);
                                        moved++;
                                    }
                                }
                                
                                oldPageItems.splice(oldIdx, 1);
                                newPageItems.splice(newIdx, 0, item);
                                store.desktopPages[oldPageIdx] = oldPageItems;
                                store.desktopPages[newPageIdx] = newPageItems;
                            }
                        }
                    });
                };
                createSort(0); 
                createSort(1);
            };

            var getItemClass = function (item) {
                if (item.type === 'empty') { return 'empty-slot'; }
                if (item.type === 'app') { return 'app-icon'; }
                if (item.widgetType === 'dialog_2x2') { return 'transparent-widget'; }
                return 'widget-box';
            };

            var getWidgetStyle = function (item) {
                if (item.type === 'empty') { return {}; }
                if (item.type !== 'widget' || !item.span) { return {}; }
                var parts = String(item.span).split('/');
                if (parts.length < 2) { return {}; }
                return {
                    gridColumn: 'span ' + parts[0].replace(/^\s+|\s+$/g, ''),
                    gridRow: 'span ' + parts[1].replace(/^\s+|\s+$/g, '')
                };
            };

            var handleItemClick = function (item, e) {
                if (item.type === 'app') { openApp(item.id, e); }
            };

            Vue.onMounted(function () {
                updateTime();
                timeInterval = setInterval(updateTime, 1000);
                batteryInterval = setInterval(updateBattery, 60000);
                Vue.nextTick(function () { initSortable(); });
            });

            Vue.onUnmounted(function () {
                if (timeInterval) { clearInterval(timeInterval); }
                if (batteryInterval) { clearInterval(batteryInterval); }
            });

            return {
                store: store, time: time, date: date, weekday: weekday, battery: battery,
                temperature: temperature, weatherDesc: weatherDesc, openApp: openApp, closeApp: closeApp,
                homeTouchStart: homeTouchStart, homeTouchMove: homeTouchMove, homeTouchEnd: homeTouchEnd,
                getItemClass: getItemClass, getWidgetStyle: getWidgetStyle, handleItemClick: handleItemClick
            };
        }
    });

    if (window.widgetApp) { app.component('widgetApp', window.widgetApp); }
    if (window.themeApp) { app.component('theme', window.themeApp); }
    if (window.settingsApp) { app.component('settings', window.settingsApp); }
    if (window.qqApp) { app.component('qq', window.qqApp); }

    app.mount('#app');
})();
