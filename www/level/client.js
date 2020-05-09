/*
 Psi2d. 

 Client class is the class that store a level and all the elements in the game.
 the Client class is enveloped inside a Interface class (defined below in this file).
 Interface that bridges websocket events to the Client class.
 Interface class includes a GUIManager instance that has a set of helper functions to display level data inside a canvas.
*/

"use strict";


var deepCopy = utils.deepCopy;
var softClone = utils.softClone
var clone = utils.clone

function Client() {
    this.game = null;
    this.server_time_offset = null; //server time minus my time.
    
    this.chat = [] //list of chat messages
    this.bg = null //bg image file name
    this.image = null //actual Image of the background
    this.app_render = true //activate the render on the canvas
    this.tilespacing = null //TiledMap data tile spacing
    this.tilemargin = null //TiledMap data 
    this.tilepixels = null //TiledMap data 
    this.size = null //2-elements list with the size of the level (in terms of TiledMap squares)
    this.tilecolumns = null
    this.player = null //our hero
    this.levelImageData = null  //images of static elements to be cached 
    this.levelImage = null //here we cache all static elements of the level in a single image for perfomances
    this.new_stuff = null //we received new elements/players from the server and keep them there until we process it
    this.dt = null //integrator dt
    this.pre_render = {} //save all sprites into canvas-images here for better rendering performances
    this.scale = null //the canvas will occupy 100% of window screen and height. here we keep the scale factor
    this.constructors = {}
    this.levelSize = null
    this.ora = 0
    this.gui = null
    this.offscreen = null
    this.offctx = null
//    this.ele_from_uid = {};
    Object.preventExtensions(this);
}
/*
  functions that can be triggered by the server
*/
Client.prototype = {
    // returns the time passed by the begining of the game:
    // it is used to evolve the level
    t: function() {
	if (this.server_time_offset == null) throw new Error("now is null")
	return new Date().getTime() - this.server_time_offset
    },
    /*
      the client received a level from the server.
      here we will initialte all objects in it
     */
    setLevel: function(data) {
        var game = data.this_state
        game.events = []
        this.dt = game.dt
        game.time = this.t();
        game.events = []
        console.log('players', data.this_state.players)
        var playeruid = data.playeruid
        console.log('rebuilding', game.elements)
        this.game = clone(game, this.constructors)
        this.rebuild();


        console.log(game)
        this.game.isServer = false;
        this.game.isClient = true;
        this.game.scale = this.scale

        this.player = this.game.getByUid(playeruid)
        this.new_stuff = []
        this.gui.run();
    }, 

    //act from an update event from the server
    // data is the dictionary sent from the server
    event: function(data) {
	console.log('event!',data);
        if (data.pos && data.uid == this.player.uid && this.player.pos == null) {
            var e = this.game.getByUid(data.uid)
            e.update(data)
        }
        if (data.alert) {
            alert(data.alert);
        }
        if (data.prompt) {
            var v = prompt.data(prompt)
            socket.emit(data.f, {
                v: data.v,
                data: data.data
            })
        }
        if (data.refresh) {
            window.location.href = window.location.href
        }
        if (data.goHome) {
            window.location.href = '/'
        }
        if (data.time) {
            console.log('server time',data.time,'now:',client.t())
        }
        if (data.c) {
            client.chat.push(data.c)
            return;
        }
        var e = null;
        if (data.uid) e = this.game.getByUid(data.uid)
        if (!e) {
	    
            socket.emit('getObjects', [data.uid]);
            return;
        }
        if (data.lag) e.lag = data.lag
        var buffer_t = this.player.lag
        if (e != null && e.uid && e.uid != this.player.uid) {
            e.update(data)
        } else {
            if (this.player.pos) {
                var p = this.game.getByUid(this.player.uid)
                p.update(data)
		
            }
        }
    },
    /* server sent an update event of an element in the game     */
    setUpdate: function(data) {
        //console.log('diff', data)
        this.new_stuff = []
        if (data.c) {
            this.chat.push(data.c)
        }
        var diff_elements = data.e;
        var diff_players = data.p;
        var forceup = false
        if (data.m && 'respawn' in data.m) forceup = true
        var ap = this.game.getByUid(client.player.uid)
        for (var i_element in diff_elements) {
            //	console.log (diff_elements[i_element])
            var e = this.game.getByUid(diff_elements[i_element].uid)
            if (e) {
                e.update(diff_elements[i_element])
            } else {
                this.new_stuff.push(diff_elements[i_element].uid)
            }
        }
        for (var i_player in diff_players) {
            var e = this.game.getByUid(diff_players[i_player].uid)
            if (e) {
                e.update(diff_players[i_player]);
            } else {
                this.new_stuff.push(diff_players[i_player].uid)
            }
        }
        this.game.time = this.t()
    },
    getScreen() {
        this.game.simulateTo(this.t(), this.dt);
        return this.game
    }
}

