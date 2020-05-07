/*
  Psi2d. 



*/
"use strict";
(function(exports) {

    var arandom = function(a) {        return a[Math.floor((Math.random() * a.length))]; }

    var elements = require('./www/level/elements')
    var Clock = require('./www/level/elements').Clock
    var utils = require('./www/level/utils');


    /*
      The Game class contains a level, the clients and other information to make it playable.
      This class send level updates to all players and update the level according to players movements. 
      Note that the integrator is part of the level.
     */
    function Game() {
        this.now = new Date().getTime();
	this.state = null;
        this.gameStarted = false;
        this.maxlag = 1500;
        this.size = [8, 8]
        this.code = null
        this.trash = false
        this.dt = null
        this.poses = {} //reverse lookup of poisitions
        this.servers = []
        this.diff_time = null
        this.clients = []
        this.constructors = {}
        Object.preventExtensions(this);
    }


    Game.prototype = {
	//game time. Used for integration
        t: function() {
	    return new Date().getTime() - this.now;
	},
	//initialise the game
	//with a clock that expires after 10 minuts
	//and ends the match
        setState: function(state) {
	    state.isServer = true;
	    this.constructors = state.constructors

	    state.isClient = false;
            state.elements[0].clocks.push(new Clock(function(e, game) {
		game.finished = true;
	    }, state.time + state.maxTime))
	    
	    //duration of this match
	    
	    this.state = state;
	},

        broadcastEventExceptUID: function(update) {
	    //broadcast an event to all players connected to the game. except the player UID
	    //so if one player moves, onlt the other ones get the moving update.
            this.clients.forEach(function(client) {
                if (client.debugemit && client.player.uid != update.uid) client.debugemit('event', update)
            });
        },

        broadcastEvent: function(update, force) {
            if (force === undefined) force = false
            var f = 'event'
            var d = update
            if (update[0] == 'newElement') {
                f = update[0];
                d = update[1];
                if (!force) return
            }
            this.clients.forEach(function(client) {
                if (client.debugemit) client.debugemit(f, d)
            });
        },
	//simulate the level up to time `time`
        simulateTo: function(time) {
            var dt = this.state.dt
	    if (time < this.state.time) {
		throw new Error(["we will not simulate to the past","time",time,"this.state.time",this.state.time]);
	    }
	    this.state.simulateTo(time);
	    console.log('Game to: ',time);
	},
	broadcastEventTo: function(update, uid) {
            this.clients.forEach(function(client) {
                if (client.debugemit && client.player.uid == uid) client.debugemit('event', update)
            });
        },
        cloneState: function(time) {
            return this.state.cloneState(this.constructors[this.state.cname])

        },
	//a new player entered the game
        addPlayer: function(player) {
            this.state.players.push(player)
            var game = this.state
            player.uid = this.state.nextUid();
            console.log('adding player', player.uid, 'adding player')
            game.broadcast.push({ //spread the information about the new player in the chat
                c: player.name + ' joined the match'
            })

        },
    }


    function Interface(data) {
        this.rooms_class = data
	this.room_counter=0;
    }

    Interface.prototype = {
	//user wants to join a random room
        joinRandom: function(client, tank) {
            var room = null;
	    console.log('joining a random room');
	    while(room==null){
		let my_room  = arandom(this.rooms_class.rooms);
		if (my_room.trash==false){
		    room = my_room;
		}
	    }
	    
	    console.log('Room:', room.code);
            tank.code = room.code //set the code of a random room
            console.log('New player: ', tank);
            this.joinRoom(client, tank) //join said room

        },
	// a new user joind the room
        joinRoom: function(client, tank) {
	    //first search for the room with code tank.code
            var server = null;
            this.rooms_class.rooms.forEach(function(m) {
                if (m.code == tank.code) {
                    server = m

                }
            });

	    if(server.trash){
		client.debugemit('event', {alert:'Room in the process of being garbage collected. Try again.'})
		return;
	    }
	    
	    // create a websocket wrapper, for debug purposes 
            client.debugemit = function(a, b,c) {
		
                this.myemit(a, b,c)
            }
	    console.log('server is', tank.code, server.code);
	    
            if (server == null) {
                client.debugemit('event', {
                    alert: 'invalid room name :(',
                    goHome: true
                })
                return;
            }
            try {
                client.player = new server.constructors[tank.player]()
            } catch (e) {
                console.log('unable to create new player of class', tank.player, ' classes:', JSON.stringify(server.constructors))
                return;
            }

	    // if we could create the user, then set its properties
            client.joined = true
            client.player.name = tank.name
            client.server = server
            client.spawned = false
            client.server.clients.push(client); //add this client to the clients in the match
            server.addPlayer(client.player)
            
	    
	    var t = client.server.t();
	    client.server.simulateTo(t);
	    var ora2 = client.server.t()
	    client.server.simulateTo(ora2)
	    // send the level data to the new player
            client.debugemit('setLevel', {
                this_state: server.state,
                playeruid: client.player.uid,
                dt: client.server.dt,
		code:this.code,
		time: server.state.time,
                size: client.server.size,
            }, false);
	    client.server.simulateTo( client.server.t());


        },
	//client asks for a list of objects whose UIDs are inside
	//tank list
        getObjects: function(client, tank) {
            if (!client.joined) {
                client.close();
                return
            }
            var new_elements = [];
            var game = client.server.state
	    if (tank===undefined || tank==null || tank.length===undefined){
		client.debugemit('event',{alert: 'tank must be an array'});
		return;
	    }
            for (var i = 0; i < tank.length; i++) {
                var e = game.getByUid(tank[i])
                if (game.elements.indexOf(e) >= 0) {
                    client.debugemit('newElement', e)
                };
                if (game.players.indexOf(e) >= 0) {
                    client.debugemit('newPlayer', e)
                };
            }
        },
	//client request to spawn
        spawn: function(client, tank) {
            var server = client.server
            if (!client.spawned) {
                client.spawned = false
                var game = client.server.state
                var p = game.getByUid(client.player.uid);
                game.spawn(p)
                client.debugemit('event', p, false)
            } else {
                client.debugemit('event', { // if user ask for double-spawn  maybe we should kick it
                    alert: "please stop it."
                })
            }

        },
	//client ping
	ping: function(client, tank){
	    client.debugemit('pong', tank); //hopefully client set us the time and will do the difference

	},
	// client requests its own position
        getPosition: function(client, tank2) {
	    console.log('');
            if (!client.joined) {
                client.close();
                return
            }
	    let server = client.server;
            server.simulateTo( client.server.t());

	    let level = server.state;
	    var p0 = level.getByUid(client.player.uid);
	    if(p0){
		client.debugemit('event', {uid:p0.uid, pos:p0.pos})
	    }
	    
	},
	/*
	  client sent an update json of its properties (e.g. move left) inside tank2
	 */
        event: function(client, tank2) {
	    console.log('');
            if (!client.joined) {
                client.close();
                return
            }
	    


	    let server = client.server;
	    let level = server.state;
	    var p0 = level.getByUid(client.player.uid);

	    if (p0!==undefined && p0.pos!=null && (isNaN(p0.pos[0])||isNaN(p0.pos[1]))){
		console.log(player);
		throw "event: pos is nan";
	    }
	    
	    server.simulateTo( client.server.t());
	    console.log('uid:', client.player.uid,'alive?',p0.alive, 'respawns', p0.respawns, 'game time:', level.time, 'tank:',tank2);

	    level.broadcast = level.broadcast.filter(function(u) {
		server.broadcastEvent(u, true);
		return false;
	    })

	    if(p0.alive && p0.respawns==tank2.respawns){
		p0.update(tank2);
		tank2.uid = client.player.uid;
		client.server.simulateTo( client.server.t());
		server.broadcastEventExceptUID(tank2)
	    }

	    client.server.simulateTo( client.server.t());
	    
	    level.broadcast = level.broadcast.filter(function(u) {
		server.broadcastEvent(u, true);
		return false;
	    })
	    /*
	      if the finished flag in level is raised
	      (from the Clock objects added in the creation of it)
	      we show the top 10 playersm kick everyone out
	      and start a new match
	     */
	    if (level.finished) {
		var state = []
		var players = level.players.slice(0)
		players.sort(function(p1, p2) {
		    return p1.points - p2.points
		});
		var top10players = players.slice(0, 10)
		var str = 'Game finished\n'
		str += 'Top 10 players:\n'
		top10players.forEach(function(p) {
		    str += p.name + ' points:' + p.points +  '\n'
		});
		str += '\n'
		str += 'gg!\n'
		str += '\n'
		server.broadcastEvent({
		    alert: str,
		    goHome: true,
		    nocompress:true
		})
		server.clients.forEach(function(c) {
		    c.close();
		});
		server.servers.removeRoom(this.code)
		this.room_counter+=1;
		server.servers.addRoom('ciaoPippo'+this.room_counter.toString())
		server.trash = true

	    }
	    console.log('');
	    
        }
    };

    exports.Game = Game
    exports.Interface = Interface
})(typeof exports === 'undefined' ? this['server'] = {} : exports);
