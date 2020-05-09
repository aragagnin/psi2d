# Ψ2d
 
Psi2d is a web-based and extendible multi-player and mobile-friendly 2D shooting game. The server is written in node.js and the client uses vanilla JS (and shares most of the code base with the client).

**A prototype is currently hosted at https://psi2d.itch.io/psi2d**

Whatch a game play on youtube https://www.youtube.com/watch?v=qfNqr_UtGLU:
[![psi2d game play](https://img.youtube.com/vi/qfNqr_UtGLU/0.jpg)](https://www.youtube.com/watch?v=qfNqr_UtGLU)


## Game Details

During each match (lasting 10 minutes) players run on the map and can collect life points (hearts) and ammoes (yellow circles). Player can shoot mental energy (here the name psi2d) in the form of white shells that  damage other players.

In order to make it possible for the game to easily run on mobile browsers, this (so far: but I am open to changes) is a "one-button-game": you can run and shoot with touch only. **On mobiles:** swipe on the lower side of canvas to move and jump; tap on the upper side of the canvas to shoot. **On desktops:** WAD/arrows/space to move; click to fire.

Following the guide from [valve](https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization), multiplayer games must cope with delays. For this reason the client must evolve the world while waiting for server's updates. For this reason the game is made with node.js. With node I am able to use the same exact "game" class files (as well for all js classes of dynamic elements inside the level game) and evolve the game world both in the web browser client and in the server. 

The game is  easily expandible and it is possible to add new kind of elements, level and player skills. 

So far there is only one level (made with [Tiled Map Editor](https://www.mapeditor.org) with tiles from [kenney.nl](https://kenney.nl/assets). And four characters with assets from [gameart2d.com](http://www.gameart2d.com/freebies.html)
and four characters.

## To Do

- [ ] Add more levels,
- [ ] special abilites of characters, 
- [ ] rooms 
- [ ] possibility of chat.
- [ ] improve shooting sprites
- [ ] removing delay on interactions with active elements
- [ ] write more guns and  find a way to swap it

## Game Infrastructure

A sketch of the big picture of  the game's client and server routines:

![sketch of game classes](https://i.imgur.com/z0pi54N.png)

#### The Level

Each element of a level (background blocks, ammoes, players) is a child class of `BlockBase` (see `www/level/elements.js`). 
All elements have a field `pos` (a 2-elements list) that stores the 2D position of the object.
Being the game tile-based, each static element is supposed to have an `integer` value of its coordinates. 

The class `level` (see `www/level/level.js`) contains a list of elements and players and is devoted to evolving the game state in time.
It has the following properties:
- `elements`:  list of dynamic elements in the game
- `this.time`: current time in ms of the game 
- `this.grid`: a map that points to static elements in a given position. (e.g. `grid[[1,2]]` returns a list of elements in this position). 
- `spawnpoints`: list of elements flagged to be spawn points
- `players`:   list of players in the game
- `dt`: timestep of temporal evolution

and methods:
- `screen(pos, size)`: returns all elements centered on `pos` and with a distance `size` from it.
- `simulateTo(time)`: evolves the level state up to `time` in chunks of `this.dt`: the evolution of each element is performed by calling `element.step(this.dt)`.

Elements contains a list of objects of type `Clock`. When they evolve they also evolve clocks. Clocks are useful for instance to schedule the respawn of a player, of ammoes and heart objects.

Every Element is of type `BlockBase` and must have the following properties:
- `awake`: should the level update the element
- `pos`: 2-elements list of its position in the level
- `size`: 2-elements list of its size, default `[1, 1]`
- `block`: true if it is a "floor",false if it is a background
- `trash`: element is flagged to be removed from the level - happens with bullets
- `clocks`: a list of `Clock` object
- `trash` if the element is flagged for removal (e.g. a bullet hit the wall)

The game provides various extensions of the class `BlockBase` in `www/levels/elements.js`:
- `Item`: active elements that stores ammo of life points
- `Bullet`: element that travels in constant speed and removes energy on intersection of a player. So far it is rendered as a circle. It can be changed or personalised on a gun-wise pattern.
- `Player`: stores player data.

So far I implemented only one level (see `www/level1/*json`) with (Tiled Map Editor)[https://www.mapeditor.org] and tileset from [kenney.nl](https://kenney.nl/assets).

#### The Player

Class `Player` is the most complex object: it has a system for spriting used by the client: `sprites` store `action`-spriteslist pair.
Method `load_sprite` will store a given sprite in the singleton `SpriteService`, the function `render` does render the player in a canvas and function `step` evolves it following the tutorial of the [tiny-platformer](https://github.com/jakesgordon/javascript-tiny-platformer). 

A player has a list of `guns`. So far I only implemented `SimpleGun` (in the same file) that shoot a `Bullet` in the direction of the click.

I implemented four players (see `www/players`): `Dog` (`www/players/dog.js`), `Roby` (`www/players/roby.js`), `Annette` (`www/players/annette.js`), and `Cat` (`www/players/cat.js`) with assets from [gameart2d.com](http://www.gameart2d.com/freebies.html).
So far all players have the same abilities. In the future I'd like to add different abilities per player.


####  Client-Server communication

Client and server communicates via a websocket messages are JSON messages in the form of a list containing the name of a remote procedure call (RPC) and its JSON parameters (i.e. `[rpc_name, parameter object]`).
For some events (see later) data is compressed, for instance the parameter pos becames `p`, and similar (see `www/level/utils.js` and function `zipTank(obj)` and `unzipTank(obj)` for all de-compressions a obj). The JSON `{pos:[1.,2.],fire:true}` may became the string `p1.&2.|f`.


#### The Server

The server `express` serves the static `www` folder and listening websocket (see `main.js`).

The server is capable of hosting various `rooms`, each containing a class `Game` (see `game.js`) which contains a `Level` and the association of the players and their websockets. It also has a list `broadcast` whith a list of events that must be broadcasted between players. This list is typycally set by `Clocks` (e.g. if a player dies, a clock will add to `game.broadcast` the chat message `player died.`). 

Every websocket message is forwarded to the `rpc_name` methods of static class `Interface` (implemented in `game.js`), and currently supports these methods:

- `joinRandom({name: player_name, class: player_class})`: join a random match
- `join({name: player_name, class: player_class, code:code })`: join a  match with code `code`. It calls' `setLevel(level)` to send the level to the new client.
- `getObjects(list)`: ask for a list of objects. Reply to the client with method `newElement(list)` and `newPlayer(list)` for a list of desidered serialised elements and players
- `event(obj)`: set properties `obj` of the current player. E.g. if `obj={fire:true, left:true, right:false}` then the associated player will fire, stop moving right and go left. Broadcast this change to the client via method `update`
- `ping(obj)`: re-send the same exact object to the client via method `pong(obj)`


#### The Client

The client run in the JS browser, and is implemented in the class `Client` (see `www/level/client.js`). It contains a `Level` object (`this.game`, sick name), a `GUIManager` object (see next sub session) and `Interface` class that has the RPC methods corresponding to data caming from a web socket. The `Interface` has the following methods:
- `setLevel(tank)`: a JSON serialisation of the server's main. The client will initialise a `Level` object with this data.
- `pong(tank)`: sent upon a `ping` request, the time delay is used to compute the lag.
- `newPlayer(tank)` and `newElement(tank)` are sent on requests on new elements of the level, which is updated accordingly.

The client's function `getScreen()` returns all elements nearby the current player. upon requestes of the `GUIManager` will evolve the level (i.e. call `level.simulateTo(new Date().getTime)`) while waiting for statyus updates of the server.



#### The UI

The game is run from the file `play.html`, which has the canvas that shows the level's elements.

The class `GUIManager` grabs data from the `Level` inside the `Client` and paint elements around the player in the canvas.
- `paintElement(element, context, pos)`: paint an element from the level in a given context of the canvas
- `render()`: asks the client for all'elements nearby the player by calling `client.getScreen()` 
- `askForUpdate()`: set up a interval of 100ms that asks for updates to the server.
- `ping()`: set up a interval of 5000ms to periodically ping the server
- `setKey()`: get's user' input and end it to the client

The routines that grabs clicks and touches from the canvas and sends it to the `GUIManager` are in `clientmain.js`:
- `onClick`: get clicks coordinates and ask the client to fire in that direction
- `onTouchStart`/`onTouchMove`/`onTouchEnd`: for mobiles only, save the begining of a touch: upper part of the screen fires, lower part moves
- `drawMobileCommand`: show a circle where the finger is touching, to help for better movement.

The "client main" equivalent is in `window.onload` that creates the websocket and set click and keyboard listeners.
The ws stram is piped to the `Client`'s `Interface` class in the `ws.onopen` event.


## Installing

Use `npm` to  install packages and run the `express` server:

    npm start
    
Open the browser's address `127.0.0.1:8080` to play.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details

## Acknowledgments

This game was made with node.js and thanks to the followsing free resources:

- https://www.mapeditor.org for the level editor
- http://www.gameart2d.com/freebies.html for the free character sprites;
- https://kenney.nl/assets for the tile set;
- https://github.com/jakesgordon/javascript-tiny-platformer a useful game/tutorial on platform logic;
- https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization a guide on how to cope with latency in fast muliplayer games.
- http://atrevida.comprenica.com/atrtut10.html very old but interesting tutorial on how to do move sprites efficiently
- https://code.google.com/archive/p/plar/source/default/source this is a very old (and failed) temptative of a 2D arena in Java I made back in  2008-2010
- https://store.steampowered.com/app/9180/Commander_Keen/ and http://www.shikadi.net/keenwiki/NetKeen for inspiration
