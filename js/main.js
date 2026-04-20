const { createApp, ref, onMounted, watch, nextTick } = Vue;
const store = window.store;

const app = createApp({
    setup() {
        const time = ref('00:00');
        const date = ref('');
        const weekday = ref('');
        const battery = ref(100);
        const weather = ref({ temp: '--', desc: '获取中...', icon: '☁️' });

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
                    batt.addEventListener('levelchange', () => battery.value = Math.floor(batt.level * 100));
                });
            } else { battery.value = 99; }
        };

        // Open-Meteo 真实免费免费天气 API
        const updateWeather = async () => {
            try {
                // 默认经纬度可以自己修改
                const url = 'https://api.open-meteo.com/v1/forecast?latitude=39.90&longitude=116.40&current_weather=true';
                const response = await fetch(url);
                const data = await response.json();
                
                const currentTemp = Math.round(data.current_weather.temperature);
                const weatherCode = data.current_weather.weathercode;
                
                let weatherIcon = '☁️', weatherDesc = '多云';
                if (weatherCode === 0) { weatherIcon = '☀️'; weatherDesc = '晴朗'; }
                else if (weatherCode <= 2) { weatherIcon = '⛅'; weatherDesc = '少云'; }
                else if (weatherCode === 3) { weatherIcon = '☁️'; weatherDesc = '阴天'; }
                else if (weatherCode >= 45 && weatherCode <= 48) { weatherIcon = '🌫️'; weatherDesc = '雾'; }
                else if (weatherCode >= 51 && weatherCode <= 67) { weatherIcon = '🌧️'; weatherDesc = '雨'; }
                else if (weatherCode >= 71 && weatherCode <= 77) { weatherIcon = '❄️'; weatherDesc = '雪'; }
                else if (weatherCode >= 95) { weatherIcon = '⛈️'; weatherDesc = '雷暴'; }

                weather.value = { temp: currentTemp, desc: weatherDesc, icon: weatherIcon };
            } catch (error) {
                weather.value.desc = "网络中断";
            }
        };

        // 绑定拖拽事件（长按）
        const initSortable = () => {
            const el = document.getElementById('desktop-grid');
            if (el) {
                new Sortable(el, {
                    delay: 250, // 长按 250 毫秒才能拖拽，防止滑动页面时产生误触！
                    delayOnTouchOnly: true, // 仅在触摸屏时生效长按
                    animation: 200, // 高级动画过渡
                    ghostClass: 'sortable-ghost',
                    dragClass: 'sortable-drag',
                    onEnd(evt) {
                        // 这个机制会在拖动结束后，自动同步你的 store 数据中组件的排队顺序
                        const item = store.desktopLayout.splice(evt.oldIndex, 1)[0];
                        store.desktopLayout.splice(evt.newIndex, 0, item);
                    }
                });
            }
        };

        onMounted(() => {
            updateTime(); setInterval(updateTime, 1000);
            updateBattery(); updateWeather();
            initSortable();
        });

        // ！！核心！！: 每次关闭App回到桌面时，重新挂载长按拖动事件
        watch(() => store.currentApp, (newVal) => {
            if (!newVal) {
                nextTick(() => { initSortable(); });
            }
        });

        const openApp = (id) => { store.currentApp = id; };
        const closeApp = () => { store.currentApp = null; };

        return { store, time, date, weekday, battery, weather, openApp, closeApp };
    }
});

app.component('widgetApp', window.widgetApp);
app.component('weibo', window.weiboApp);

app.mount('#app');
