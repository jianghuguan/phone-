/* eslint-disable */
/* jshint expr: true, asi: true */
/* global window, document, setInterval, clearInterval, Date, String, Math */
'use strict';

(function () {
    var Vue = window.Vue;
    var Sortable = window.Sortable;

    var app = Vue.createApp({
        setup: function () {
            var store = window.store;

            // 如果读取到的是旧版单数组数据，自动转化为多页数组，并保证至少有2页（第2页为空以供拖拽留白）
            if (!store.desktopPages || store.desktopPages.length === 0) {
                var items = store.desktopItems || [];
                store.desktopPages = [items, []];
            } else if (store.desktopPages[store.desktopPages.length - 1].length > 0) {
                // 永远保证最后一页有一个空页，方便应用被拖到新的一页去
                store.desktopPages.push([]);
            }

            var time = Vue.ref('');
            var date = Vue.ref('');
            var weekday = Vue.ref('');
            var currentVisiblePage = Vue.ref(0);

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
            var updateBattery = function () { if (battery.value > 1) { battery.value -= 1; } };
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

            var closeApp = function () { store.currentApp = null; };

            var homeStartY = 0;
            var homeTouchStart = function (e) { if (e.touches && e.touches.length > 0) { homeStartY = e.touches[0].clientY; } };
            var homeTouchMove = function (e) { e.preventDefault(); };
            var homeTouchEnd = function (e) {
                if (e.changedTouches && e.changedTouches.length > 0) {
                    var endY = e.changedTouches[0].clientY;
                    if (homeStartY - endY > 30) { closeApp(); }
                }
            };

            // 滑动时更新圆点指示器
            var onSliderScroll = function (e) {
                var scrollLeft = e.target.scrollLeft;
                var width = window.innerWidth;
                currentVisiblePage.value = Math.round(scrollLeft / width);
            };

            // 最核心的跨页拖拽系统
            var initSortable = function () {
                var pages = document.querySelectorAll('.desktop-page');
                if (!Sortable) return;

                pages.forEach(function (pageGrid) {
                    Sortable.create(pageGrid, {
                        group: 'desktopShared', // 允许所有屏幕之间互相拖放
                        animation: 250,
                        ghostClass: 'sortable-ghost',
                        delay: 300,
                        delayOnTouchOnly: true,
                        // swap 插件在跨列表时容易出现 Bug，因此关闭 swap，使用默认的插入式排布来实现流式留白
                        swap: false, 
                        onEnd: function (evt) {
                            var fromIdx = parseInt(evt.from.getAttribute('data-page-index'));
                            var toIdx = parseInt(evt.to.getAttribute('data-page-index'));
                            var oldIdx = evt.oldIndex;
                            var newIdx = evt.newIndex;

                            // 如果没有发生改变
                            if (fromIdx === toIdx && oldIdx === newIdx) return;

                            // 重要：Sortable.js 操作了真实的 DOM，但这与 Vue 的数据流是不一致的。
                            // 当跨越列表移动时，Vue 会因为找不到原始节点崩溃。
                            // 最稳妥的办法是：手动在 DOM 里把节点移回去，然后修改 Vue 的底层数据强制让 Vue 重绘！
                            var itemEl = evt.item;
                            if (fromIdx !== toIdx) {
                                // 将节点送回老家
                                if (evt.from.children.length > oldIdx) {
                                    evt.from.insertBefore(itemEl, evt.from.children[oldIdx]);
                                } else {
                                    evt.from.appendChild(itemEl);
                                }
                            }

                            // 深度克隆以便触发响应式
                            var allPages = JSON.parse(JSON.stringify(store.desktopPages));
                            var movedItem = allPages[fromIdx].splice(oldIdx, 1)[0];
                            allPages[toIdx].splice(newIdx, 0, movedItem);

                            // 如果原本的最后一页不是空的了，立马追加一个新空页备用
                            if (allPages[allPages.length - 1].length > 0) {
                                allPages.push([]);
                            }

                            // 清理夹在中间的纯空页（保证只有最后一页允许是彻底空着的备用页）
                            for (var i = allPages.length - 2; i >= 0; i--) {
                                if (allPages[i].length === 0) {
                                    allPages.splice(i, 1);
                                }
                            }

                            store.desktopPages = allPages;
                            // 为了兼容旧的其它插件的数据结构，顺便合并一下给 desktopItems 备个份
                            var flatItems = [];
                            for(var j=0; j<store.desktopPages.length; j++) {
                                flatItems = flatItems.concat(store.desktopPages[j]);
                            }
                            store.desktopItems = flatItems;
                        }
                    });
                });
            };

            var getItemClass = function (item) {
                if (item.type === 'app') return 'app-icon';
                if (item.widgetType === 'dialog_2x2') return 'transparent-widget';
                if (item.widgetType === 'empty_slot') return ''; // 隐形占位格子不带框
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

            // 监听数据变化，如果页数增减了，需要重新绑定拖拽实例
            Vue.watch(function() { return store.desktopPages.length; }, function(newVal, oldVal) {
                if (newVal !== oldVal) {
                    Vue.nextTick(function() { initSortable(); });
                }
            });

            return {
                store: store,
                time: time, date: date, weekday: weekday, battery: battery,
                temperature: temperature, weatherDesc: weatherDesc,
                currentVisiblePage: currentVisiblePage,
                onSliderScroll: onSliderScroll,
                openApp: openApp, closeApp: closeApp,
                homeTouchStart: homeTouchStart, homeTouchMove: homeTouchMove, homeTouchEnd: homeTouchEnd,
                getItemClass: getItemClass, getWidgetStyle: getWidgetStyle, handleItemClick: handleItemClick
            };
        }
    });

    if (window.widgetApp) app.component('widgetApp', window.widgetApp);
    if (window.themeApp) app.component('theme', window.themeApp);
    if (window.settingsApp) app.component('settings', window.settingsApp);
    if (window.qqApp) app.component('qq', window.qqApp);

    app.mount('#app');
})();
