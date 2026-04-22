window.store = Vue.reactive({
    currentApp: null, 
    
    // 自定义设置（图片地址）
    settings: {
        timeBg: 'https://images.unsplash.com/photo-1514477917009-389c76a86b68?w=500&q=80', // 默认星空/深色背景
        photoBg: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&q=80' // 默认照片墙背景
    },

    // App的静态信息库
    appsData: {
        qq: { name: 'QQ', textIcon: 'Q', color: '#e8f4fd' },
        sms: { name: '短信', textIcon: '信', color: '#e8fde8' },
        weibo: { name: '微博', textIcon: '微', color: '#fde8e8' },
        forum: { name: '论坛', textIcon: '论', color: '#f3e8fd' },
        music: { name: '音乐', textIcon: '音', color: '#fde8f5' },
        theme: { name: '美化', textIcon: '美', color: '#fdfce8' },
        settings: { name: '设置', textIcon: '设', color: '#eeeeee' },
        widgetApp: { name: '小组件', textIcon: '组', color: '#e8fdfa' }
    },

    // 桌面的真实排列顺序 (改变这个数组的顺序，桌面就会实时变化)
    layout: [
        { id: 'timeWidget', type: 'widget', span: '4 / 2' },
        { id: 'photoWidget', type: 'widget', span: '2 / 2' },
        { id: 'qq', type: 'app', span: '1 / 1' },
        { id: 'sms', type: 'app', span: '1 / 1' },
        { id: 'weibo', type: 'app', span: '1 / 1' },
        { id: 'forum', type: 'app', span: '1 / 1' },
        { id: 'music', type: 'app', span: '1 / 1' },
        { id: 'theme', type: 'app', span: '1 / 1' },
        { id: 'settings', type: 'app', span: '1 / 1' },
        { id: 'widgetApp', type: 'app', span: '1 / 1' }
    ]
});
