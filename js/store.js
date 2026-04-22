window.store = Vue.reactive({
  currentApp: null,

  installedApps: [
    { id: 'qq', name: 'QQ', textIcon: 'Q', color: '#e8f4fd' },
    { id: 'sms', name: '短信', textIcon: '信', color: '#e8fde8' },
    { id: 'weibo', name: '微博', textIcon: '微', color: '#fde8e8' },
    { id: 'forum', name: '论坛', textIcon: '论', color: '#f3e8fd' },
    { id: 'music', name: '音乐', textIcon: '音', color: '#fde8f5' },
    { id: 'theme', name: '美化', textIcon: '美', color: '#fdfce8' },
    { id: 'settings', name: '设置', textIcon: '设', color: '#eeeeee' },
    { id: 'widgetApp', name: '小组件', textIcon: '组', color: '#e8fdfa' }
  ],

  widgetSettings: {
    timeWeatherBg: '',
    photoWallImages: [
      '',
      '',
      '',
      ''
    ]
  },

  desktopItems: [
    { id: 'widget-time', type: 'widget', widgetType: 'timeWeather', x: 1, y: 1, w: 4, h: 2 },
    { id: 'widget-photo', type: 'widget', widgetType: 'photoWall', x: 1, y: 3, w: 2, h: 2 },

    { id: 'app-qq', type: 'app', appId: 'qq', x: 3, y: 3, w: 1, h: 1 },
    { id: 'app-sms', type: 'app', appId: 'sms', x: 4, y: 3, w: 1, h: 1 },
    { id: 'app-weibo', type: 'app', appId: 'weibo', x: 3, y: 4, w: 1, h: 1 },
    { id: 'app-forum', type: 'app', appId: 'forum', x: 4, y: 4, w: 1, h: 1 },

    { id: 'app-music', type: 'app', appId: 'music', x: 1, y: 5, w: 1, h: 1 },
    { id: 'app-theme', type: 'app', appId: 'theme', x: 2, y: 5, w: 1, h: 1 },
    { id: 'app-settings', type: 'app', appId: 'settings', x: 3, y: 5, w: 1, h: 1 },
    { id: 'app-widgetApp', type: 'app', appId: 'widgetApp', x: 4, y: 5, w: 1, h: 1 }
  ]
});
