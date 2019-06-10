var _this = this;

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/*
 * @Description: IndexedDB缓存,url 匹配到cache=true即缓存
 * @Author: licheng09
 * @Date: 2019-01-16 16:50:40
 * @LastEditors: licheng09
 * @LastEditTime: 2019-06-04 10:33:04
 */
var logPrefix = ['%cIDB', 'background: green; color: white; padding: 2px 0.5em; '.concat('border-radius: 0.5em;')];
var debug = window.location.hostname === 'localhost';

function openDB(name, table, version) {
    var request = window.indexedDB.open(name || 'osm-indexedDB', version || 1);
    return new Promise(function (resolve, reject) {
        request.onerror = function (e) {
            console.error('indexedDB init error!', e);
            reject(e);
        };
        request.onsuccess = function (e) {
            var _console;

            debug && (_console = console).log.apply(_console, logPrefix.concat(['indexedDB init success']));
            resolve(e.target.result);
        };
        request.onupgradeneeded = function (e) {
            var _console2;

            debug && (_console2 = console).log.apply(_console2, logPrefix.concat(['indexedDB update version success']));
            var db = e.target.result;
            if (!db.objectStoreNames.contains(table)) {
                var store = db.createObjectStore(table, { keyPath: 'url' });
                store.createIndex('timestamp', 'timestamp', { unique: true });
            }
        };
    });
}
function getUrl(key) {
    return (/http/.test(key) ? key : window.location.origin + key
    );
}
var myDB = {
    getStore: function getStore(db, table) {
        var transaction = db.transaction(table, 'readwrite');
        var store = transaction.objectStore(table);
        return store;
    },
    setItem: function setItem(db, table, key, value) {
        try {
            if (/cache=true/.test(key) && value) {
                var _console3;

                debug && (_console3 = console).log.apply(_console3, logPrefix.concat(['Router is responding to:', key]));
                myDB.getStore(db, table).put({ timestamp: Date.now(), url: key, data: value });
            }
        } catch (error) {
            console.error(error);
        }
    },
    getItem: function getItem(db, table, key) {
        return new Promise(function (resolve) {
            try {
                if (!/cache=true/.test(key)) {
                    resolve();
                    return;
                }
                var obj = {
                    data: {},
                    type: 'indexedDB'
                };
                myDB.getStore(db, table).get(key).onsuccess = function (e) {
                    if (e.target.result) {
                        var _console4;

                        debug && (_console4 = console).log.apply(_console4, logPrefix.concat(['Using StaleWhileRevalidate to is responding to:', key]));
                        obj.data = e.target.result.data || {};
                        resolve(obj);
                    } else {
                        var _console5;

                        debug && (_console5 = console).log.apply(_console5, logPrefix.concat(['no data', 'Using StaleWhileRevalidate to is responding to:', key]));
                        resolve();
                    }
                };
            } catch (error) {
                console.error(error);
                resolve();
            }
        });
    },
    removeItem: function removeItem(db, table, key) {
        try {
            if (/cache=true/.test(key)) {
                myDB.getStore(db, table).delete(key);
            }
        } catch (error) {
            console.error(error);
        }
    },
    close: function close(_dbName) {
        var _console6;

        // 这里并不真的关闭，只是逻辑上关闭，使其调用无效
        delete myDB[_dbName];
        debug && (_console6 = console).log.apply(_console6, logPrefix.concat([_dbName + ' Connection has already been closed']));
    },
    deleteDatabase: function deleteDatabase(_dbName) {
        var _console7;

        window.indexedDB.deleteDatabase(_dbName);
        debug && (_console7 = console).log.apply(_console7, logPrefix.concat([_dbName + ' has already delete']));
    },
    clearTable: function clearTable(db, table) {
        return new Promise(function (resolve) {
            try {
                var result = myDB.getStore(db, table).clear();
                result.onsuccess = function () {
                    var _console8;

                    resolve(true);
                    debug && (_console8 = console).log.apply(_console8, logPrefix.concat(['[' + db.name + '] table name:[' + table + '] has already clear']));
                };
            } catch (error) {
                console.error(error);
                resolve(false);
            }
        });
    }
};

