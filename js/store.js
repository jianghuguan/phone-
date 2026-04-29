/* eslint-disable */
/* jshint esversion: 8 */
/* global Vue, window, console, Promise */
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

let initialState = {
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
};

window.store = Vue.reactive(initialState);
let isStoreLoaded = false;

// 封装 IndexedDB
const initDB = function () {
    return new Promise(function (resolve, reject) {
        const request = window.indexedDB.open('MyPhoneDB', 1);
        request.onerror = function () { reject(request.error); };
        request.onsuccess = function () { resolve(request.result); };
        request.onupgradeneeded = function (e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('store')) {
                db.createObjectStore('store');
            }
        };
    });
};

const loadData = function () {
    initDB()
        .then(function (db) {
            const tx = db.transaction('store', 'readonly');
            const storeObj = tx.objectStore('store');
            const request = storeObj.get('myPhoneData');
            
            request.onsuccess = function () {
                const savedData = request.result;
                if (savedData) {
                    Object.assign(window.store, savedData);
                    
                    // 补齐可能缺失的基础结构
                    if (!window.store.desktopItems || window.store.desktopItems.length === 0) {
                        window.store.desktopItems = defaultDesktopItems;
                    }
                    if (!window.store.apiSettings.draw) {
                        window.store.apiSettings.draw = { url: '', key: '', model: '' };
                    }
                }
                isStoreLoaded = true;
            };
            request.onerror = function () {
                isStoreLoaded = true;
            };
        })
        .catch(function (err) {
            console.warn('Failed to read DB, using default state.', err);
            isStoreLoaded = true;
        });
};

const saveData = function (data) {
    if (!isStoreLoaded) return;
    try {
        const rawData = JSON.parse(JSON.stringify(data));
        initDB()
            .then(function (db) {
                const tx = db.transaction('store', 'readwrite');
                const storeObj = tx.objectStore('store');
                storeObj.put(rawData, 'myPhoneData');
            })
            .catch(function (err) {
                console.warn('Failed to save DB', err);
            });
    } catch (err) {
        console.warn('Failed to stringify DB data', err);
    }
};

// 立即触发读取
loadData();

Vue.watch(
    window.store,
    function (newState) {
        saveData(newState);
    },
    { deep: true }
);
