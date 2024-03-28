const path = require('path');
const express = require('express');
const router = express.Router();

//加密库
const crypto = require('crypto');

// gateway()
//   .load(path.join(__dirname, 'config'))
//   .run();

const app = express()
const port = 3000
const ver = '1.0.2'
const pass = 'Lsj123456'
//key为固定加密参数
const key = 'FhWlhusOmel3M6MkXLdsTIvGLkiEiOi40PlESBik1zLie0KzJQqLZ0OE3Feqbosl'

/**
 * 拼合json函数
 * @param {string} msg 返回码或错误
 * @param {Array} arr 数据
 * @returns 拼合后的数据
 */
function wb_json_encode(code, arr) {
  const output = JSON.stringify({ code: code, data: arr });
  return output;
}

/**
 * hmac加密
 * @param {string} src 待加密的字符串
 * @returns 加密后的字符串
 */
function wb_auth(src) {
  if (src === '' || src === undefined) return false;
  //进行摘要认证
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(src);
  return hmac.digest('hex');
}

/**
 * 检查秘钥
 * @param {string} auth 秘钥
 * @returns 是否通过校验
 */
function wb_check(auth) {
  if (auth === '') {
    //从缓存中取出
    return wb_auth(app.get('wb_src')) === wb_auth(pass);
  }
  return wb_auth(auth) === wb_auth(pass);
}

/**
 * 拦截未授权的钩子
 * @param {*} req 请求体
 * @param {*} res 返回体
 * @param {*} next 下一步
 */
function wb_auth_hook(req, res, next) {
  if (req.url.startsWith('/auth/') === true) {
    //授权接口不拦截
    next()
  } else if (wb_check('') === false) {
    res.send(wb_json_encode(401, { 'msg': 'Unauthorized' }));
    res.end();
  } else {
    next()
  }
}

//拦截路由，未授权的
router.all('*', wb_auth_hook);
//使用路由
app.use(router);

app.get('/', (req, res) => {
  res.send(wb_json_encode(404, { 'msg': 'No Route' }));
})

//版本号接口
app.get('/version', (req, res) => {
  res.send(wb_json_encode(200, { 'version': ver }));
})

//授权接口
app.get('/auth/:src', (req, res) => {
  if (wb_check(req.params.src)) {
    //授权通过
    res.send(wb_json_encode(200, {
      'src': req.params.src,
      'time': Date.now()
    }));
    //把秘钥存下来
    app.set('wb_src', req.params.src)
  }
  else {
    //授权失败
    //清空秘钥
    app.set('wb_src', '');
    res.send(wb_json_encode(401, { 'msg': 'Authorize Failed' }));
  }
})

//[测试]秘钥接口
app.get('/getkey/:pass', (req, res) => {
  res.send(wb_json_encode(402, { 'src': wb_auth(req.params.pass) }));
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})