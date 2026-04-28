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

const STORAGE_KEY = 'myPhoneData';
const DB_NAME = 'myPhoneDB';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

const clone = function (obj) {
    return JSON.parse(JSON.stringify(obj));
};

const createDefaultState = function () {
    return {
        currentApp: null,
        desktopItems: clone(defaultDesktopItems),
        desktopBgImage: null,
        apiSettings: {
            main: { url: 'https://api.openai.com', key: '', model: 'gpt-3.5-turbo' },
            sub: { url: '', key: '', model: '' },
            draw: { url: '', key: '', model: '' }
        },
        apiPresets: [],
        fetchedModels: [],
        qqData: {
            profile: { avatar: null, bgImage: null, nickname: '我', signature: '记录生活的美好' },
            contacts: [],
            messages: {},
            moments: [],
            theme: { msgListBg: null, chatBg: null, bubbleCss: '' },
            userCards: [
                { id: 'uc_default', name: '默认用户', persona: '一个普通的记录生活者，回复风格口语化。', avatar: null }
            ],
            wallet: {
                balance: 1000,
                history: [{ desc: '初始零钱红包', amount: '+1000.00', time: Date.now() }]
            }
        }
    };
};

const normalizeState = function (raw) {
    const base = createDefaultState();
    const data = raw && typeof raw === 'object' ? raw : {};
    const qqRaw = data.qqData && typeof data.qqData === 'object' ? data.qqData : {};

    return {
        currentApp: data.currentApp || null,
        desktopItems: Array.isArray(data.desktopItems) && data.desktopItems.length ? data.desktopItems : clone(base.desktopItems),
        desktopBgImage: data.desktopBgImage || null,
        apiSettings: Object.assign({}, base.apiSettings, data.apiSettings || {}),
        apiPresets: Array.isArray(data.apiPresets) ? data.apiPresets : [],
        fetchedModels: Array.isArray(data.fetchedModels) ? data.fetchedModels : [],
        qqData: {
            profile: Object.assign({}, base.qqData.profile, qqRaw.profile || {}),
            contacts: Array.isArray(qqRaw.contacts) ? qqRaw.contacts : [],
            messages: qqRaw.messages && typeof qqRaw.messages === 'object' ? qqRaw.messages : {},
            moments: Array.isArray(qqRaw.moments) ? qqRaw.moments : [],
            theme: Object.assign({}, base.qqData.theme, qqRaw.theme || {}),
            userCards: Array.isArray(qqRaw.userCards) && qqRaw.userCards.length ? qqRaw.userCards : clone(base.qqData.userCards),
            wallet: {
                balance: typeof (qqRaw.wallet && qqRaw.wallet.balance) === 'number' ? qqRaw.wallet.balance : base.qqData.wallet.balance,
                history: Array.isArray(qqRaw.wallet && qqRaw.wallet.history) && qqRaw.wallet.history.length
                    ? qqRaw.wallet.history
                    : clone(base.qqData.wallet.history)
            }
        }
    };
};

const openDB = function () {
    return new Promise(function (resolve, reject) {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = function () {
            resolve(request.result);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
};

const idbGet = async function (key) {
    const db = await openDB();
    return new Promise(function (resolve, reject) {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = function () {
            resolve(req.result || null);
        };
        req.onerror = function () {
            reject(req.error);
        };
    });
};

const idbSet = async function (key, value) {
    const db = await openDB();
    return new Promise(function (resolve, reject) {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);

        req.onsuccess = function () {
            resolve(true);
        };
        req.onerror = function () {
            reject(req.error);
        };
    });
};

window.store = Vue.reactive(createDefaultState());

let isHydrating = true;
let saveTimer = null;

window.storeReady = (async function () {
    let loaded = null;

    try {
        loaded = await idbGet(STORAGE_KEY);
    } catch (err) {
        if (err) {
            loaded = null;
        }
    }

    if (!loaded) {
        try {
            const oldLocal = window.localStorage.getItem(STORAGE_KEY);
            if (oldLocal) {
                loaded = JSON.parse(oldLocal);
                try {
                    await idbSet(STORAGE_KEY, loaded);
                } catch (e) {
                    if (e) {}
                }
            }
        } catch (err2) {
            if (err2) {
                loaded = null;
            }
        }
    }

    const normalized = normalizeState(loaded);
    Object.assign(window.store, normalized);
    isHydrating = false;
})();

Vue.watch(
    window.store,
    function (newState) {
        if (isHydrating) {
            return;
        }

        if (saveTimer) {
            window.clearTimeout(saveTimer);
        }

        saveTimer = window.setTimeout(async function () {
            try {
                const plain = JSON.parse(JSON.stringify(newState));
                await idbSet(STORAGE_KEY, plain);
                try {
                    window.localStorage.setItem(STORAGE_KEY + '_lastSaveTime', String(Date.now()));
                } catch (e) {
                    if (e) {}
                }
            } catch (err) {
                window.console.warn('IndexedDB save failed');
            }
        }, 300);
    },
    { deep: true }
);
