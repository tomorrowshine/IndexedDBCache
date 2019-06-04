匹配url，含义cache=true进行缓存，配合fetch请求优化数据加载

// 不支持serviceWorker则启用IndexedDB

const dbName = 'hoopoe-idb';
const tableName = 'hoopoe-idb-json';

IDB.init('hoopoe-idb', 'hoopoe-idb-json', 1, !navigator.serviceWorker)
.then(()=>{

    IDB.getDB(dbName, tableName).setItem(_url, data);

    IDB.getDB(dbName, tableName).getItem(_url).then((cacheData) => {
           
    });
})
.catch((err) => { 
    console.error(err); 
});