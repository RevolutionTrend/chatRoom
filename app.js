const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');

app.use('/', function (req, res, next) {
    // console.log(req.connection.remoteAddress);
    let pathname = req.path;
    if (pathname.indexOf('/api') > -1) {
        next();
    } else {
        if (pathname === '/') {
            pathname = '/index.html';
        }
        res.sendFile(__dirname + pathname);
    }
});

let users = [];
fs.readFile('docs/users.json', function (err, data) {
    if (err) {
        return console.error(err);
    }
    console.log(`data === ${data}`);
    users = JSON.parse(data);
});
let logs = [];

const today = new Date();
const logFile = 'docs/log-' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.json';
fs.open(logFile, 'w+', function (err, fd) {
    if (err) {
        console.error(err);
    }
    fs.readFile(logFile, function (error, data) {
        if (error) {
            console.error(error);
            return;
        }
        console.log(data);
        logs = data && data.indexOf('[') > -1 ? JSON.parse(data) : [];
    });
});

//在线用户
let onlineUser = {};
let onlineCount = 0;

io.on('connection', function (socket) {
    console.log(socket.handshake.address);
    console.log(socket.id);
    console.log('新用户连接');

    const address = socket.handshake.address;
    const existUser = users.find(e => e.ip === address);
    if (existUser) {
        io.emit('autoLogin', {
            id: socket.id,
            ip: address,
            username: existUser.name
        });
    }

    //监听新用户加入
    socket.on('login', function (obj) {

        socket.name = address;
        //检查用户在线列表
        if (!onlineUser.hasOwnProperty(address)) {
            onlineUser[address] = obj.username;
            //在线人数+1
            onlineCount++;
        }
        obj.ip = address;
        //广播消息
        io.emit('login', { onlineUser: onlineUser, onlineCount: onlineCount, user: obj });
        console.log(obj.username + "加入了聊天室");
        const usr = users.find(e => e.ip === address);
        if (!usr) {
            users.push({
                ip: address,
                name: obj.username
            });
        } else {
            usr.name = obj.username;
        }
        fs.writeFile('docs/users.json', JSON.stringify(users), function (err) {
            if (err) {
                console.error(err);
            }
        });
    })

    //监听用户退出
    socket.on('disconnect', function () {
        //将退出用户在在线列表删除
        if (onlineUser.hasOwnProperty(socket.name)) {
            //退出用户信息
            var obj = { username: onlineUser[socket.name] };
            //删除
            delete onlineUser[socket.name];
            //在线人数-1
            onlineCount--;
            //广播消息
            io.emit('logout', { onlineUser: onlineUser, onlineCount: onlineCount, user: obj });
            console.log(obj.username + "退出了聊天室");
        }
    })

    //监听用户发布聊天内容
    socket.on('message', function (msg) {
        const user = users.find(e => e.ip === address);
        //向所有客户端广播发布的消息
        io.emit('message', {
            id: socket.id,
            username: user.name,
            msg: msg
        });
        logs.push({
            username: user.name,
            msg: msg
        });
        fs.writeFile(logFile, JSON.stringify(logs), function (err) {
            if (err) {
                console.error(err);
            }
        });
        console.log(user.name + '说：' + msg);
    });
})
http.listen(4040, function () {
    console.log('listening on port 4040');
});