Client.prototype.input = function(t, v) {
    //console.log('new input',t,v)
    this.player.input(this.game, t, v)
}

Client.prototype.cloneElement = function(e) {
    var o = clone(e, this.constructors)
    return o
}

Client.prototype.rebuild = function() {
    var g = this.game
    var c = this;
//    this.ele_from_uid={}
    for (var i = 0; i < g.elements.length; i++) {
        var e = g.elements[i]
        g.elements[i] = clone(g.elements[i], this.constructors)
//	c.ele_from_uid[g.elements[i].uid]= 1; //g.grid[k][i] ;
	if(g.elements[i].uid==1505){
//	    debugger;
	}
    }
    for (var i = 0; i < g.players.length; i++) {
        var e = g.players[i]
        g.players[i] = clone(g.players[i], this.constructors)
	g.players[i].loadSprites()
    }
    var that = this
    for (var k in g.grid) {
        g.grid[k].forEach(function(b, i) {
            if (b != null) g.grid[k][i] = clone(b, that.constructors)


        });
    }
}


/*
  wrapper of the websocket, useful for debugging purposes
*/
function Socket(ws, Interface) {
    this.ws = ws
    this.Interface = Interface
    var that = this
    ws.onmessage = function(event) {
        var o = utils.unzipTank(event.data); //data is exchanged in zip format
        var f = o[0]
        var p = o[1]
        //if (debug)
	console.log('<-', f,event.data.slice(0,100))
  
	
        that.Interface[f](that, p);
    }


}


Socket.prototype.on = function(name, lambda) {
    this.my[name] = lambda
}


var crashed=false;
Socket.prototype.emit = function(a, b) {

    let s =	utils.zipTank([a,b]);
    console.log('->', s.slice(0,100))
    if(!crashed){
	if (ws.readyState === WebSocket.CLOSED) {
//	    alert('Web socket closed. Page will be reloaded soon.');
	    crashed=true;
	    window.location.href = '/';
	}else{
	    this.ws.send(s);
	}
    }

}



function Interface(gui) {
    this.gui = gui
}


function levelDone(pr) {
    return function(x) {
        pr.levelImage = x;
        console.log('loaded ', pr, x)
        setTimeout(socket.emit.bind(socket, 'spawn'), 3000)
    }
}
//mh..
function zZ(pr) {
    return function(x) {
        pr.levelImage = x;
        console.log('loaded ', pr, x)
    }
}

/*
  interface class are functions called from the server.
  each function has a parameter socket (connected to the server) 
  and tank that is the json sent from the server
*/

