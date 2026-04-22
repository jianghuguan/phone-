const { createApp, ref, onMounted } = Vue;
const store = window.store;

const app = createApp({
  setup() {
    const time = ref('00:00');
    const date = ref('');
    const weekday = ref('');
    const battery = ref(100);

    const weatherText = ref('天气加载中');
    const temperature = ref('--°');

    const desktopRef = ref(null);

    const draggingId = ref(null);
    const pressTimer = ref(null);
    const activeItem = ref(null);

    const updateTime = () => {
      const now = new Date();
      time.value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      date.value = `${now.getMonth() + 1}月${now.getDate()}日`;
      weekday.value = ['周日','周一','周二','周三','周四','周五','周六'][now.getDay()];
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

    const weatherCodeMap = {
      0: '晴',
      1: '晴',
      2: '少云',
      3: '阴',
      45: '雾',
      48: '雾',
      51: '毛毛雨',
      53: '小雨',
      55: '中雨',
      61: '小雨',
      63: '中雨',
      65: '大雨',
      71: '小雪',
      73: '中雪',
      75: '大雪',
      80: '阵雨',
      81: '强阵雨',
      82: '暴雨',
      95: '雷暴'
    };

    const fetchWeatherByCoords = async (lat, lon) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();
        const current = data.current || {};
        temperature.value = current.temperature_2m != null ? `${Math.round(current.temperature_2m)}°` : '--°';
        weatherText.value = weatherCodeMap[current.weather_code] || '未知天气';
      } catch (e) {
        weatherText.value = '天气获取失败';
        temperature.value = '--°';
      }
    };

    const fetchWeather = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
            fetchWeatherByCoords(31.23, 121.47);
          },
          { enableHighAccuracy: false, timeout: 5000 }
        );
      } else {
        fetchWeatherByCoords(31.23, 121.47);
      }
    };

    const getAppById = (id) => {
      return store.installedApps.find(app => app.id === id) || {
        name: id,
        textIcon: '?',
        color: '#eee'
      };
    };

    const getItemStyle = (item) => ({
      gridColumn: `${item.x} / span ${item.w}`,
      gridRow: `${item.y} / span ${item.h}`
    });

    const openApp = (id) => {
      store.currentApp = id;
    };

    const closeApp = () => {
      store.currentApp = null;
    };

    const getPoint = (e) => {
      if (e.touches && e.touches[0]) return e.touches[0];
      if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0];
      return e;
    };

    const onItemStart = (item, e) => {
      activeItem.value = item;
      clearTimeout(pressTimer.value);
      pressTimer.value = setTimeout(() => {
        draggingId.value = item.id;
      }, 450);
    };

    const onItemEnd = () => {
      clearTimeout(pressTimer.value);
    };

    const onDesktopMove = (e) => {
      if (!draggingId.value || !desktopRef.value || !activeItem.value) return;

      const point = getPoint(e);
      const rect = desktopRef.value.getBoundingClientRect();

      const colWidth = rect.width / 4;
      const rowHeight = rect.height / 6;

      let col = Math.floor((point.clientX - rect.left) / colWidth) + 1;
      let row = Math.floor((point.clientY - rect.top) / rowHeight) + 1;

      col = Math.max(1, Math.min(col, 4 - activeItem.value.w + 1));
      row = Math.max(1, Math.min(row, 6 - activeItem.value.h + 1));

      activeItem.value.x = col;
      activeItem.value.y = row;
    };

    const onDesktopEnd = () => {
      clearTimeout(pressTimer.value);
      draggingId.value = null;
      activeItem.value = null;
    };

    onMounted(() => {
      updateTime();
      setInterval(updateTime, 1000);
      updateBattery();
      fetchWeather();
      setInterval(fetchWeather, 1000 * 60 * 20);
    });

    return {
      store,
      time,
      date,
      weekday,
      battery,
      weatherText,
      temperature,
      desktopRef,
      draggingId,
      getItemStyle,
      getAppById,
      openApp,
      closeApp,
      onItemStart,
      onItemEnd,
      onDesktopMove,
      onDesktopEnd
    };
  }
});

app.component('widgetApp', window.widgetApp);
app.component('qq', window.qqApp);
app.component('sms', window.smsApp);
app.component('weibo', window.weiboApp);
app.component('forum', window.forumApp);
app.component('music', window.musicApp);
app.component('theme', window.themeApp);
app.component('settings', window.settingsApp);

app.mount('#app');
