const host = window.location.host;
const socket = window.io('http://' + host);

$(document).ready(function () {

    const doLogin = username => {
        socket.emit('login', {
            username: username
        });
        document.getElementById('login').style.display = 'none';
        document.getElementsByClassName('typein')[0].removeAttribute('disabled');
        document.getElementsByClassName('typeBtn')[0].removeAttribute('disabled');
    }

    const encodeHtml = str => {
        let temp = str.replace(/&/g, '&amp;');
        temp = temp.replace(/\</g, '&lt;');
        temp = temp.replace(/\>/g, '&gt;');
        temp = temp.replace(/\"/g, '&quot;');
        temp = temp.replace(/\\n/g, '<br />');
        return temp;
    }

    $('.loginBtn').on('click', function () {
        const username = document.getElementById('username').value;
        console.log(`username = ${username}`);
        if (!username.trim()) {
            alert('请输入用户名！');
            return;
        }
        doLogin(username);
    });

    const sendMsg = () => {
        const text = document.getElementsByClassName('typein')[0];
        const msg = text.value.trim();
        console.log(msg);
        if (!msg) {
            alert('空消息');
            return;
        }
        socket.emit('message', msg);
        text.value = '';
    }

    $('.typeBtn').on('click', sendMsg);

    $('.typein').on('keypress', function (event) {
        if (event.ctrlKey && event.keyCode == 10) {
            sendMsg();
        }
    });

    $('.btn').on('mousedown', function () {
        this.style.backgroundColor = 'cadetblue';
    }).on('mouseup', function () {
        this.style.backgroundColor = 'darkgrey';
    });

    socket.on('autoLogin', function (obj) {
        if (socket.id === obj.id) {
            doLogin(obj.username);
        }
    });

    socket.on('login', function (obj) {
        const name = obj.user.username;
        $('#chat>tbody').append('<tr><td colspan="3" align="center" height="44"><span class="usrInOut">' + encodeHtml(name) + ' 加入了聊天室</span></td></tr>');
    });

    socket.on('logout', function (obj) {
        const name = obj.user.username;
        $('#chat>tbody').append('<tr><td colspan="3" align="center" height="44"><span class="usrInOut">' + encodeHtml(name) + ' 离开了聊天室</span></td></tr>');
    });

    socket.on('message', function (obj) {
        if (obj.id === socket.id) {
            $('#chat>tbody').append('<tr><td></td><td align="right"><span class="username">' + encodeHtml(obj.username) + '</span></td><td rowspan="2" valign="top" width="48"><img class="userIcon" src="assets/person.png" /></td></tr>');
            $('#chat>tbody').append('<tr><td></td><td align="right"><div class="message message-right">' + encodeHtml(obj.msg) + '</div></td></tr>');
        } else {
            $('#chat>tbody').append('<tr><td rowspan="2" valign="top" width="48"><img class="userIcon" src="assets/person.png" /></td><td><span class="username">' + encodeHtml(obj.username) + '</span></td><td></td></tr>');
            $('#chat>tbody').append('<tr><td><div class="message message-left">' + encodeHtml(obj.msg) + '</div></td><td></td></tr>');
        }
    });
});