Interface.prototype = {
    event: function(socket, tank) {
        this.gui.client.event(tank)

    },
    // create a new level
    //
    setLevel: function(socket, tank) {
        var gui = this.gui
        var client = gui.client
        client.size = tank.size
        console.log('set size to', client.size)
        client.pre_render = {}

        client.levelSize = tank.this_state.levelSize
        client.tilecolumns = tank.this_state.tilecolumns
        client.tilepixels = tank.this_state.tilepixels
        client.tilemargin = tank.this_state.tilemargin
        client.tilespacing = tank.this_state.tilespacing
        client.game.scale = client.scale
        client.bg = tank.this_state.bg
        client.server_time_offset =   new  Date().getTime() - tank.time
        client.scale = 25
        console.log('going to set game')
        client.setLevel(tank);
        console.log('dome set game')
	
        client.image = null
        var tmpImg = new Image();
        tmpImg.src = tank.this_state.tilesetp;
        var that = client
        tmpImg.onload = function() {
            client.image = this
            client.offscreen = document.createElement('canvas');
            client.offscreen.width = that.scale * that.levelSize[0];
            client.offscreen.height = that.scale * that.levelSize[1];
            client.offctx = client.offscreen.getContext('2d');
            client.offctx.imageSmoothingEnabled = false
            for (var k in that.game.grid) {
                var l = that.game.grid[k];
                //console.log('may draw',l,l.length)
                for (var w = 0; w < l.length; w++) {
                    var tile = l[w]
                    var tile_i = tile.i_ele
                    let tpos = [tile_i % client.tilecolumns, parseInt(tile_i / client.tilecolumns)]

                    client.offctx.drawImage(client.image,
                        client.tilemargin + tpos[0] * (client.tilespacing + client.tilepixels),
                        client.tilemargin + tpos[1] * (client.tilespacing + client.tilepixels),
                        client.tilepixels, client.tilepixels,
                        tile.pos[0] * client.scale, tile.pos[1] * client.scale, client.scale, client.scale)

                }
            }
            client.levelImageData = client.offctx.getImageData(0, 0, that.scale * that.levelSize[0], that.scale * that.levelSize[1]);
            var pr = client


            createImageBitmap(client.levelImageData).then(levelDone(pr));


        };
    },
    // on pong we compute our lag
    pong: function(socket, tank) {
        var prima = tank.t;
        var ora = new Date().getTime();
	client.player.lag = ora-prima;
    },
    newElement: function(socket, tank) {
        var gui = this.gui
        var e = client.game.getByUid(tank.uid)
        if (e) {
            console.log('received two times', e)
        } else {
            client.game.elements.push(client.cloneElement(tank))
        }
    },
    newPlayer: function(socket, tank) {
        var gui = this.gui

        var e = client.game.getByUid(tank.uid)
        if (e) {
            console.log('received two times', e)
        } else {
            client.game.players.push(client.cloneElement(tank))
	    client.game.getByUid(tank.uid).loadSprites()
        }
    }
}
/*

  this function is in between UI events and the client.
for instance take all cached elements of the client and
actualy paint on a "real" canvas in the browser.
*/
function GUIManager(client, canvas) {
    this.client = client
    this.canvas = canvas
    this.askForUpdateTime = 1000
    this.onReset = function() {}
    this.lastUpdate = 0
    this.app_update = true
    this.ctx = null
    this.post_render = null;
    this.app_render = true
    Object.preventExtensions(this);
}

// paint an element on a canvas in the browser
//by calling their own render functions
GUIManager.prototype.paintElement = function(element, ctx, pos) {

    if (!element.awake) return
    if (element.static) return

    if (element.i_ele && element.render && !element.static) {
        ctx.save();
        var offset_x = canvas.offset_x
        var offset_y = canvas.offset_y
        ctx.translate(offset_x, offset_y)
        element.render(this.client, this.canvas, this.ctx)
        ctx.restore();
    } else if (element.static && client.levelImage && this.client.player.pos) {


    } else if (element.render) {
        element.render(this.client, this.canvas, this.ctx)
    } else {
        var scale = client.scale
        var e = element
        var r = [scale * (e.pos[0] + client.size[0] - pos[0]), scale * (e.pos[1] + client.size[1] - pos[1]), scale * (e.size[0]), scale * (e.size[1])]
        for (var i in r) {
            r[i] = Math.round(r[i])
        }
        ctx.rect(r[0], r[1], r[2], r[3]);
    }
}

var lastRender=null
var minRenderInterval=60;

