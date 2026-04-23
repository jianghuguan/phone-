/* eslint-disable */
/* global Vue, Sortable, window, document */
'use strict';

const { createApp, ref, onMounted, onUnmounted, nextTick } = Vue;

const app = createApp({
    setup() {
        // 引入全局状态数据
        const store = window.store;

        // --- 1. 状态栏与组件：时间与日期 ---
        const time = ref('');
        const date = ref('');
        const weekday = ref('');
        
        const updateTime = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            time.value = `${hours}:${minutes}`;
            
            const month = now.getMonth() + 1;
            const day = now.getDate();
            date.value = `${month}月${day}日`;
            
            const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            weekday.value = days[now.getDay()];
        };
        
        let timeInterval;

        // --- 2. 状态栏：电量 (模拟静态电量，也可自行扩展动态掉电) ---
        const battery = ref(100);

        // --- 3. 天气模拟数据 ---
        const temperature = ref('26°C');
        const weatherDesc = ref('晴转多云');

        // --- 4. App 交互逻辑 ---
        const openApp = (id) => {
            store.currentApp = id;
        };
        
        const closeApp = () => {
            store.currentApp = null;
        };

        // --- 5. 桌面拖拽排序逻辑 (SortableJS) ---
        const initSortable = () => {
            const grid = document.getElementById('desktop-grid');
            if (!grid) return;
            
            new Sortable(grid, {
                animation: 250,
                ghostClass: 'sortable-ghost',
                // 加入长按延迟：长按 200 毫秒后才能拖拽，防止和正常点击打开 App 冲突
                delay: 200, 
                delayOnTouchOnly: true, 
                onEnd: (evt) => {
                    const { oldIndex, newIndex } = evt;
                    if (oldIndex === newIndex) return; // 位置没变则不处理
                    
                    // 同步拖拽后的数组顺序到 store，触发 localStorage 自动保存
                    const items = [...store.desktopItems];
                    const [movedItem] = items.splice(oldIndex, 1);
                    items.splice(newIndex, 0, movedItem);
                    
                    store.desktopItems = items;
                }
            });
        };

        // --- 6. 生命周期钩子 ---
        onMounted(() => {
            updateTime();
            // 每秒更新一次时间
            timeInterval = setInterval(updateTime, 1000);
            
            // 等待 Vue 将桌面 DOM 渲染完毕后，挂载拖拽事件
            nextTick(() => {
                initSortable();
            });
        });

        onUnmounted(() => {
            clearInterval(timeInterval);
        });

        return { 
            store, 
            time, date, weekday, 
            battery, 
            temperature, weatherDesc, 
            openApp, closeApp 
        };
    }
});

// --- 注册所有的 App 子组件 ---
// 注册小组件管理 App
if (window.widgetApp) {
    app.component('widgetApp', window.widgetApp);
}
// 注册桌面美化 App (新增)
if (window.themeApp) {
    app.component('theme', window.themeApp);
}
// 注册其他常规 App (比如微博，如果有的话)
if (window.weiboApp) {
    app.component('weibo', window.weiboApp);
}

// 挂载整个 Vue 实例
app.mount('#app');
