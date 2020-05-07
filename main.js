/*
  Psi2d

  This file contains the executable node file to run the server.

  To run the server:

  node  rmain.js

  This file opens the HTTP sockets, host static data in the `www` folder and create rooms
  in the `servers` array.

*/

"use strict";
var version='0.1';
var compression = require('compression');
var express = require('express');
const WebSocket = require('ws');
var http = require('http');
var Game = require('./game').Game;
var Interface = require('./game').Interface;
var utils = require('./www/level/utils');
var gamep = require('./www/level/level');
var Level = gamep.Level;
var constructors = require('./www/level/constructors').c;
var app = express();
var port = process.env.PORT || 8080;

console.log('Psi2d Server ',version);

// expose `www/` folder
app.use(compression()); //use compression 
app.use(express.static(__dirname + '/www'));
const server = http.createServer(app);

/*
  list of websockets
*/
const wss = new WebSocket.Server({  server });




/* 
   The server is composed by a list of rooms. Each room has a game in it (and each game has a level).
*/
function Rooms() {    this.rooms = [];   };

/*
  Create a new matchm. By default now it is hardcoded the level1.
  Each match is identified by a uniq string `code` that can be used to act on it (e.g. cancel it, or check the winner).
  TODO: possibility to create a match with an arbitrary level.
*/
Rooms.prototype.addRoom = function(code) {
    //initialise the game inside the match


    var game = new Game()

    game.code = code
    game.servers = this
    let level_map_file = './www/level1/map4.json'
    let level_redux_file =  './www/level1/redux.json'
    let level_spritesheet_file = './www/level1/spritesheet.png'
    console.log('New game: ', level_map_file, level_redux_file, level_spritesheet_file);
    var level = generate_level(level_map_file, level_redux_file, level_spritesheet_file, './level1/spritesheet.png', constructors)
    game.setState(level);

    console.log('new Game created ', game.code);
    //setInterval(this.lock.bind(this, server), 100);//what
    this.rooms.push(game)
    return server;
}

/*
  remove a match from the list
*/
Rooms.prototype.removeRoom = function(code) {
    this.rooms = this.rooms.filter(function(m) {
        return (m.code != code);
    })
}

/*
  TODO: what?
Rooms.prototype.lock = function lock(server) {
    server.lock()
}
*/


/*
  Initialise the server with a list set of match containing one running game with the code `prova`
*/
var rooms = new Rooms();
rooms.addRoom('prova');

/*
  Interfaces are a bridg between the WebSocket and the Game.
  they converts string-like calls from the websocket to
  an actual function call to the Game or to the Level.
  They also manage the login and logout of a user in a Game.
*/
var myinterface = new Interface(rooms);

/*
  handle a new websocket
*/
wss.on('connection', function connection(ws, req) {

    console.log('New websocket from: ',ws._socket.remoteAddress);
    ws.rooms = rooms
    ws.remoteAddress = ws._socket.remoteAddress
    // handle the closure of a websocket
    ws.on('close', function(user) {
        console.log('Disconnected: %s', ws.remoteAddress);
        ws.close();

	// if the client was connected to a game, remove it.
        if (ws.server) {
            ws.server.clients = ws.server.clients.filter(function(a) {
                if (a == ws) ws.server.state.getByUid(a.player.uid).trash = true; //set this player to be trashed
                return (a != ws);
            });
        }
    });

    /*
      server sends data to the client via the function myemit.
      this function zips data before sending it.
     */
    ws.myemit = function(a, b,c) {
	if(c==true || c==undefined)	console.log('emit!',a,b);
	else	console.log('emit!',a, 'content hidden');
	let s = utils.zipTank([a,b])
	try{
	    if (ws.readyState === WebSocket.OPEN) {
		  
		ws.send(s);
	    }else{
		//shoo!
		ws.close();
		// if the client was connected to a game, remove it.
		if (ws.server) {
		    ws.server.clients = ws.server.clients.filter(function(a) {
			if (a == ws) ws.server.state.getByUid(a.player.uid).trash = true; //set this player to be trashed
			return (a != ws);
		    });
		}
		

	    }
	}catch{
	    //shoo!
	    ws.close();
	    // if the client was connected to a game, remove it.
	    if (ws.server) {
		ws.server.clients = ws.server.clients.filter(function(a) {
		    if (a == ws) ws.server.state.getByUid(a.player.uid).trash = true; //set this player to be trashed
		    return (a != ws);
		});
	    }
	    
	}
    }

    /*
      if we receive a mesage, we first unzip it,
     */
    ws.on('message', function incoming(message) {
	var o = utils.unzipTank(message);
        var f = o[0]
        var p = o[1]

        //console.log('<-', message.slice(0,100), 'f',f,'p',p)
        myinterface[f](ws, p);

    });


});

