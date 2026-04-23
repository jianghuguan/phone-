const { createApp, ref, onMounted, nextTick } = Vue;
const store = window.store;

const app = createApp({
    setup() {
        const time = ref('00:00');
        const date = ref('');
        const weekday = ref('');
        const battery = ref(100);
        
        // 天气相关状态
        const temperature = ref('--°C');
        const weatherDesc = ref('获取中...');

        // 1. 更新时间和电量
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

        // 2. 获取天气 (Open-Meteo 免费 API)
        const fetchWeather = (lat = 39.9, lon = 116.4) => { // 默认北京坐标
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
                .then(res => res.json())
                .then(data => {
                    const cw = data.current_weather;
                    temperature.value = cw.temperature + '°C';
                    
                    // 简易天气代码转换
                    const code = cw.weathercode;
                    let desc = '☁️ 未知';
                    if (code === 0) desc = '☀️ 晴朗';
                    else if (code <= 3) desc = '🌤️ 多云';
                    else if (code <= 48) desc = '🌫️ 雾';
                    else if (code <= 67) desc = '🌧️ 雨';
                    else if (code <= 77) desc = '❄️ 雪';
                    else if (code >= 80) desc = '⛈️ 暴雨/雷阵雨';
                    weatherDesc.value = desc;
                }).catch(() => weatherDesc.value = '天气离线');
        };

        const initWeather = () => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                    err => fetchWeather() // 拒绝定位则使用默认坐标
                );
            } else { fetchWeather(); }
        };

        // 3. 初始化拖拽排序功能
        const initDragAndDrop = () => {
            const grid = document.getElementById('desktop-grid');
            new Sortable(grid, {
                animation: 200,
                delay: 250, // 250毫秒长按后才可拖拽 (兼容手机端)
                delayOnTouchOnly: true, // 只在触摸屏启用长按
                ghostClass: 'sortable-ghost', // 拖拽时的样式类
                onEnd: function (evt) {
                    // 同步拖拽后的数组顺序到 Vue 的 store 中
                    const arr = [...store.desktopItems];
                    const item = arr.splice(evt.oldIndex, 1)[0];
                    arr.splice(evt.newIndex, 0, item);
                    store.desktopItems = arr;
                }
            });
        };

        onMounted(() => {
            updateTime();
            setInterval(updateTime, 1000);
            updateBattery();
            initWeather();
            
            // 确保 DOM 渲染完毕后再绑定拖拽
            nextTick(() => { initDragAndDrop(); });
        });

        const openApp = (id) => { store.currentApp = id; };
        const closeApp = () => { store.currentApp = null; };

        return { store, time, date, weekday, battery, temperature, weatherDesc, openApp, closeApp };
    }
});

app.component('widgetApp', window.widgetApp);
app.component('weibo', window.weiboApp);
app.mount('#app');
