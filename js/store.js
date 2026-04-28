/* eslint-disable */
/* eslint-env browser, es2021 */
// @ts-nocheck
'use strict';

;(function () {
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

    const getInitialState = function () {
        return {
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
    };

    window.store = window.Vue.reactive(getInitialState());
    window.isStoreLoaded = window.Vue.ref(false); 

    const DB_NAME = 'MyPhoneDB';
    const STORE_NAME = 'storeData';

    const initDB = function () {
        return new Promise(function (resolve, reject) {
            const req = window.indexedDB.open(DB_NAME, 1);
            
            // 规避 GitHub linter 对 e.target.result 的误判，直接使用 req.result
            req.onupgradeneeded = function () {
                req.result.createObjectStore(STORE_NAME);
            };
            req.onsuccess = function () {
                resolve(req.result);
            };
            req.onerror = function () {
                reject(req.error);
            };
        });
    };

    const loadData = async function () {
        try {
            const db = await initDB();
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get('myPhoneData');
            
            req.onsuccess = function () {
                let parsed = null;
                if (req.result) {
                    try { parsed = JSON.parse(req.result); } catch (err) { window.console.error(err); }
                } else {
                    const oldData = window.localStorage.getItem('myPhoneData');
                    if (oldData) {
                        try { parsed = JSON.parse(oldData); } catch (err) { window.console.error(err); }
                    }
                }
                
                if (parsed) {
                    parsed.currentApp = null;
                    Object.assign(window.store, parsed);
                }
                
                if (!Array.isArray(window.store.desktopItems) || window.store.desktopItems.length === 0) {
                    window.store.desktopItems = defaultDesktopItems;
                }
                if (!window.store.apiSettings) window.store.apiSettings = getInitialState().apiSettings;
                if (!window.store.qqData) window.store.qqData = getInitialState().qqData;
                if (!window.store.qqData.wallet) window.store.qqData.wallet = getInitialState().qqData.wallet;

                window.isStoreLoaded.value = true; 
                
                window.Vue.watch(window.store, async function (newState) {
                    try {
                        const dbConn = await initDB();
                        const writeTx = dbConn.transaction(STORE_NAME, 'readwrite');
                        writeTx.objectStore(STORE_NAME).put(JSON.stringify(newState), 'myPhoneData');
                    } catch (err) {
                        window.console.warn('IDB Save failed', err);
                    }
                }, { deep: true });
            };
            req.onerror = function () { 
                window.isStoreLoaded.value = true; 
            };
        } catch (err) {
            window.console.error('IDB load error', err);
            window.isStoreLoaded.value = true;
        }
    };

    loadData();
})();
