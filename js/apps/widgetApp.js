window.widgetApp = {
  template: `
    <div class="page">
      <div class="page-title">小组件</div>

      <div class="card">
        <h3>时间天气小组件背景图</h3>
        <input class="input" v-model="timeBg" placeholder="粘贴图片链接" />
        <button class="btn" @click="saveTimeBg">保存背景图</button>
        <button class="btn btn-danger" @click="clearTimeBg">清除背景图</button>
      </div>

      <div class="card">
        <h3>照片墙小组件</h3>
        <button
          class="btn"
          @click="togglePhotoWidget"
        >
          {{ hasPhotoWidget ? '移除照片墙' : '添加照片墙' }}
        </button>

        <div class="row">
          <input class="input" v-model="images[0]" placeholder="第1张图片链接" />
        </div>
        <div class="row">
          <input class="input" v-model="images[1]" placeholder="第2张图片链接" />
        </div>
        <div class="row">
          <input class="input" v-model="images[2]" placeholder="第3张图片链接" />
        </div>
        <div class="row">
          <input class="input" v-model="images[3]" placeholder="第4张图片链接" />
        </div>

        <button class="btn" @click="savePhotos">保存照片墙图片</button>
      </div>

      <div class="card">
        <h3>说明</h3>
        <p style="line-height:1.7;color:#666;font-size:14px;">
          桌面上的 App 和小组件都支持长按拖动。<br>
          长按约 0.45 秒后拖动，会自动吸附到 4×6 网格。
        </p>
      </div>
    </div>
  `,
  setup() {
    const timeBg = Vue.ref(window.store.widgetSettings.timeWeatherBg);
    const images = Vue.ref([...window.store.widgetSettings.photoWallImages]);

    const hasPhotoWidget = Vue.computed(() => {
      return window.store.desktopItems.some(item => item.widgetType === 'photoWall');
    });

    const togglePhotoWidget = () => {
      const index = window.store.desktopItems.findIndex(item => item.widgetType === 'photoWall');
      if (index > -1) {
        window.store.desktopItems.splice(index, 1);
      } else {
        window.store.desktopItems.push({
          id: 'widget-photo',
          type: 'widget',
          widgetType: 'photoWall',
          x: 1,
          y: 3,
          w: 2,
          h: 2
        });
      }
    };

    const saveTimeBg = () => {
      window.store.widgetSettings.timeWeatherBg = timeBg.value.trim();
    };

    const clearTimeBg = () => {
      timeBg.value = '';
      window.store.widgetSettings.timeWeatherBg = '';
    };

    const savePhotos = () => {
      window.store.widgetSettings.photoWallImages = images.value.map(v => v.trim());
    };

    return {
      timeBg,
      images,
      hasPhotoWidget,
      togglePhotoWidget,
      saveTimeBg,
      clearTimeBg,
      savePhotos
    };
  }
};
