/* eslint-disable */
/* eslint-env browser, es2021 */
/* global Vue, indexedDB */
'use strict';

const DEFAULT_DESKTOP_ITEMS = [
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
    desktopItems: JSON.parse(JSON.stringify(DEFAULT_DESKTOP_ITEMS)),
    desktopBgImage: null,
    apiSettings: {
        main: { url: 'https://api.openai.com', key: '', model: 'gpt-3.5-turbo' },
        sub: { url: '', key: '', model: '' },
        draw: { url: '', key: '', model: '' }
    },
    apiPresets: [],
    fetchedModels: [],
    qqData: {
        theme: { msgListBg: null, chatBg: null, bubbleCss: '' },
        profile: { avatar: null, bgImage: null, nickname: '我', signature: '记录生活的美好' },
        contacts: [],
        messages: {},
        userCards: [
            { id: 'uc_default', name: '默认用户', persona: '一个普通的记录生活者，回复风格口语化。', avatar: null }
        ],
        moments: [],
        wallet: {
            balance: 1000,
            history: [{ desc: '初始零钱红包', amount: '+1000.00', time: Date.now() }]
        }
    }
});

window.store = Vue.reactive(getInitialState());
window.isStoreLoaded = Vue.ref(false);

const DB_NAME = 'MyPhoneDB';
const DB_VERSION = 2;
const STORE_NAME = 'storeData';
const STORAGE_KEY = 'myPhoneData';

function openDB() {
    return new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
            reject(new Error('IndexedDB not supported'));
            return;
        }
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => reject(req.error);
    });
}

async function loadFromDB() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(STORAGE_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    });
}

async function saveToDB(data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(JSON.stringify(data), STORAGE_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

function mergeMissingFields(target, fallback) {
    if (!target || typeof target !== 'object') return fallback;
    Object.keys(fallback).forEach((k) => {
        if (target[k] === undefined || target[k] === null) {
            target[k] = Array.isArray(fallback[k]) ? JSON.parse(JSON.stringify(fallback[k])) : fallback[k];
        }
    });
    return target;
}

function normalizeState(raw) {
    const init = getInitialState();
    const data = raw && typeof raw === 'object' ? raw : {};

    data.desktopItems = Array.isArray(data.desktopItems) && data.desktopItems.length ? data.desktopItems : init.desktopItems;
    data.apiSettings = mergeMissingFields(data.apiSettings || {}, init.apiSettings);
    data.qqData = data.qqData || {};
    data.qqData.theme = mergeMissingFields(data.qqData.theme || {}, init.qqData.theme);
    data.qqData.profile = mergeMissingFields(data.qqData.profile || {}, init.qqData.profile);
    data.qqData.contacts = Array.isArray(data.qqData.contacts) ? data.qqData.contacts : [];
    data.qqData.messages = data.qqData.messages && typeof data.qqData.messages === 'object' ? data.qqData.messages : {};
    data.qqData.userCards = Array.isArray(data.qqData.userCards) && data.qqData.userCards.length ? data.qqData.userCards : init.qqData.userCards;
    data.qqData.moments = Array.isArray(data.qqData.moments) ? data.qqData.moments : [];
    data.qqData.wallet = mergeMissingFields(data.qqData.wallet || {}, init.qqData.wallet);

    if (!Array.isArray(data.apiPresets)) data.apiPresets = [];
    if (!Array.isArray(data.fetchedModels)) data.fetchedModels = [];
    if (!data.qqData.wallet.history) data.qqData.wallet.history = init.qqData.wallet.history;

    data.currentApp = null; // 刷新后回到桌面
    return data;
}

async function loadData() {
    try {
        let raw = null;
        try {
            raw = await loadFromDB();
        } catch (e) {
            raw = null;
        }

        if (!raw) {
            const old = window.localStorage.getItem(STORAGE_KEY);
            if (old) {
                raw = old;
                try {
                    await saveToDB(old);
                } catch (e) {}
            }
        }

        if (raw) {
            try {
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                Object.assign(window.store, normalizeState(parsed));
            } catch (e) {
                Object.assign(window.store, getInitialState());
            }
        } else {
            Object.assign(window.store, getInitialState());
        }
    } catch (e) {
        console.error('load store failed', e);
        Object.assign(window.store, getInitialState());
    } finally {
        window.isStoreLoaded.value = true;
    }
}

let saveTimer = null;
Vue.watch(
    window.store,
    (newVal) => {
        if (!window.isStoreLoaded.value) return;
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            saveToDB(newVal).catch((e) => console.warn('save failed', e));
        }, 250);
    },
    { deep: true }
);

loadData();
