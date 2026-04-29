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
        if (!window.indexedDB) {
            return reject('Browser does not support IndexedDB');
        }
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

// 紧急备用：从旧版 localStorage 读取数据
const fallbackLocalLoad = function () {
    try {
        const localStr = window.localStorage.getItem('myPhoneData');
        if (localStr) {
            Object.assign(window.store, JSON.parse(localStr));
        }
    } catch (e) {}
};

// 读取数据逻辑
const loadData = function () {
    initDB()
        .then(function (db) {
            const tx = db.transaction('store', 'readonly');
            const storeObj = tx.objectStore('store');
            const request = storeObj.get('myPhoneData');
            
            request.onsuccess = function () {
                let savedData = request.result;
                
                // 【核心修复】：如果大数据库是空的，说明是第一次升级，自动去 localStorage 抢救以前的旧数据！
                if (!savedData) {
                    try {
                        const localStr = window.localStorage.getItem('myPhoneData');
                        if (localStr) {
                            savedData = JSON.parse(localStr);
                            console.log('成功从旧版 localStorage 迁移数据至大容量数据库');
                        }
                    } catch (e) {}
                }

                if (savedData) {
                    Object.assign(window.store, savedData);
                    
                    // 补齐可能缺失的基础结构，防止报错
                    if (!window.store.desktopItems || window.store.desktopItems.length === 0) {
                        window.store.desktopItems = defaultDesktopItems;
                    }
                    if (!window.store.apiSettings) {
                        window.store.apiSettings = { main: {url: '', key: '', model: ''}, sub: {url: '', key: '', model: ''}, draw: {url: '', key: '', model: ''} };
                    } else if (!window.store.apiSettings.draw) {
                        window.store.apiSettings.draw = { url: '', key: '', model: '' };
                    }
                }
                
                isStoreLoaded = true;
                // 迁移完成后，立刻保存一份到新数据库中
                if (savedData) {
                    saveData(window.store);
                }
            };
            
            request.onerror = function () {
                fallbackLocalLoad();
                isStoreLoaded = true;
            };
        })
        .catch(function (err) {
            console.warn('大容量数据库初始化失败，将降级使用旧版存储', err);
            fallbackLocalLoad();
            isStoreLoaded = true;
        });
};

// 保存数据逻辑（增加防抖和双重备份）
let saveTimeout = null;
const saveData = function (data) {
    if (!isStoreLoaded) return;
    
    // 防抖：清除上一次还没执行的保存操作，防止频繁保存把数据库卡死
    if (saveTimeout) {
        window.clearTimeout(saveTimeout);
    }
    
    try {
        // 先同步克隆一份当前的数据快照
        const rawData = JSON.parse(JSON.stringify(data));
        
        // 延迟 400 毫秒后统一执行真实写入
        saveTimeout = window.setTimeout(function () {
            initDB()
                .then(function (db) {
                    const tx = db.transaction('store', 'readwrite');
                    const storeObj = tx.objectStore('store');
                    storeObj.put(rawData, 'myPhoneData');
                    
                    // 顺便尝试在旧版 localStorage 也备份一份（如果没超限的话），增加安全性
                    try { window.localStorage.setItem('myPhoneData', JSON.stringify(rawData)); } catch (e) {}
                })
                .catch(function () {
                    // 如果大数据库彻底罢工，强制降级保存
                    try { window.localStorage.setItem('myPhoneData', JSON.stringify(rawData)); } catch (e) {}
                });
        }, 400); 
    } catch (err) {
        console.warn('数据转换出错，无法保存', err);
    }
};

// 页面隐藏/关闭前，做最后一次挣扎同步保存
window.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden' && isStoreLoaded) {
        try {
            const rawData = JSON.parse(JSON.stringify(window.store));
            window.localStorage.setItem('myPhoneData', JSON.stringify(rawData));
        } catch(e) {}
    }
});

// 立即触发读取
loadData();

Vue.watch(
    window.store,
    function (newState) {
        saveData(newState);
    },
    { deep: true }
);
