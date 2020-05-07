/*
  Psi2d constructors.

  When server sends an object to the client,
  this is a JSON data containing  a field `cname`  that indicates the class name,
  plus all properties to be passed to the constructor.

  For instance if client received a dictionary `tank`,
  it will initiate the corresponding element with the function

  my_dynamic_level_element = constructors[tank.cname](tank);

 */

"use strict";
(function(exports) {
    var elements = require('./elements');
    var gamep = require('./level');
    var cat = require('../players/cat')
    var dog = require('../players/dog')
    var roby = require('../players/roby')
    var annette = require('../players/annette')
    console.log('gamep', gamep);
    exports.c = {
        Level: gamep.Level,
        Player: elements.Player,
        Block: elements.Block,
        Item: elements.Item,
        Cat: cat.Cat,
        Dog: dog.Dog,
        Bullet: elements.Bullet,
        Roby: roby.Roby,
        Annette: annette.Annette
    }

})(typeof exports === 'undefined' ? this['constructors'] = {} : exports);
