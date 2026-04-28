/* eslint-disable */
/* eslint-env browser, es2021 */
/* global Vue, indexedDB */
'use strict';

const defaultDesktopItems = [
    { type: 'widget', widgetType: 'time', id: 'timeWidget_1', name: '时钟天气', span: '4 / 2', bgImage: null },
    { type: 'widget', widgetType: 'photo', id: 'photoWidget_1', name: '照片墙', span: '2 / 2', bgImage: null },
    { type: 'app', id: 'qq', name: 'QQ', textIcon: 'Q', color: '#ffffff', iconImage: null },
    { type: 'app', id: 'sms', name: '短信', textIcon: '信', color: '#ffffff', iconImage: null },
    { type: 'app', id: 'weibo', name: '微博', textIcon: '微', color: '#ffffff', iconImage: null },
    { type: 'app', id: 'forum', name: '论坛', textIcon: '论', color: '#ffffff', iconImage: null },
    { type: 'app', id: 'music', name: '音乐', textIcon: '音', color: '#ffffff', iconImage: null },
    { type: 'app', id: 'theme', name: '美化', textIcon: '美', color: '#ffffff', iconImage: null },
    { type: 'app', id: 'settings', name: '设置', textIcon: '设', color: '#ffffff', iconImage: null },
    { type: 'app', id: 'widgetApp', name: '小组件', textIcon: '组', color: '#ffffff', iconImage: null }
];

const getInitialState = () => ({
    currentApp: null,
    desktopItems: defaultDesktopItems,
    desktopBgImage: null,
    apiSettings: {
        main: { url: 'https://api.openai.com', key: '', model: 'gpt-3.5-turbo' },
        sub: { url: '', key: '', model: '' },
        draw: { url: '', key: '', model: '' }
    },
    qqData: {
        profile: { avatar: null, bgImage: null, nickname: '我', signature: '记录生活的美好' },
        contacts: [],
        messages: {},
        userCards: [
            { id: 'uc_default', name: '默认用户', persona: '一个普通的记录生活者，回复风格口语化。', avatar: null }
        ],
        wallet: {
            balance: 1000,
            history: [{ desc: '初始零钱红包', amount: '+1000.00', time: Date.now() }]
        }
    }
});

window.store = Vue.reactive(getInitialState());
window.isStoreLoaded = Vue.ref(false); // 用于通知UI是否渲染

const DB_NAME = 'MyPhoneDB';
const STORE_NAME = 'storeData';

function initDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => {
            e.target.result.createObjectStore(STORE_NAME);
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function loadData() {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get('myPhoneData');
        
        req.onsuccess = () => {
            let parsed = null;
            if (req.result) {
                try { parsed = JSON.parse(req.result); } catch(e){}
            } else {
                // 如果 IDB 里没有，尝试从旧版 localStorage 读取并迁移
                const oldData = window.localStorage.getItem('myPhoneData');
                if (oldData) {
                    try { parsed = JSON.parse(oldData); } catch(e){}
                }
            }
            
            if (parsed) {
                parsed.currentApp = null; // 刷新时重置到桌面
                Object.assign(window.store, parsed);
            }
            
            // 补全由于版本更新缺失的缺省字段
            if (!Array.isArray(window.store.desktopItems) || window.store.desktopItems.length === 0) {
                window.store.desktopItems = defaultDesktopItems;
            }
            if (!window.store.apiSettings) window.store.apiSettings = getInitialState().apiSettings;
            if (!window.store.qqData) window.store.qqData = getInitialState().qqData;
            if (!window.store.qqData.wallet) window.store.qqData.wallet = getInitialState().qqData.wallet;

            window.isStoreLoaded.value = true; // 告知可以挂载渲染
            
            // 启动数据修改监听并落盘
            Vue.watch(window.store, async (newState) => {
                try {
                    const db = await initDB();
                    const tx = db.transaction(STORE_NAME, 'readwrite');
                    tx.objectStore(STORE_NAME).put(JSON.stringify(newState), 'myPhoneData');
                } catch(e) {
                    console.warn('IDB Save failed', e);
                }
            }, { deep: true });
        };
        req.onerror = () => { window.isStoreLoaded.value = true; };
    } catch(e) {
        console.error('IDB load error', e);
        window.isStoreLoaded.value = true;
    }
}

loadData();
