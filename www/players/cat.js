/*

  Psi2d.



*/

"use strict";
(function(exports){


var elements = require('../level/elements');
var Player = elements.Player

function Cat(){

	Player.call(this);
	this.sprites ={
		"idle":["players/cat/Idle (1).png","players/cat/Idle (2).png","players/cat/Idle (3).png",
				"players/cat/Idle (4).png", "players/cat/Idle (5).png","players/cat/Idle (6).png",
			"players/cat/Idle (7).png","players/cat/Idle (8).png"],
"walk":["players/cat/Run (1).png","players/cat/Run (2).png","players/cat/Run (3).png",
				"players/cat/Run (4).png", "players/cat/Run (5).png","players/cat/Run (6).png",
			"players/cat/Run (7).png","players/cat/Run (8).png"],
"jump":["players/cat/Jump (1).png","players/cat/Jump (2).png","players/cat/Jump (3).png",
				"players/cat/Jump (4).png", "players/cat/Jump (5).png","players/cat/Jump (6).png",
			"players/cat/Jump (7).png","players/cat/Jump (8).png"],
"fall":["players/cat/Fall (1).png","players/cat/Fall (2).png","players/cat/Fall (3).png",
				"players/cat/Fall (4).png", "players/cat/Fall (5).png","players/cat/Fall (6).png",
			"players/cat/Fall (7).png","players/cat/Fall (8).png"],
	}
	this.size = [1,2]	
	this.cname='Cat';
	
}

Cat.prototype = Object.create(Player.prototype);
Cat.prototype.constructor = Player;

exports.Cat = Cat
})(typeof exports === 'undefined'? this['cat']={}: exports);
