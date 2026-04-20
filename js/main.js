import { store } from './store.js';
// 引入你的应用
import widgetApp from './apps/widgetApp.js';
import weiboApp from './apps/weibo.js';

const { createApp, ref, onMounted } = Vue;

const app = createApp({
    setup() {
        const time = ref('00:00');
        const date = ref('');
        const weekday = ref('');
        const battery = ref(100);

        // 1. 获取真实时间
        const updateTime = () => {
            const now = new Date();
            time.value = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
            date.value = (now.getMonth() + 1) + '月' + now.getDate() + '日';
            const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            weekday.value = days[now.getDay()];
        };

        // 2. 获取真实电量 (部分浏览器支持)
        const updateBattery = () => {
            if ('getBattery' in navigator) {
                navigator.getBattery().then(batt => {
                    battery.value = Math.floor(batt.level * 100);
                    batt.addEventListener('levelchange', () => {
                        battery.value = Math.floor(batt.level * 100);
                    });
                });
            } else {
                battery.value = 88; // 不支持的浏览器显示假电量
            }
        };

        onMounted(() => {
            updateTime();
            setInterval(updateTime, 1000);
            updateBattery();
        });

        const openApp = (id) => { store.currentApp = id; };
        const closeApp = () => { store.currentApp = null; };

        // 暴露给模板使用
        return { store, time, date, weekday, battery, openApp, closeApp };
    }
});

// 注册 App 组件
app.component('widgetApp', widgetApp);
app.component('weibo', weiboApp);
// 你每写一个新App，都要在这里 register 一下，比如:
// app.component('qq', qqApp);

app.mount('#app');
