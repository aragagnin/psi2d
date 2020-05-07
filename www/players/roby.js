"use strict";
(function(exports){


var elements = require('../level/elements');
var Player = elements.Player

function Roby(){

	Player.call(this);
	this.sprites ={
		"idle":["players/roby/Idle (1).png","players/roby/Idle (2).png","players/roby/Idle (3).png",
				"players/roby/Idle (4).png", "players/roby/Idle (5).png","players/roby/Idle (6).png",
			"players/roby/Idle (7).png","players/roby/Idle (8).png"],
"walk":["players/roby/Run (1).png","players/roby/Run (2).png","players/roby/Run (3).png",
				"players/roby/Run (4).png", "players/roby/Run (5).png","players/roby/Run (6).png",
			"players/roby/Run (7).png","players/roby/Run (8).png"],
"jump":["players/roby/Jump (1).png","players/roby/Jump (2).png","players/roby/Jump (3).png",
				"players/roby/Jump (4).png", "players/roby/Jump (5).png","players/roby/Jump (6).png",
			"players/roby/Jump (7).png","players/roby/Jump (8).png"],
"fall":["players/roby/Jump (1).png","players/roby/Jump (2).png","players/roby/Jump (3).png",
				"players/roby/Jump (4).png", "players/roby/Jump (5).png","players/roby/Jump (6).png",
			"players/roby/Jump (7).png","players/roby/Jump (8).png"],
	}
	this.size = [1,2]	
	this.cname='Roby';
	
}

Roby.prototype = Object.create(Player.prototype);
Roby.prototype.constructor = Player;

exports.Roby = Roby
})(typeof exports === 'undefined'? this['roby']={}: exports);
