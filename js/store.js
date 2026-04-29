/* eslint-disable */
/* jshint esversion: 5, -W097 */
/* global window, Math, Date, JSON, Object */
'use strict';

var defaultDesktopItems = [
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

var initialState = {
    currentApp: null,
    desktopPages: [],
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
        wallet: { balance: 1000, history: [{ desc: '初始红包', amount: '+1000.00', time: Date.now() }] }
    }
};

window.store = window.Vue.reactive(initialState);
var isStoreLoaded = false;

var initDB = function (callback) {
    if (!window.indexedDB) { return callback('No IndexedDB', null); }
    var request = window.indexedDB.open('MyPhoneDB', 1);
    request.onerror = function () { callback(request.error, null); };
    request.onsuccess = function () { callback(null, request.result); };
    request.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains('store')) { db.createObjectStore('store'); }
    };
};

var createEmpty = function () {
    return { type: 'empty', id: 'empty_' + Math.random().toString(36).substr(2, 9), span: '1 / 1' };
};

var calcArea = function (item) {
    if (!item.span) { return 1; }
    var parts = item.span.split('/');
    if (parts.length === 2) {
        return parseInt(parts[0], 10) * parseInt(parts[1], 10);
    }
    return 1;
};

var processDataCompatible = function (savedData) {
    var i, j, k, a, item, arr;
    var p0 = [];
    var p1 = [];
    var area0 = 0;
    var area1 = 0;
    var items = savedData ? (savedData.desktopItems || defaultDesktopItems) : defaultDesktopItems;
    var validItems = [];
    var key;

    if (savedData) {
        for (key in savedData) {
            if (Object.prototype.hasOwnProperty.call(savedData, key)) {
                window.store[key] = savedData[key];
            }
        }
    }

    if (!window.store.desktopPages || window.store.desktopPages.length < 2) {
        for (i = 0; i < items.length; i++) {
            if (items[i].type !== 'empty') {
                validItems.push(items[i]);
            }
        }

        for (j = 0; j < validItems.length; j++) {
            item = validItems[j];
            a = calcArea(item);
            if (area0 + a <= 24) { 
                p0.push(item); 
                area0 += a; 
            } else if (area1 + a <= 24) { 
                p1.push(item); 
                area1 += a; 
            }
        }
        
        while(area0 < 24) { p0.push(createEmpty()); area0++; }
        while(area1 < 24) { p1.push(createEmpty()); area1++; }
        window.store.desktopPages = [p0, p1];
    } else {
        while(window.store.desktopPages.length < 2) {
            arr = [];
            for(k = 0; k < 24; k++) { arr.push(createEmpty()); }
            window.store.desktopPages.push(arr);
        }
    }
};

var loadData = function () {
    initDB(function (err, db) {
        var data = null;
        var local = null;
        if (err || !db) {
            try { 
                local = window.localStorage.getItem('myPhoneData'); 
                if (local) { data = JSON.parse(local); }
            } catch(e) { window.console.warn(e); }
            processDataCompatible(data);
            isStoreLoaded = true;
            return;
        }
        var tx = db.transaction('store', 'readonly');
        var req = tx.objectStore('store').get('myPhoneData');
        req.onsuccess = function () {
            data = req.result;
            if (!data) {
                try { 
                    local = window.localStorage.getItem('myPhoneData'); 
                    if (local) { data = JSON.parse(local); }
                } catch(e) { window.console.warn(e); }
            }
            processDataCompatible(data);
            isStoreLoaded = true;
        };
        req.onerror = function () { 
            processDataCompatible(null); 
            isStoreLoaded = true; 
        };
    });
};

var saveTimeout = null;
var saveData = function (data) {
    if (!isStoreLoaded) { return; }
    if (saveTimeout) { window.clearTimeout(saveTimeout); }
    try {
        var rawData = JSON.parse(JSON.stringify(data));
        saveTimeout = window.setTimeout(function () {
            initDB(function (err, db) {
                if (!err && db) {
                    var tx = db.transaction('store', 'readwrite');
                    tx.objectStore('store').put(rawData, 'myPhoneData');
                }
                try { window.localStorage.setItem('myPhoneData', JSON.stringify(rawData)); } catch(e) { window.console.warn(e); }
            });
        }, 500); 
    } catch (err) { window.console.warn(err); }
};

loadData();
window.Vue.watch(window.store, function (newState) { saveData(newState); }, { deep: true });
