/*
 Psi2d. 
 This class initiate the websocket and connects it to a Interface class 
 (defined in client.js) which itself converts the string messages from the 
 websocket to the Client class.
 Client class is the class that store a level and all the elements in the game.

*/
"use strict";

var debug = false; //false
var host = window.document.location.host.replace(/:.*/, '');
var http_protocol = window.location.protocol.replace(/:/g, '')
var ws_protocol = 'wss'
if (http_protocol == 'http') ws_protocol = 'ws'
var ws = new WebSocket(ws_protocol + '://' + window.location.hostname + ':' + window.location.port);
var client = new Client()
var canvas = document.getElementById('canvas')
var gui = new GUIManager(client, canvas);
var myinterface = new Interface(gui);
var socket = new Socket(ws, myinterface);
client.gui = gui
client.game = new level.Level();
client.constructors = constructors.c


/*
  here below a list functions that are not closely related to the 2d arena,
  but are visual effects or help intercepting mobile/mouse events inside the 
  canvas.
*/

function getRandomArbitrary(min, max) {
    return parseInt(Math.random() * (max - min) + min);
}

var arandom = function(a) {
    return a[Math.floor((Math.random() * a.length))];
}

/*
 * get XY coordinate in terms of "game" pixel
 * from the mouse event
 */
