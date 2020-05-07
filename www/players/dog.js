"use strict";
(function(exports){


var elements = require('../level/elements');
var Player = elements.Player

function Dog(){

	Player.call(this);
	this.sprites ={
		"idle":["players/dog/Idle (1).png","players/dog/Idle (2).png","players/dog/Idle (3).png",
				"players/dog/Idle (4).png", "players/dog/Idle (5).png","players/dog/Idle (6).png",
			"players/dog/Idle (7).png","players/dog/Idle (8).png"],
"walk":["players/dog/Run (1).png","players/dog/Run (2).png","players/dog/Run (3).png",
				"players/dog/Run (4).png", "players/dog/Run (5).png","players/dog/Run (6).png",
			"players/dog/Run (7).png","players/dog/Run (8).png"],
"jump":["players/dog/Jump (1).png","players/dog/Jump (2).png","players/dog/Jump (3).png",
				"players/dog/Jump (4).png", "players/dog/Jump (5).png","players/dog/Jump (6).png",
			"players/dog/Jump (7).png","players/dog/Jump (8).png"],
"fall":["players/dog/Fall (1).png","players/dog/Fall (2).png","players/dog/Fall (3).png",
				"players/dog/Fall (4).png", "players/dog/Fall (5).png","players/dog/Fall (6).png",
			"players/dog/Fall (7).png","players/dog/Fall (8).png"],
	}
	this.size = [1,2]	
	this.cname='Dog';
	
}

Dog.prototype = Object.create(Player.prototype);
Dog.prototype.constructor = Player;

exports.Dog = Dog
})(typeof exports === 'undefined'? this['dog']={}: exports);
