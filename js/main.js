const { createApp, ref, onMounted } = Vue;
const store = window.store;

const app = createApp({
    setup() {
        const time = ref('00:00');
        const date = ref('');
        const weekday = ref('');
        const battery = ref(100);

        const updateTime = () => {
            const now = new Date();
            time.value = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
            date.value = (now.getMonth() + 1) + '月' + now.getDate() + '日';
            const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            weekday.value = days[now.getDay()];
        };

        const updateBattery = () => {
            if ('getBattery' in navigator) {
                navigator.getBattery().then(batt => {
                    battery.value = Math.floor(batt.level * 100);
                    batt.addEventListener('levelchange', () => {
                        battery.value = Math.floor(batt.level * 100);
                    });
                });
            } else {
                battery.value = 99; // 苹果系统通常不支持读取电量，给个占位符
            }
        };

        onMounted(() => {
            updateTime();
            setInterval(updateTime, 1000);
            updateBattery();
        });

        const openApp = (id) => { store.currentApp = id; };
        const closeApp = () => { store.currentApp = null; };

        return { store, time, date, weekday, battery, openApp, closeApp };
    }
});

// 注册刚才写的两个App (如果你后续写了 qq.js，记得在这里照葫芦画瓢加上)
app.component('widgetApp', window.widgetApp);
app.component('weibo', window.weiboApp);

app.mount('#app');
