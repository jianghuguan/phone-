const { createApp, ref, onMounted, nextTick } = Vue;
const store = window.store;

const app = createApp({
    setup() {
        const time = ref('00:00');
        const date = ref('');
        const weekday = ref('');
        const battery = ref(100);
        const desktopRef = ref(null); // 指向桌面元素

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
            } else {
                battery.value = 99; 
            }
        };

        const updateWeather = async () => {
            try {
                const url = 'https://api.open-meteo.com/v1/forecast?latitude=39.90&longitude=116.40&current_weather=true';
                const response = await fetch(url);
                const data = await response.json();
                
                const code = data.current_weather.weathercode;
                let wIcon = '☁️', wDesc = '多云';
                if (code === 0) { wIcon = '☀️'; wDesc = '晴朗'; }
                else if (code <= 2) { wIcon = '⛅'; wDesc = '少云'; }
                else if (code === 3) { wIcon = '☁️'; wDesc = '阴天'; }
                else if (code >= 45 && code <= 48) { wIcon = '🌫️'; wDesc = '雾'; }
                else if (code >= 51 && code <= 67) { wIcon = '🌧️'; wDesc = '雨'; }
                else if (code >= 71 && code <= 77) { wIcon = '❄️'; wDesc = '雪'; }
                else if (code >= 95) { wIcon = '⛈️'; wDesc = '雷暴'; }

                weather.value = { temp: Math.round(data.current_weather.temperature), desc: wDesc, icon: wIcon };
            } catch (error) {
                weather.value.desc = "获取失败";
            }
        };

        // 获取独立App信息辅助函数
        const getApp = (id) => store.installedApps.find(a => a.id === id);

        onMounted(() => {
            updateTime(); updateBattery(); updateWeather();
            setInterval(updateTime, 1000);
            setInterval(updateWeather, 3600000); 

            // 初始化桌面拖拽支持 (长按生效)
            nextTick(() => {
                new Sortable(desktopRef.value, {
                    animation: 200, 
                    delay: 250, // 设定长按 250 毫秒才触发拖拽 (防止与普通点击冲突)
                    delayOnTouchOnly: false,
                    ghostClass: 'sortable-ghost',
                    dragClass: 'sortable-drag',
                    onEnd: (evt) => {
                        // 拖拽松手后：更新数组的顺序
                        const itemArr = [...store.desktopItems];
                        const movedItem = itemArr.splice(evt.oldIndex, 1)[0];
                        itemArr.splice(evt.newIndex, 0, movedItem);
                        store.desktopItems = itemArr;
                    }
                });
            });
        });

        const openApp = (id) => { store.currentApp = id; };
        const closeApp = () => { store.currentApp = null; };

        return { store, time, date, weekday, battery, weather, desktopRef, getApp, openApp, closeApp };
    }
});

app.component('widgetApp', window.widgetApp);
app.component('weibo', window.weiboApp);
app.mount('#app');
