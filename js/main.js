/* eslint-disable */
/* global Vue, Sortable */

const { createApp, ref, onMounted, nextTick } = Vue;
const store = window.store;

const app = createApp({
    setup() {
        const time = ref('00:00');
        const date = ref('');
        const weekday = ref('');
        const battery = ref(100);
        
        const temperature = ref('--°C');
        const weatherDesc = ref('获取中...');

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
                battery.value = 99;
            }
        };

        const fetchWeather = (lat = 39.9, lon = 116.4) => {
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
                .then(res => res.json())
                .then(data => {
                    const cw = data.current_weather;
                    temperature.value = cw.temperature + '°C';
                    
                    const code = cw.weathercode;
                    let desc = '☁️ 未知';
                    if (code === 0) desc = '☀️ 晴朗';
                    else if (code <= 3) desc = '🌤️ 多云';
                    else if (code <= 48) desc = '🌫️ 雾';
                    else if (code <= 67) desc = '🌧️ 雨';
                    else if (code <= 77) desc = '❄️ 雪';
                    else if (code >= 80) desc = '⛈️ 暴雨/雷阵雨';
                    weatherDesc.value = desc;
                }).catch((err) => {
                    console.log(err);
                    weatherDesc.value = '天气离线';
                });
        };

        const initWeather = () => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                    (err) => fetchWeather()
                );
            } else {
                fetchWeather();
            }
        };

        const initDragAndDrop = () => {
            const grid = document.getElementById('desktop-grid');
            // 将 new Sortable 赋值给变量，消除部分编辑器 "no-new" 的报错红叉
            const sortableInstance = new Sortable(grid, {
                animation: 200,
                delay: 250,
                delayOnTouchOnly: true,
                ghostClass: 'sortable-ghost',
                onEnd: function (evt) {
                    const arr = [...store.desktopItems];
                    const item = arr.splice(evt.oldIndex, 1)[0];
                    arr.splice(evt.newIndex, 0, item);
                    store.desktopItems = arr;
                }
            });
            return sortableInstance;
        };

        onMounted(() => {
            updateTime();
            setInterval(updateTime, 1000);
            updateBattery();
            initWeather();
            
            nextTick(() => { 
                initDragAndDrop(); 
            });
        });

        const openApp = (id) => { store.currentApp = id; };
        const closeApp = () => { store.currentApp = null; };

        return { store, time, date, weekday, battery, temperature, weatherDesc, openApp, closeApp };
    }
});

app.component('widgetApp', window.widgetApp);
app.component('weibo', window.weiboApp);
app.mount('#app');