function getXYfromE(e) {
    e.preventDefault();
    var client = gui.client

    if (client == null || client.player == null) return null
    var element = canvas;
    var offsetX = 0,
        offsetY = 0
    if (element.offsetParent) {
        do {
            offsetX += element.offsetLeft;
            offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
    }

    var x_ratio = (canvas.clientWidth / canvas.width) * client.scale
    var y_ratio = (canvas.clientWidth / canvas.height) * client.scale
    var x = (e.pageX - offsetX) - canvas.clientWidth * 0.5 - x_ratio * client.player.size[0] * 0.5
    var y = (e.pageY - offsetY) - canvas.clientHeight * 0.5 - y_ratio * client.player.size[1] * 0.5

    var absx = (e.pageX - offsetX) - canvas.clientWidth * 0.5
    var absy = (e.pageY - offsetY) - canvas.clientHeight * 0.5

    return {
        x: x,
        y: y,
        x_ratio: x_ratio,
        y_ratio: y_ratio,
        absx: absx,
        absy: absy
    }
}

/*
  converts the mouse click/touch to a fire event of 
  the client
*/
function onClick(e) {
    var xy = getXYfromE(e);
    if (xy == null) return;
    var x = xy.x;
    var y = xy.y;
    //    divDebug(["e=",e,xy ])
    gui.setKey([x, y], 'fire')
}


var touchable = is_touch_device();
var leftTouchPos = null
var leftTouchStartPos = null
var leftVector = null
var leftTouchID = -1
var touches = []

/*
* draw circle of the fires emitted by the players
*/
function drawMobileCommands(gui, client) {
    var canvas = gui.canvas
    var context = gui.canvas.getContext("2d");
    var x_ratio = (canvas.clientWidth / canvas.width)
    var y_ratio = (canvas.clientHeight / canvas.height)
    var c = context
    if (touchable) {
        for (var i = 0; i < touches.length; i++) {
            var touch = touches[i];
            if (touch.identifier == leftTouchID) {
                c.beginPath();
                c.strokeStyle = "cyan";
                c.lineWidth = 6;
                c.arc(leftTouchStartPos[0] / x_ratio, leftTouchStartPos[1] / y_ratio, 40, 0, Math.PI * 2, true);
                c.stroke();
                c.beginPath();
                c.strokeStyle = "cyan";
                c.lineWidth = 2;
                c.arc(leftTouchPos[0] / x_ratio, leftTouchPos[1] / y_ratio, 60, 0, Math.PI * 2, true);
                c.stroke();
                //c.beginPath(); 
                //c.strokeStyle = "cyan"; 
                //c.arc(leftTouchPos[0], leftTouchPos[1], 40, 0,Math.PI*2, true); 
                //c.fillText("touch id : "+touch.identifier+" x:"+leftTouchStartPos[0]+" y:"+leftTouchStartPos[1], leftTouchStartPos[0], leftTouchStartPos[1])
                //c.stroke(); 

            } else {

                c.beginPath();
                c.fillStyle = "white";
                c.fillText("touch id : " + touch.identifier + " x:" + touch.clientX + " y:" + touch.clientY, touch.clientX + 30, touch.clientY - 30);

                c.beginPath();
                c.strokeStyle = "red";
                c.lineWidth = "6";
                c.arc(touch.clientX / x_ratio, touch.clientY / y_ratio, 40, 0, Math.PI * 2, true);
                c.stroke();
            }
        }
    }
}

/*
  get the starting of a mobile touch event and decide 
  if it is a player movement (if it happens in the lower part of the canvas) 
  or a fire key event(elsewhere).

*/
function onTouchStart(e) {

    var x_ratio = (canvas.clientWidth / canvas.width)
    var y_ratio = (canvas.clientWidth / canvas.height)

    var halfHeight = canvas.height * 0.77

    for (var i = 0; i < e.changedTouches.length; i++) {
        var touch = e.changedTouches[i];
        if ((leftTouchID < 0) && (touch.clientY / y_ratio > halfHeight)) {
            console.log(1)
            leftTouchID = touch.identifier;
            leftTouchStartPos = [parseFloat(touch.clientX), touch.clientY];
            leftTouchPos = [parseFloat(touch.clientX), touch.clientY];
            leftVector = [0, 0]
            continue;
        } else {

            var fire_pos = [parseFloat(touch.clientX) - canvas.clientWidth * 0.5 - x_ratio * client.player.size[0] * 0.5,
                parseFloat(touch.clientY) - canvas.clientHeight * 0.5 - y_ratio * client.player.size[1] * 0.5
            ];

            gui.setKey(fire_pos, 'fire')

        }
    }
    touches = e.touches;

}

/*
* convert the movement of a mobile touch to game key events for moving left/right or jumping
*/
function onTouchMove(e) {
    // Prevent the browser from doing its default thing (scroll, zoom)
    e.preventDefault();

    var x_ratio = (canvas.clientWidth / canvas.width)
    var y_ratio = (canvas.clientWidth / canvas.height)
    var halfWidth = canvas.width

    for (var i = 0; i < e.changedTouches.length; i++) {
        var touch = e.changedTouches[i];
        if (leftTouchID == touch.identifier) {
            leftTouchPos = [parseFloat(touch.clientX), parseFloat(touch.clientY)];
            leftVector = [parseFloat(touch.clientX), parseFloat(touch.clientY)];
            leftVector[0] -= leftTouchStartPos[0];
            leftVector[1] -= leftTouchStartPos[1];
            var x_var = leftVector[0] / x_ratio / halfWidth
            var y_var = leftVector[1] / y_ratio / halfWidth
            if (y_var < -0.2) {
                gui.setKey(true, 'jump')
            } else {
                gui.setKey(false, 'jump')

            }
            if (Math.abs(x_var) > 0.2) {
                if (x_var > 0) {
                    gui.setKey(true, 'right')
                    gui.setKey(false, 'left')
                }
                if (x_var < 0) {
                    gui.setKey(true, 'left')
                    gui.setKey(false, 'right')
                }
            } else {
                gui.setKey(false, 'left')
                gui.setKey(false, 'right')
            }
            break;
        }
    }

    touches = e.touches;

}

/*
* close all events on mobile touch end
*/
function onTouchEnd(e) {
    touches = e.touches;

    for (var i = 0; i < e.changedTouches.length; i++) {
        var touch = e.changedTouches[i];
        if (leftTouchID == touch.identifier) {
            leftTouchID = -1;
            leftVector = [0, 0]
            gui.setKey(false, 'left')
            gui.setKey(false, 'right')
            gui.setKey(false, 'jump')
            break;
        }
    }

}

/*
* write a header that mobile users see
*/

function setCaption() {
    var pos = $("#canvas").position()
    var width = $("#canvas").outerWidth()
    if (window.innerWidth > window.innerHeight) {
        $("#mobileHeader").css({
            position: "absolute",
            top: pos.top + "px",
            left: (pos.left + width) + "px"
        }).show();
    } else {
        $("#mobileHeader").css({
            position: "initial"
        }).show();
    }
}

/*
* empty the canvas
*/
function resetCanvas() {
    console.log('Reset Canvas');
    var ccon = document.getElementById('game')
    ccon.style.width = Math.min(window.innerHeight, window.innerWidth) + "px"
    canvas.width = client.scale * client.size[0] * 2
    canvas.height = client.scale * client.size[1] * 2
    canvas.style.backgroundImage = 'url(' + client.bg + ')'
    window.scrollTo(0, 0);
    setTimeout(setCaption, 1)



}

// conversion of numerical key codes (ASCII maybe?) to commands
var KeyTable = {
    37: 'left',
    38: 'jump',
    39: 'right',
    65: 'left',
    68: 'right',
    87: 'jump',
    32: 'jump'

}


function is_touch_device() {
    try {
	document.createEvent("TouchEvent");
	return true;
    } catch (e) {
	return false;
    }
}


/*
* as soon the window opens, we initialse the mobile/mouse listeners 
*/
window.onload = function() {
     touchable =  is_touch_device();
    //    touchable=true;
    if (!touchable) {
        window.addEventListener('keydown', function(event) {
            var k = event.keyCode;
            gui.setKey(true, KeyTable[k])
        }, false);
        window.addEventListener('keyup', function(event) {
            var k = event.keyCode;
            gui.setKey(false, KeyTable[k])
        }, false);
        //	canvas.addEventListener("mouseup", onUp, false);
        //	canvas.addEventListener("mousemove", onMove, false);
        canvas.addEventListener("click", onClick, false);

    } else {
        gui.post_render = drawMobileCommands
        canvas.addEventListener('touchstart', onTouchStart, false);
        canvas.addEventListener('touchmove', onTouchMove, false);
        canvas.addEventListener('touchend', onTouchEnd, false);
    }
    window.onorientationchange = resetCanvas;
    window.onresize = resetCanvas;
    gui.onReset = resetCanvas;
}


/*
* as soon as the websocket is open we request to enter the game in a random room
*/
ws.onopen = function() {
    //    divDebug(["mobile=",isMobile()])


    //var username = arandom(usernames)+arandom(usernames)+arandom(usernames)
    //var player = arandom(players)
    var params = new URLSearchParams(location.search)
    var username = params.get('username') || prompt('Username')
    var player = params.get('class') || arandom(players)
    var room = params.get('room') || null
    if (room == null) socket.emit('joinRandom', {
        name: username,
        player: player
    });
    if (room != null) socket.emit('joinRoom', {
        room: room,
        name: username,
        player: player
    });



    console.log('------ set debug=true for messages')
    console.log('logging in..')
}
