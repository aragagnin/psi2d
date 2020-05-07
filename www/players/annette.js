"use strict";
(function(exports){


var elements = require('../level/elements');
var Player = elements.Player

function Annette(){

	Player.call(this);
	this.sprites ={
		"idle":["players/annette/Idle (1).png","players/annette/Idle (2).png","players/annette/Idle (3).png",
				"players/annette/Idle (4).png", "players/annette/Idle (5).png","players/annette/Idle (6).png",
			"players/annette/Idle (7).png","players/annette/Idle (8).png"],
"walk":["players/annette/Run (1).png","players/annette/Run (2).png","players/annette/Run (3).png",
				"players/annette/Run (4).png", "players/annette/Run (5).png","players/annette/Run (6).png",
			"players/annette/Run (7).png","players/annette/Run (8).png"],
"jump":["players/annette/Jump (1).png","players/annette/Jump (2).png","players/annette/Jump (3).png",
				"players/annette/Jump (4).png", "players/annette/Jump (5).png","players/annette/Jump (6).png",
			"players/annette/Jump (7).png","players/annette/Jump (8).png"],
"fall":["players/annette/Jump (1).png","players/annette/Jump (2).png","players/annette/Jump (3).png",
				"players/annette/Jump (4).png", "players/annette/Jump (5).png","players/annette/Jump (6).png",
			"players/annette/Jump (7).png","players/annette/Jump (8).png"],
	}
	this.size = [1,2]	
	this.cname='Annette';
	
}

Annette.prototype = Object.create(Player.prototype);
Annette.prototype.constructor = Player;

exports.Annette = Annette
})(typeof exports === 'undefined'? this['annette']={}: exports);