/*
  loop on each element and render them
  additionally render the chat texts
  and player properties
*/
function render(gui, client) {
    var nowRender =  new Date().getTime()
    if(lastRender!=null && (nowRender-lastRender)<minRenderInterval) {
	requestAnimationFrame(render.bind(null, gui, client));
	return;
    }
    
    lastRender =  nowRender;
    //console.log('render', client);
    var canvas = gui.canvas
    var ctx = gui.ctx
    //while(client.locked){}
    //client.locked=true
    screen = client.getScreen()
    //    debugger;
    //client.locked=false
    if (screen && client.app_render && client.player && canvas != null && ctx != null && client.player.pos != null) {
	
        if (client.levelImage) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(-parseInt(client.player.pos[0] * client.scale - client.size[0] * client.scale), -parseInt(client.player.pos[1] * client.scale - client.size[1] * client.scale))
            ctx.drawImage(client.levelImage, 0, 0)
            ctx.restore();
        }
        var p_pos = client.player.pos
	
        var ipos = [parseInt(client.player.pos[0]), parseInt(client.player.pos[1])]
        var pos = [parseInt(client.player.pos[0] * client.scale), parseInt(client.player.pos[1] * client.scale)]
        client.game.origin = [pos[0] - client.size[0] * client.scale, pos[1] - client.size[1] * client.scale]
        //  ctx.save();os
        var offset_x = canvas.offset_x = -parseInt((p_pos[0] - ipos[0]) * client.scale)
        var offset_y = canvas.offset_y = -parseInt((p_pos[1] - ipos[1]) * client.scale)
        //ctx.translate(offset_x, offset_y)
        for (var i = ipos[0] - client.size[0] - 1; i < ipos[0] + client.size[0] + 1; i++) {
            for (var j = ipos[1] - client.size[1] - 1; j < ipos[1] + client.size[1] + 1; j++) {
                var tiles = client.game.grid[[i, j]]
		
                if (tiles) {
                    for (var k = 0; k < tiles.length; k++) {
                        var tile = tiles[k]
                        //setTimeout(
                        gui.paintElement(tile, ctx, p_pos)
                        //	,1);
                    }
                }
            }
        }
        //ctx.restore();
	
	
        screen.elements.forEach(function(player) {
            gui.paintElement(player, ctx, pos)
        });
	
        screen.players.forEach(function(player) {
            if (player.alive) {
                //setTimeout(
                gui.paintElement(player, ctx, pos)
                //,1);
            }
        });
	
	
	
        var chats = client.chat
        var neles = 5
        chats.forEach(function(chat, j) {
            if (j + 1 >= chats.length - neles){
		i = j - (chats.length - neles) + 1
		ctx.font = "15px";
		ctx.fillStyle = "black";
		ctx.strokeStyle = "white";
		ctx.fillText(chat, 0, 15 * i);
	    }

        });
        if (gui.post_render) gui.post_render(gui, client);
    } else {
        if (ctx != null && client.scale) {
            ctx.font = (client.scale) + "px Arial";
            ctx.fillStyle = "black";
            ctx.strokeStyle = "black";
            ctx.fillText("Loading...", 0, client.scale * 10);
        }
    }


    //setTimeout(render.bind(null, gui, client), 50);
    requestAnimationFrame(render.bind(null, gui, client))

}

GUIManager.prototype.render = function() {
    render(this, this.client);
}


/*
  the GUI periodically ask the server for updates
*/
GUIManager.prototype.askForUpdate = function() {
    //    console.log('this is ',this)
    //  console.log(new Error())
    if (this.app_update) {
        if (client.game.clientSendPosition) {
            var p = client.game.getByUid(client.player.uid)
	    if(p.pos!=null){//we only send data if player was initialised
		socket.emit('event', {
                    pos: p.pos,
		    respawns: p.respawns
                    //ora: client.ora
		});
	    }
	}
    }
    setTimeout(this.askForUpdate.bind(this), this.askForUpdateTime)
    this.lastUpdate = this.lastUpdate + 1
}

// ping server every 5 seconds
GUIManager.prototype.askPing = function() {
    if (this.app_update) {
	
	socket.emit('ping', {	    t: new Date().getTime()	});
	setTimeout(this.askPing.bind(this), 5000);
    }
}

// GUI main loop
GUIManager.prototype.run = function() {
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = client.scale * client.size[0] * 2
    this.canvas.height = client.scale * client.size[1] * 2
    this.canvas.style.backgroundImage = 'url(' + client.bg + ')'
    this.ctx.imageSmoothingEnabled = false //we hope
    this.askForUpdate();
    this.askPing();
    console.log('nearly running')
    this.render();
    this.update();
    this.onReset();
    console.log('running')
}

function isString(value) {
    return typeof value === 'string';
}
GUIManager.prototype.update = function() {
    setTimeout(this.askForUpdate, this.askForUpdateTime)
}


GUIManager.prototype.setKey = function(t, k) {
    var client = this.client;
    var v = null;
    if (isString(k)) v = k
   //    console.log('setKey',v,t)
    if (v != null) {

        if (client.player[v] != t) {
            var data = {}
            data[v] = t
            if (client.game.useReqId) {
                client.clientRequestId = client.clientRequestId + 1
                data.cid = client.clientRequestId
            }
            if (client.game.clientSendPositionWithInput) {
                data.pos = [client.player.pos[0], client.player.pos[1]]
            }
	    data.respawns = client.player.respawns
            /*client.player.cache[v] = t
            if (client.game.clientSendTimeWitInput) {
                data.t = client.t();
            }*/
            //data.ora = client.ora
            socket.emit('event', data)
            client.input(t, v);
        }
    }
}
