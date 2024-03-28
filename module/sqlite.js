//sqlite操作类]
//引入库
const sqlite3 = require('sqlite3').verbose();
var is_connect = false;
var sqlite;
function connect() {
    //尝试连接
    sqlite = new sqlite3.Database('./sql/test.db', sqlite3.OPEN_READWRITE, function (e) {
        //打开失败，抛出异常
        if (e) {
            throw e;
        }
        else {
            //标志一下已连接
            is_connect = true;
        }
    });
    //返回这个对象
    return sqlite;
}

module.exports.get_word = function get_word(name) {
    if (!is_connect) {
        //未连接则连接
        connect();
    }
    sqlite.all('SELECT word_ID, word_name, word_meaning, word_comment, word_times, word_times_right FROM word WHERE word_name = ? ', [name], function (err, row) {
        if (err) {
            return false;
        }
        console.log(row);
        console.log(typeof(row[0]));
        return Object.values(row[0]);
    })
}