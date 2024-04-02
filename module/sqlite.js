//sqlite操作类
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

/**
 * 查询单词函数
 * @param {string} name 单词名称
 * @returns Promise对象(异步)
 */
function get_word(name) {
    if (!is_connect) {
        //未连接则连接
        connect();
    }
    //异步完成
    var promise = new Promise((resolve, reject) => {
        //只需要取得第一个即可
        sqlite.each('SELECT word_ID, word_name, word_meaning, word_comment, word_times, word_times_right FROM word WHERE word_name = ? ', [name], function (err, row) {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
    return promise;
}

/**
 * 随机取出一组不重复的词
 * @param {int} num 数量
 * @returns Promise对象(异步)
 */
function get_word_random(num) {
    if (!is_connect) {
        connect();
    }
    var promise = new Promise((resolve, reject) => {
        //需要所有数据,用all
        sqlite.all(`WITH selected AS (
            SELECT * FROM word ORDER BY RANDOM() LIMIT ?
          )
          SELECT * FROM word WHERE word_ID NOT IN (SELECT word_ID FROM selected)`, [num], function (err, row) {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
    return promise;
}

/**
 * 获取某词语的做题次数和正确次数
 * @param {string} name 单词名称
 * @returns Promise对象(异步)
 */
function get_word_times(name) {
    if (!is_connect) {
        connect();
    }
    var promise = new Promise((resolve, reject) => {
        sqlite.each(`SELECT word_times,
        word_times_right
   FROM word
  WHERE word_name = ?;`, [name], function (err, row) {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
    return promise;
}

/**
 * 添加新词语
 * @param {string} name 单词名称
 * @param {string} meaning 单词意思
 * @param {string} comment 单词备注
 * @returns Promise对象(异步)
 */
function add_word(name, meaning, comment) {
    if (!is_connect) {
        connect();
    }
    var promise = new Promise((resolve, reject) => {
        sqlite.run(`INSERT INTO word (
            word_comment,
            word_meaning,
            word_name
        )
        VALUES (
            ?,
            ?,
            ?
        );`, [comment, meaning, name], function (err, row) {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
    return promise;
}

/**
 * 更新某词语做题和正确次数
 * @param {string} name 单词名称
 * @param {bool} right 是否作对
 * @returns Promise对象(异步)
 */
async function set_word_times(name, right) {
    if (!is_connect) {
        connect();
    }
    //原始数据
    var org_times = await get_word_times(name);

    if (right) {
        org_times['word_times_right'] += 1;
    }
    org_times['word_times'] += 1;

    var promise = new Promise((resolve, reject) => {
        sqlite.run(`UPDATE word
        SET word_times = ?,
            word_times_right = ?
      WHERE word_name = ?;`, [org_times['word_times'], org_times['word_times_right'], name], function (err, row) {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
    return promise;
}

//导出需要的方法
module.exports = {
    get_word: get_word,
    get_word_random: get_word_random,
    get_word_times: get_word_times,
    set_word_times: set_word_times,
    add_word: add_word
};