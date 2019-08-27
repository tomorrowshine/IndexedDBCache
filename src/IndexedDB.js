/*
 * @Description: IndexedDB缓存,url 匹配到cache=true即缓存;匹配到cache=networkFirst 网络优先，离线走缓存
 * @Author: licheng09
 * @Date: 2019-01-16 16:50:40
 * @LastEditors: licheng09
 * @LastEditTime: 2019-08-27 14:23:43
 */
const logPrefix = ['%cIDB', 'background: green; color: white; padding: 2px 0.5em; '.concat('border-radius: 0.5em;')];
const debug = window.location.hostname === 'localhost';

function openDB(name, table, version) {
    const request = window.indexedDB.open(name || 'osm-indexedDB', version || 1);
    return new Promise((resolve, reject) => {
        request.onerror = function (e) {
            console.error('indexedDB init error!', e);
            reject(e);
        };
        request.onsuccess = function (e) {
            debug && console.log(...logPrefix, 'indexedDB init success');
            resolve(e.target.result);
        };
        request.onupgradeneeded = function (e) {
            debug && console.log(...logPrefix, 'indexedDB update version success');
            const db = e.target.result;
            if (!db.objectStoreNames.contains(table)) {
                const store = db.createObjectStore(table, { keyPath: 'url' });
                store.createIndex('timestamp', 'timestamp', { unique: true });
            }
        };
    });
}
function getUrl(key) {
    return /http/.test(key) ? key : window.location.origin + key;
}
const myDB = {
    getStore: (db, table) => {
        const transaction = db.transaction(table, 'readwrite');
        const store = transaction.objectStore(table);
        return store;
    },
    setItem: (db, table, key, value) => {
        try {
            if ((/cache=true/.test(key) || /cache=networkFirst/.test(key)) && value) {
                debug && console.log(...logPrefix, 'Router is responding to:', key);
                myDB.getStore(db, table).put({ timestamp: Date.now(), url: key, data: value });
            }
        } catch (error) {
            console.error(error);
        }
    },
    getItem: (db, table, key) => new Promise((resolve) => {
        try {
            const obj = {
                data: {},
                type: 'indexedDB',
            };
            if (/cache=true/.test(key)) {
                myDB.getStore(db, table).get(key).onsuccess = function (e) {
                    if (e.target.result) {
                        debug && console.log(...logPrefix, 'Using StaleWhileRevalidate to is responding to:', key);
                        obj.data = e.target.result.data || {};
                        resolve(obj);
                    } else {
                        debug && console.log(...logPrefix, 'no data', 'Using StaleWhileRevalidate to is responding to:', key);
                        resolve();
                    }
                };
            } else if (/cache=networkFirst/.test(key) && navigator.onLine === false) {
                myDB.getStore(db, table).get(key).onsuccess = function (e) {
                    if (e.target.result) {
                        debug && console.log(...logPrefix, 'Using NetworkFirst to is responding to:', key);
                        obj.data = e.target.result.data || {};
                        resolve(obj);
                    } else {
                        debug && console.log(...logPrefix, 'no data', 'Using NetworkFirst to is responding to:', key);
                        resolve();
                    }
                };
            } else {
                resolve();
                return;
            }
        } catch (error) {
            console.error(error);
            resolve();
        }
    }),
    removeItem: (db, table, key) => {
        try {
            if (/cache=true/.test(key) || /cache=networkFirst/.test(key)) {
                myDB.getStore(db, table).delete(key);
            }
        } catch (error) {
            console.error(error);
        }
    },
    close: (_dbName) => {
        // 这里并不真的关闭，只是逻辑上关闭，使其调用无效
        delete myDB[_dbName];
        debug && console.log(...logPrefix, `${_dbName} Connection has already been closed`);
    },
    deleteDatabase: (_dbName) => {
        window.indexedDB.deleteDatabase(_dbName);
        debug && console.log(...logPrefix, `${_dbName} has already delete`);
    },
    clearTable: (db, table) => new Promise((resolve) => {
        try {
            const result = myDB.getStore(db, table).clear();
            result.onsuccess = function () {
                resolve(true);
                debug && console.log(...logPrefix, `[${db.name}] table name:[${table}] has already clear`);
            };
        } catch (error) {
            console.error(error);
            resolve(false);
        }
    }),
};

const _IDB = {
    init: async (dbName, table, version, using) => {
        if (window.indexedDB && using) {
            _IDB.getDB = (_dbName, _table) => ({
                setItem: (key, value) => {
                    if (myDB[_dbName]) {
                        myDB.setItem(myDB[_dbName], _table, getUrl(key), value);
                    }
                },
                getItem: async (key) => {
                    if (myDB[_dbName]) {
                        const result = await myDB.getItem(myDB[_dbName], _table, getUrl(key));
                        return result;
                    }
                },
                removeItem: (key) => {
                    if (myDB[_dbName]) {
                        myDB.removeItem(myDB[_dbName], _table, getUrl(key));
                    }
                },
                clearTable: async () => {
                    if (myDB[_dbName]) {
                        const result = await myDB.clearTable(myDB[_dbName], _table);
                        return result;
                    }
                },
            });

            _IDB.closeDB = (_dbName) => {
                myDB.close(_dbName);
            };
            _IDB.deleteDB = (_dbName) => {
                myDB.deleteDatabase(_dbName);
            };

            const db = await openDB(dbName, table || 'osm-indexedDB-json', version);
            myDB[dbName] = db;
            return db;
        }
    },
    getDB: () => ({
        setItem: () => { },
        getItem: async () => null,
        removeItem: () => { },
        clearTable: async () => null,
    }),
    closeDB: () => { },
    deleteDB: () => { },

};

const IDB = _IDB;
// window.IDB = IDB;
export default IDB;