/*
  this function reads the output of Tiled Map editor ( https://www.mapeditor.org)
  and returnes an object of type Level
*/
function generate_level(mapf, tilesf, tilesetp, tilesetp_client, constructors) {

        var Block = require('./www/level/elements').Block;
        var Map = require(mapf)
        var Tiles = require(tilesf)
	//console.log(Map);
        var game = new Level();
        game.constructors = constructors
        console.log('consturctors', game.constructors)
        game.gravity = 0.00002
        game.dt = 20
        game.cname = 'Level'
        game.broadcast = []
        game.last_sp = 0
        game.clientUpdateInput = true;
        game.clientSendPosition = true
        game.applied = []
        game.finished = false
        game.maxTime = 10 * 60 * 1000;
        game.clientSendTimeWitInput = true
        game.clientSendPositionWithInput = true
        game.serverProcessInput = true;
        game.serverSendKeys = true
        game.serverLagWithDeltaT = true
        game.serverSendPositionWhenDistant = true
        game.serverBroadcastDistant = true
        game.acceptCPos = false;
        game.serverAcceptCPosIfLowerThan = 1.;
        game.err_dist = 1.
        game.err_vel = 5e-3
        game.levelSize = [Map.width, Map.height]
        console.log('size', game.levelSize)
        var b = new Block()
        b.pos = [0, 0]
        game.elements.push(b) //first element is a clock


    game.tilesetp = tilesetp_client; 
        game.fake_lag = 0
        game.fake_lag_spread = 0
	Map.properties.forEach(
	    (e)=>{if (e.name=='backgroundimage') {game.bg = e.value}}
	);
	console.log('background path: ',game.bg);
        game.tilemargin = Tiles.margin
        game.tilespacing = Tiles.spacing
        game.tilecolumns = Tiles.columns
        game.tilepixels = Tiles.tileheight
        for (var i_prop in Map) {
            game[i_prop] = Map[i_prop]
        }
        game.grid = {}
        game.tileimg = Tiles.image
        for (var i_layer in game.layers) {
	    //console.log('load layer',i_layer);
            var layer = game.layers[i_layer]
	    //console.log(layer);

	    let data_layer = {}
	    layer.properties.forEach((e)=>data_layer[e.name]=e.value);
	    //console.log('data_layer',data_layer);
            for (var i_ele in layer.data) {
		//console.log('ele', i_ele);
                var i_ele = parseInt(i_ele)
                var ele = parseInt(layer.data[i_ele]) - 1
                if (ele == -1) continue
                var tile = Tiles.tileproperties[ele]

                if (tile) {

                    var data_tile = tile

                } else {
                    var data_tile = {}
                }
		//console.log(tile);
                var x = i_ele % game.width
                var y = parseInt(i_ele / game.width)
                var o = {}
                for (var i in data_layer) {
                    o[i] = JSON.parse(JSON.stringify(data_layer[i]))
                }
		//console.log(o);
                for (var i in data_tile) {
                    o[i] = JSON.parse(JSON.stringify(data_tile[i]));
                }
		//console.log(o);
                if (!('cname' in o)) o['cname'] = 'Block'
                //try{
                try {
                    var obj = new game.constructors[o['cname']]()
                } catch (e) {
                    console.log(e);
                }
                //} catch(e){
                //	throw new Error (["impossibile creare oggetto ",o['cname']," costruttori:",JSON.stringify(game.constructors)]);
                //}
                for (i in o) {
		    
                    try {

                        obj[i] = o[i]
                    } catch (e) {
                        console.log('pos', x, y, 'tile', ele, 'i', i, 'obj', obj,'o',o)
                        throw e
                    }
                }
		//console.log(obj);
                var p = String([x, y])
                obj.pos = [x, y]
                obj.i_ele = ele
                obj.uid = game.nextUid();
                obj.size = [1, 1]
                if (obj.spawn) {
                    game.spawnpoints.push(obj.pos);
                    console.log('spawnpoint', obj.pos)
                }

                if (obj.element) {
                    game.elements.push(obj);
                    obj.static = false;
                } // console.log(obj.i_ele,obj.pos,obj.uid)}
                else {
                    if (!(p in game.grid)) game.grid[p] = [];
                    game.grid[p].push(obj)
                }
                //console.log(obj.uid)
                //console.log(obj.uid)
            }
        }
        //throw new Error()


        Object.preventExtensions(game);
        return game;
    }


// start!
server.listen(port, function listening() {
    console.log('Listening: port=%d', server.address().port);
});
