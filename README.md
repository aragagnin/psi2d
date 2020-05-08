# Ψ2d
 
Psi2d is a web-based and extendible multi-player and mobile-friendly 2D shooting game. The server is written in node.js and the client uses vanilla JS (and shares most of the code base with the client).

**A prototype is currently hosted at https://psi2d.itch.io/psi2d**

Whatch a game play on youtube https://www.youtube.com/watch?v=qfNqr_UtGLU:
[![psi2d game play](https://img.youtube.com/vi/qfNqr_UtGLU/0.jpg)](https://www.youtube.com/watch?v=qfNqr_UtGLU)

## Game Rules

During each match (lasting 10 minutes) players run on the map and can collect life points (hearts) and ammoes (yellow circles). Player can shoot mental energy (here the name psi2d) in the form of white shells that  damage other players.
**On mobiles:** swipe on the lower side of canvas to move and jump; tap on the upper side of the canvas to shoot.
**On desktops:** WAD/arrows/space to move; click to fire.

The game is made with node.js. With node I am able to use the same exact "game" class files (as well for all js classes of dynamic elements inside the level game) and evolve the game world both in the web browser client and in the server. The game is modular and one can easily add elements, level and player skills! I can make it open source if anyone is interested in co-operating with me

So far there is only one level (made with [Tiled Map Editor](https://www.mapeditor.org) with tiles from [kenney.nl](https://kenney.nl/assets). And four characters with assets from [gameart2d.com](http://www.gameart2d.com/freebies.html)
and four characters.

## Game Infrastructure

The class `level` (see `www/level/level.js`) store a list of elements and players and evolve a game level

Each element of a level (background blocks, ammoes, players) is a child class of `BlockBase` (see `www/level/elements.js`). 
Elements contains a list of objects of type `Clock`

Every `BlockBase` has the following properties `awake` (should the level update the element), `pos` (2-elements list of its position in the level), `size` (2-elements list of its size, default `[1, 1]`), `block` (true if it is a "floor",false if it is a background), `trash` (element is flagged to be removed from the level - happens with bullets), `clocks` (a list)
        this.trash = false //when true, Game() will remove it.
        this.cname = 'BlockBase';
        this.clocks = [] //counters


The server `express` serves the static `www` folder and listening websocket (see `main.js`).
Websocket messages are JSON messages in the form of a list containing the name of a remote procedure call (RPC) and its JSON parameters (i.e. `[rpc_name, parameter object]`).
Every websocket message is forwarded to the `rpc_name` methods of static class `Interface` (implemented in `game.js`), and currently supports these methods:

- `joinRandom({name: player_name, class: player_class})`: 

## To Do

- [ ] Add more levels,
- [ ]special abilites of characters, 
- [ ] rooms 
- [ ] possibility of chat.
- [ ] improve shooting sprites

### Installing

Just use `npm` to  install packages and run the `express` server

    npm start

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Acknowledgments

This game was made with node.js and thanks to the followsing free resources:

- https://www.mapeditor.org for the level editor
- http://www.gameart2d.com/freebies.html for the free character sprites;
-  for the tile set;
- https://github.com/jakesgordon/javascript-tiny-platformer a useful game/tutorial on platform logic;
- https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization a guide on how to cope with latency in fast muliplayer games.
- http://atrevida.comprenica.com/atrtut10.html very old but interesting tutorial on how to do move sprites efficiently
