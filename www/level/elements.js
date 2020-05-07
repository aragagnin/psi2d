/*

  Psi2d level elements.

  This class is used both by the server and by the clients.




*/
"use strict";
(function(exports) {

    function bound(x, min, max) {
        return Math.max(min, Math.min(max, x));
    }
    var utils = require('./utils');

    /*
      Client uses this singleton to know if it already downloaded a given sprite

     */
    var SpriteService = (function() {
        function SpriteCache() {
            //if (localStorage && !localStorage.cache) localStorage.cache = {}
            //this.cache = localStorage.cache
            this.cache = {}
        }
        SpriteCache.prototype.loadImage = function(uri) {
            if (this.cache[uri]) {
                return this.cache[uri].image
            }
            var newImg = new Image();
            var that = this
            newImg.onload = function() {
                that.cache[uri].loaded = true
                that.cache[uri].image = this
            }
            this.cache[uri] = {
                loaded: false,
                image: null
            }
            newImg.src = uri
            return null;
        }
        return new SpriteCache()
    })();

/*
  a clock class is an element of a en element's  this.clocks.
  At each timestep, the level will parse the list of clocks of each elements  and
  it triggers a given event when the game simulation reaches a time `time`.
  This can be useful to trigger respawn of elements or re-activation of ammoes and hearts.
  

*/
    function Clock(event, time) {
        this.event = event
        this.time = time
        Object.preventExtensions(this);
    }
    Clock.prototype.step = function(element, game, dt) {
        if (game.debug) console.log('clock', this.time, game.time)

        if (this.time < game.time) {
        }

    };


    /*
      base class of a element of the level

*/
    function BlockBase(uid) {
        this.uid = null
        //console.log(this.uid)
        //console.log( new Error("c"))
        this.awake = true
	this.nocompress = true;
        this.test = 0
        this.pos = null
        this.size = [1, 1]
        this.block = true
        this.trash = false //when true, Game() will remove it.
        this.cname = 'BlockBase';
        this.clocks = [] //counters
        Object.preventExtensions(this);
    } //every block has a unique id.

    /*

      callback of a given timestep,
      by default it only checks for clocks
      of the element, executes (if the timing is right) and removes.

     */
    BlockBase.prototype.step = function(game, dt) {
        var element = this

        this.clocks = this.clocks.filter(function(e) {
            return !(e === undefined || e == null)
        })
        this.clocks.forEach(function(clock) {
            if (game.debug) console.log('clock', clock.time, game.time)
            //if(clock.step)	clock.step(element, game,dt);
        });
        this.clocks = this.clocks.filter(function(e) {
            if (e.event === undefined) return false
            var c = !(e.time < game.time + dt);
            if (!c) {
                e.event(element, game);
            }

            return c
        })
        //	}
    }

    /*
      updates properties of the element.
      typically used when the client
      proposes new updates.

     */
    BlockBase.prototype.update = function(p) {
        for (var i in p) this[i] = p[i]
    }

/*
  static block of a level. it can be a solid platform or a background element 
*/
    function Block() {
        this.bg = false //is it a background?
        this.static = true //is it a static element ? (if so it will be cached better by the client)
        this.i_ele = null //id of the Tiled Map editor element
        this.spawn = false //is it a spawn point?
        BlockBase.call(this) 
        this.pos = null //position
        this.cname = 'Block';
    } //every block has a unique id.
    Block.prototype.step = function(game, dt) {
        BlockBase.prototype.step.call(this, game, dt)
    }
    Block.prototype = Object.create(BlockBase.prototype);
    Block.prototype.constructor = BlockBase;

    function z(pr) {
        return function(x) {
            pr.then = x;
            console.log('loaded ', pr, x)
        }
    }

    /*
      render a block in a canvas (used by the web client)
     */
    Block.prototype.render = function(client, canvas, ctx) {
        if (this.static) {
            console.log(this);
            throw new Error(["deprecated?"])
        }
        var tile = this
        if (!client.player) return 
	var pos = [parseInt(client.player.pos[0] * client.scale), parseInt(client.player.pos[1] * client.scale)]
        var tile_i = tile.i_ele
        if (client.image == null) return
	 //the tile is pre rendered  in a separate mini canvas inside an image object in the client's hashmap client pre_render
        if (client.image && !(tile_i in client.pre_render)) {
            client.pre_render[tile_i] = {}
            var pr = client.pre_render[tile_i]
            let tpos = [tile_i % client.tilecolumns, parseInt(tile_i / client.tilecolumns)]
            pr.tile_i = tile_i
            pr.offscreen = document.createElement('canvas');
            pr.offscreen.width = client.scale;
            pr.offscreen.height = client.scale;
            pr.ctx = pr.offscreen.getContext('2d');
            pr.ctx.imageSmoothingEnabled = false
            pr.ctx.drawImage(client.image, client.tilemargin + tpos[0] * (client.tilespacing + client.tilepixels), client.tilemargin + tpos[1] * (client.tilespacing + client.tilepixels), client.tilepixels, client.tilepixels, 0, 0, client.scale, client.scale)
            pr.then = null
            console.log('set pr.then', pr, '<=>', image, tile_i);
            var image = pr.ctx.getImageData(0, 0, client.scale, client.scale);
            var that = pr
            createImageBitmap(image).then(z(pr));
        }
        var pr = client.pre_render[tile_i]
	// paint the cached tile in the canvas
        if (pr.then != null) {
            var pattern = ctx.createPattern(pr.then, "repeat");
            ctx.fillStyle = pattern;
            ctx.fillRect(-canvas.offset_x + (tile.pos[0] + client.size[0]) * client.scale - pos[0], -canvas.offset_y + (tile.pos[1] + client.size[1]) * client.scale - pos[1], client.scale, client.scale);

        }
    }



    /*
     * standard DYNAMIC element with properties as hasLife, hasAmmo or isDealdy
     */
    function Item() {
        this.hasLife = false
        this.hasAmmo = false
        this.isDeadly = false
        this.respawnTime = 3000
        this.element = true
        1
        this.value = 0 //life or ammo value
        Block.call(this);
        this.pos = null

        this.block = false
    }
    //every block has a unique id.
    Item.prototype = Object.create(Block.prototype);
    Item.prototype.constructor = Block;


    // check for intersections and decide if we have to kill, give ammo or life to a player
    Item.prototype.intersects = function(game, element) {
        if (game.isClient) return;
        //.log('intersects', this);
        if (this.isDeadly) {
            if (element.awake && element.player) {
		console.log('item ',this.uid,' at pos ',this.pos,' deadly for ',element.uid, 'pos ',element.pos)
                element.life = 0;  //kill the player
                game.broadcast.push({ //broad cast the information
                    uid: element.uid,
                    life: element.life
                })
            }
        }
        if (this.hasAmmo) {
            if (element.awake && element.player) {
                element.guns[element.igun].ammo += parseInt(this.value)
                if (element.guns[element.igun].ammo > game.maxAmmo) element.guns[element.igun].ammo = game.maxAmmo
                this.awake = false
                game.broadcast.push({
                    uid: element.uid,
                    guns: element.guns
                })
                game.broadcast.push({
                    uid: this.uid,
                    awake: this.awake
                })
		
                this.clocks.push(new Clock(function(element, game) {
                    element.awake = true;
                    game.broadcast.push({
                        uid: element.uid,
                        awake: element.awake
                    });
                }, this.respawnTime + game.time))

            }
        }
        if (this.hasLife) {
            if (element.alive && element.player) {
                element.life += this.value
                if (element.life > 1.) element.life = 1.
                this.awake = false
                game.broadcast.push({
                    uid: element.uid,
                    life: element.life
                })
                game.broadcast.push({
                    uid: this.uid,
                    awake: this.awake
                })
                this.clocks.push(new Clock(function(element, game) {
                    element.awake = true;
                    game.broadcast.push({
                        uid: element.uid,
                        awake: element.awake
                    });
                }, this.respawnTime + game.time))

            }
        }

    }

/*

  this is the the psi "bullet".
  it is rendered as a circle but it is actually an element as anything else

*/
    function Bullet(pos, vel, owner) {
        if (owner !== undefined) this.owner = owner.uid
        else this.owner = null
        this.d = vel
        this.damage = 0.1
        if (pos !== undefined) this.initial_pos = [pos[0], pos[1]]
        else this.initial_pos = null

        BlockBase.call(this);
        this.cname = 'Bullet'
        this.pos = pos
        this.size = [1, 1]
    } //every block has a unique id.


    Bullet.prototype = Object.create(BlockBase.prototype);
    Bullet.prototype.constructor = BlockBase;

/*
  evolve the buller: it just evolve linearly until it intersects something
*/
    Bullet.prototype.step = function(game, dt) {
        var entity = this
        var tx = Math.floor(entity.pos[0])
        var ty = Math.floor(entity.pos[1])
        var nx = entity.pos[0] % 1;
        var ny = entity.pos[1] % 1;

        entity.pos[0] = entity.pos[0] + dt * entity.d[0]
        entity.pos[1] = entity.pos[1] + dt * entity.d[1]
        if (entity.pos[0] < 1 || entity.pos[0] > game.width || entity.pos[1] < 1 || entity.pos[1] > game.height) this.trash = true;
        var cell = game.pgrid(tx, ty, this.size[0], this.size[1])
        var cellright = game.pgrid(tx + this.size[0], ty, 1, this.size[1])
        var celldown = game.pgrid(tx, ty + this.size[1], this.size[0], 1)
        var celldiag = game.pgrid(tx + this.size[0], ty + this.size[1], 1, 1);
        if (cell || cellright || celldown || celldiag) this.trash = true


        entity.pos[0] = Math.round(entity.pos[0] * 100) / 100
        entity.pos[1] = Math.round(entity.pos[1] * 100) / 100
        entity.d[0] = Math.round(entity.d[0] * 1e5) * 1e-5
        entity.d[1] = Math.round(entity.d[1] * 1e5) * 1e-5



    }

    // on intersect, we trah the element
    Bullet.prototype.intersects = function(game, element) {
        var owner = game.getByUid(this.owner)
        if (element.alive && element.player && element.uid != owner.uid) {
	    console.log('bullet damage to ',element.uid,'life from', element.life ,'to', element.life-this.damage);
            element.life -= this.damage;
            owner.points += 1

            game.broadcast.push({ //tell everyone about this event
                uid: owner.uid,
                points: owner.points
            })
            this.trash = true
        }
    }
    /*
      render the buller as a white circle
     */
    Bullet.prototype.render = function(client, canvas, context) {
        var game = client.game
        var x = parseInt((this.pos[0] + (this.size[0]) * 0.5) * game.scale) - game.origin[0]
        var y = parseInt((this.pos[1] + (this.size[1]) * 0.5) * game.scale) - game.origin[1]

        var ix = parseInt((this.initial_pos[0] + (this.size[0]) * 0.5) * game.scale) - game.origin[0]
        var iy = parseInt((this.initial_pos[1] + (this.size[1]) * 0.5) * game.scale) - game.origin[1]
        var d = Math.sqrt((x - ix) * (x - ix) + (-iy) * (y - iy))
        var at1 = Math.atan2(y - iy - this.size[1] * 4., x - ix - this.size[0] * 4.);
        var at2 = Math.atan2(y - iy + this.size[1] * 4., x - ix + this.size[0] * 4.);
        var t1 = Math.min(at1, at2)
        var t2 = Math.max(at1, at2)
        context.beginPath();
        context.fillStyle = 'green';
        context.arc(ix, iy, d, 0, 2 * Math.PI);
        context.stroke();
        context.closePath();
        if (d > 5) {
            context.beginPath();
            context.arc(ix, iy, d - 4, t1, t2);
            context.stroke();
            context.closePath();
        }
        context.beginPath();
        context.arc(ix, iy, d + 4, t1, t2);
        context.stroke();
        context.closePath();
    }



    /*
      our only gun: it fiers a bullet
     */
    var SimpleGun = { //game, this.guns[this.igun], this, this.fire);
        fire: function(game, data, owner, fire) {
            if (data.ammo <= 0) return;
            data.ammo = data.ammo - 1;
            var pos = [0, 0]
            var v = 1e-2
            var mfire = Math.sqrt(fire[0] * fire[0] + fire[1] * fire[1]) / v;
            var nfire = [fire[0] / mfire, fire[1] / mfire]
            pos[0] = owner.pos[0] + owner.size[0] * 0.5 - 0.5
            pos[1] = owner.pos[1] + owner.size[1] * 0.5 - 0.5
            console.log(owner.pos, pos, nfire);
            game.broadcast.push({
                uid: owner.uid,
                guns: owner.guns
            })
            var b = new Bullet(pos, nfire, owner)
            b.uid = game.nextUid();
            game.broadcast.push(['newElement', b])
            game.elements.push(b);
        }
    }

    /*
      list of avaible guns in the game
      TODO: should be more a property of the level?
     */
    var Guns = {
        'SimpleGun': SimpleGun
    }


    /*
      element player
     */
    function Player() {
        this.player = true
        this.ora = null
        this.last_direction = 0
        this.time = null
        this.points = 0
        this.sprites = {
            "idle": []
        }
        this.sprite_flags = ['single_images', 'direction_flip']
        this.cache = {}
        this.awake = true
        this.d = [0, 0]
        this.name = null
        this.maxd = [0.05, 0.05]
        this.accel = 0.00005
        this.guns = [{
            name: 'SimpleGun',
            ammo: 0
        }]
        this.igun = 0
        this.lag = null
        this.diff_time = null
        this.t = null
        this.friction = 0.01
        this.left = false;
        this.right = false;
        this.jump = false;
        this.falling = true
        this.lastp = null
        this.jumping = false;
        this.safe_lag = null
        this.impulse = 0.0115
        this.sprite = {
            name: "idle",
            i: 0,
            cache: {}
        }
        this.sprite_cache = {}
        this.alive = false
        this.respawn = 3000
        this.fire = null
        this.life = 1.;
	this.respawns=0;
	    
        this.last_direction
        this.shield = 0.4
        this.direction = 0.
        this.spos = null
        this.render_size = [2, 2]
        BlockBase.call(this);
        this.size = [1, 2]
        this.cname = 'Player';
    }



    Player.prototype = Object.create(BlockBase.prototype);
    Player.prototype.constructor = BlockBase;

    Player.prototype.getResources = function() {
        var sprites = []
        for (var k in this.sprites) {
            for (var sprite in this.sprites[k]) {
                sprites.push(sprite)
            }
        }
        return sprites;
    }

    Player.prototype.loadSprites = function(game) {
        var cache = SpriteService;
	
        if (this.direction != 0) this.last_direction = this.direction
        if (this.sprite_flags.indexOf('single_images') >= 0) {
	    for(let spriteName in this.sprites){
		let spriteset = this.sprites[spriteName];
		spriteset.forEach(function(sprite){
		    SpriteService.loadImage(sprite)

		});
	    }
        } else {
            throw new Error("unimplemented");

	    }
    }
/*
  decide which sprite to use depending on the state and on the collisions
 */
    Player.prototype.getSprite = function(game) {
        var cache = SpriteService;
        if (this.direction != 0) this.last_direction = this.direction
        if (this.sprite_flags.indexOf('single_images') >= 0) {
            this.sprite.name = 'idle'
            if (!this.jump && !this.falling && !this.jumping && Math.abs(this.d[0]) > 1e-4) this.sprite.name = 'walk'
            if (this.jumping && this.d[1] < 0) this.sprite.name = 'jump'
            if (this.falling && this.d[1] > 0) this.sprite.name = 'fall'
            var spriteset = this.sprites[this.sprite.name]
            this.sprite.i = (this.sprite.i + 1) % spriteset.length
            var i = this.sprite.i
            return SpriteService.loadImage(spriteset[i])

        } else {
            throw new Error("unimplemented");

        }
    }
/*
  a showInfo that became the render of the player in the canvas
*/
    Player.prototype.showInfo = function(client, canvas, context) {
        var game = client.game
        //if (this != client.player) return
	 if(this.pos==null || this.pos[0]==null || this.pos[1]==null) return
         if (!game) return
        var ctx = context
        var x = parseInt((this.pos[0] + (this.size[0] - this.render_size[0]) * 0.5) * game.scale) - game.origin[0]
        var y = parseInt((this.pos[1] + (this.size[1] - this.render_size[1]) * 0.5) * game.scale) - game.origin[1]
        var dx = this.render_size[0] * game.scale * 0.5
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0,255,0," + this.life + ")";
        ctx.lineWidth = parseInt(2. * this.life)
        //if (this == client.player)
	    ctx.arc(x + .5 * game.scale * this.render_size[0], y + .5 * game.scale * this.render_size[1], 1.4 * game.scale, 0, 2. * Math.PI);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.strokeStyle = "rgba(70,70,70,1)" //"rgba(0,155,155,"+(this.guns[this.igun].ammo/game.maxAmmo)+")";
        ctx.lineWidth = 2; // parseInt(2.*(this.guns[this.igun].ammo/game.maxAmmo))
        //ctx.lineTo(x+(game.scale*this.render_size[0])*this.life,y-5);
        if (this == client.player) ctx.arc(x + .5 * game.scale * this.render_size[0], y + .5 * game.scale * this.render_size[1], 1.1 * game.scale, 0, 2. * Math.PI * (this.guns[this.igun].ammo / game.maxAmmo));
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.font = "9px monospace";
        ctx.fillStyle = "black";
        ctx.fillText(this.name, x + dx - 7 * (this.name.length / 4.), y - 10);
        ctx.font = "9px monospace";
        ctx.fillStyle = "black";
        //ctx.fillText("Ammo: "+this.guns[this.igun].ammo,canvas.width-60,10); 
        if (this == client.player) ctx.fillText("Points: " + this.points, canvas.width - 60, 30);
        if (this == client.player) ctx.fillText("Lag: " + this.lag + "ms", canvas.width - 60, 40);
        if (this == client.player) ctx.fillText("Players: " + client.game.players.length, canvas.width - 60, 50);
        ctx.stroke();
        ctx.closePath();
    }
    Player.prototype.render = function(client, canvas, context) {
        if (!this.alive) return;
        var game = client.game;
        if (!client.game) return;
        var sprite = this.getSprite(game);
        this.showInfo(client, canvas, context);
        if (sprite == null) return;
        var image = sprite
	if(this.pos==null) return;
        var w = (this.render_size[0]) * game.scale
        var h = (this.render_size[1]) * game.scale
        var x = parseInt((this.pos[0] + (this.size[0] - this.render_size[0]) * 0.5) * game.scale) - game.origin[0]
        var y = parseInt((this.pos[1] + (this.size[1] - this.render_size[1]) * 0.5) * game.scale) - game.origin[1]
        if (this.sprite_flags.indexOf('direction_flip') >= 0 && this.last_direction < 0) {
            context.save();
            var horizontal = true
            var vertical = false

            context.setTransform(
                horizontal ? -1 : 1, 0, // set the direction of x axis
                0, vertical ? -1 : 1, // set the direction of y axis
                x + horizontal ? w : 0, // set the x origin
                y // set the y origin
            );
            context.drawImage(image, -x, 0, w, h)
            context.restore();
        } else {
            context.drawImage(image, x, y, w, h)
        }

    }

    /*
      player step, stolen from
      https://github.com/jakesgordon/javascript-tiny-platformer
    */
    Player.prototype.step = function(game, dt) {
	//console.log('player step0',dt, this.pos);
        BlockBase.prototype.step.call(this, game, dt)
	//console.log('player step1',dt, this.pos);

        if (this.alive != true) return;
        var entity = this;
        if (game.isServer && entity.fire != null) { //client is not going to spawn new elements in the game
            var gun = Guns[this.guns[this.igun].name]
            gun.fire(game, this.guns[this.igun], this, this.fire);
            entity.fire = null
        }
        if (entity.pos == null) return;
        var direction = Math.sign(entity.d[0])
        var keyboard_moving = 0.;
        var falling = entity.falling
        var friction = entity.friction
        var accel = entity.accel
        var tx = Math.floor(entity.pos[0])
        var ty = Math.floor(entity.pos[1])
        var nx = entity.pos[0] % 1;
        var ny = entity.pos[1] % 1;

        if (entity.right) keyboard_moving = 1.
        else if (entity.left) keyboard_moving = -1.
        /* accelerations */ //dd = dv/dt = -g
        var dd = [0., 0.]
        dd[1] = game.gravity;
        dd[0] = keyboard_moving * accel - entity.d[0] * friction;
        this.direction = keyboard_moving;



        if (entity.jump && !entity.jumping && !falling) {
            dd[1] = dd[1] - entity.impulse / dt; //impulse is a velocity
            entity.d[1] = 0
            entity.jumping = true;
        }

        entity.d[0] = bound(entity.d[0] + (dt * dd[0]), -entity.maxd[0], entity.maxd[0]);
        entity.d[1] = bound(entity.d[1] + (dt * dd[1]), -entity.maxd[1], entity.maxd[1]);
	//console.log( entity.d,'<-',dt, dd,entity.maxd);

        /* positions */

        entity.pos[0] = bound(entity.pos[0] + (dt * entity.d[0]), 1, game.width);
        entity.pos[1] = bound(entity.pos[1] + (dt * entity.d[1]), 1, game.height);

	//console.log( entity.pos,'<-',dt, entity.d, game.width, game.height);

        if (direction * keyboard_moving < 0) { //user just changed directon
            entity.d[0] = 0; // clamp at zero to prevent friction from making us jiggle side to side
        }

        var cell = game.pgrid(tx, ty, this.size[0], this.size[1])
        var cellright = game.pgrid(tx + this.size[0], ty, 1, this.size[1])
        var celldown = game.pgrid(tx, ty + this.size[1], this.size[0], 1)
        var celldiag = game.pgrid(tx + this.size[0], ty + this.size[1], 1, 1);

        if (entity.d[1] > 0) {
            if ((celldown && !cell) || (celldiag && !cellright && nx)) {
                entity.pos[1] = ty;
                entity.d[1] = 0;
                entity.falling = false;
                entity.jumping = false;
                ny = 0;
            }
        } else if (entity.d[1] < 0) {
            if ((cell && !celldown) || (cellright && !celldiag && nx)) {
                entity.pos[1] = (ty + 1);
                entity.d[1] = 0;
                cell = celldown;
                cellright = celldiag;
                ny = 0;
            }
        }

        if (entity.d[0] > 0) {
            if ((cellright && !cell) ||
                (celldiag && !celldown && ny)) {
                entity.pos[0] = (tx);
                entity.d[0] = 0;
            }
        } else if (entity.d[0] < 0) {
            if ((cell && !cellright) ||
                (celldown && !celldiag && ny)) {
                entity.pos[0] = (tx + 1);
                entity.d[0] = 0;
            }
        }
        entity.falling = !(celldown || (nx && celldiag));
        entity.pos[0] = Math.round(entity.pos[0] * 100) / 100
        entity.pos[1] = Math.round(entity.pos[1] * 100) / 100
        entity.d[0] = Math.round(entity.d[0] * 1e5) * 1e-5
        entity.d[1] = Math.round(entity.d[1] * 1e5) * 1e-5

    }

    /*
      convert input from the "device"(mouse in the client and websocket in the server)
      to a property of the player
     */
    Player.prototype.input = function(game, down, input) {
        if (game.serverProcessInput && !game.clientUpdateInput && game.isClient) return;
        this[input] = down
    }
    /*
      on respawn of a playwer, we reset tlife and everything
     */
    Player.prototype.reset = function() {
        this.alive = true;
        this.left = false;
        this.right = false;
        this.jump = false;
        this.life = 1.;
        this.shield = 0.4;
        for (var igun in this.guns) {
            var gun = this.guns[igun];
            gun.ammo = 10;
            this.clocks = []
        }
        this.igun = 0;

    }

    exports.Block = Block
    exports.Player = Player
    exports.Item = Item
    exports.Bullet = Bullet
    exports.Clock = Clock
})(typeof exports === 'undefined' ? this['elements'] = {} : exports);