var _IDB = {
    init: function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(dbName, table, version, using) {
            var db;
            return regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            if (!(window.indexedDB && using)) {
                                _context3.next = 9;
                                break;
                            }

                            _IDB.getDB = function (_dbName, _table) {
                                return {
                                    setItem: function setItem(key, value) {
                                        if (myDB[_dbName]) {
                                            myDB.setItem(myDB[_dbName], _table, getUrl(key), value);
                                        }
                                    },
                                    getItem: function () {
                                        var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(key) {
                                            var result;
                                            return regeneratorRuntime.wrap(function _callee$(_context) {
                                                while (1) {
                                                    switch (_context.prev = _context.next) {
                                                        case 0:
                                                            if (!myDB[_dbName]) {
                                                                _context.next = 5;
                                                                break;
                                                            }

                                                            _context.next = 3;
                                                            return myDB.getItem(myDB[_dbName], _table, getUrl(key));

                                                        case 3:
                                                            result = _context.sent;
                                                            return _context.abrupt('return', result);

                                                        case 5:
                                                        case 'end':
                                                            return _context.stop();
                                                    }
                                                }
                                            }, _callee, _this);
                                        }));

                                        function getItem(_x5) {
                                            return _ref2.apply(this, arguments);
                                        }

                                        return getItem;
                                    }(),
                                    removeItem: function removeItem(key) {
                                        if (myDB[_dbName]) {
                                            myDB.removeItem(myDB[_dbName], _table, getUrl(key));
                                        }
                                    },
                                    clearTable: function () {
                                        var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
                                            var result;
                                            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                                                while (1) {
                                                    switch (_context2.prev = _context2.next) {
                                                        case 0:
                                                            if (!myDB[_dbName]) {
                                                                _context2.next = 5;
                                                                break;
                                                            }

                                                            _context2.next = 3;
                                                            return myDB.clearTable(myDB[_dbName], _table);

                                                        case 3:
                                                            result = _context2.sent;
                                                            return _context2.abrupt('return', result);

                                                        case 5:
                                                        case 'end':
                                                            return _context2.stop();
                                                    }
                                                }
                                            }, _callee2, _this);
                                        }));

                                        function clearTable() {
                                            return _ref3.apply(this, arguments);
                                        }

                                        return clearTable;
                                    }()
                                };
                            };

                            _IDB.closeDB = function (_dbName) {
                                myDB.close(_dbName);
                            };
                            _IDB.deleteDB = function (_dbName) {
                                myDB.deleteDatabase(_dbName);
                            };

                            _context3.next = 6;
                            return openDB(dbName, table || 'osm-indexedDB-json', version);

                        case 6:
                            db = _context3.sent;

                            myDB[dbName] = db;
                            return _context3.abrupt('return', db);

                        case 9:
                        case 'end':
                            return _context3.stop();
                    }
                }
            }, _callee3, _this);
        }));

        function init(_x, _x2, _x3, _x4) {
            return _ref.apply(this, arguments);
        }

        return init;
    }(),
    getDB: function getDB() {
        return {
            setItem: function setItem() {},
            getItem: function () {
                var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
                    return regeneratorRuntime.wrap(function _callee4$(_context4) {
                        while (1) {
                            switch (_context4.prev = _context4.next) {
                                case 0:
                                    return _context4.abrupt('return', null);

                                case 1:
                                case 'end':
                                    return _context4.stop();
                            }
                        }
                    }, _callee4, _this);
                }));

                function getItem() {
                    return _ref4.apply(this, arguments);
                }

                return getItem;
            }(),
            removeItem: function removeItem() {},
            clearTable: function () {
                var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
                    return regeneratorRuntime.wrap(function _callee5$(_context5) {
                        while (1) {
                            switch (_context5.prev = _context5.next) {
                                case 0:
                                    return _context5.abrupt('return', null);

                                case 1:
                                case 'end':
                                    return _context5.stop();
                            }
                        }
                    }, _callee5, _this);
                }));

                function clearTable() {
                    return _ref5.apply(this, arguments);
                }

                return clearTable;
            }()
        };
    },
    closeDB: function closeDB() {},
    deleteDB: function deleteDB() {}

};

var IDB = _IDB;
// window.IDB = IDB;
export default IDB;