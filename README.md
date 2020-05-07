# Ψ2d
 
Psi2d is a web-based and extendible multi-player and mobile-friendly 2D shooting game.

The server is written in node.js and the client uses vanilla JS (and shares most of the code base with the client).

Levels are created with https://www.mapeditor.org.


## Getting Started

A prototype is currently hosted and running at [[https://psi2d.itch.io/psi2d]].

During each match (lasting 10 minutes) players run on the map and can collect life points (hearts) and ammoes (yellow circles). Player can shoot mental energy (here the name psi2d) in the form of white shells that  damage other players.
on mobiles: swipe on the lower side of canvas to move and jump; tap on the upper side of the canvas to shoot.
on desktops: WAD/arrows/space to move; click to fire.
The game is made with node.js. With node I am able to use the same exact "game" class files (as well for all js classes of dynamic elements inside the level game) and evolve the game world both in the web browser client and in the server.

The game is modular and one can easily add elements, level and player skills! I can make it open source if anyone is interested in co-operating with me

### Installing

Just use `npm` to  install packages and run the `express` server

    npm start

## Contributing




## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Acknowledgments

This game was made with node.js and thanks to the followsing free resources:

[[http://www.gameart2d.com/freebies.html]] for the free character sprites;
[[https://kenney.nl/assets]] for the tile set;
[[https://github.com/jakesgordon/javascript-tiny-platformer]] a useful game/tutorial on platform logic;
[[https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization]] a guide on how to cope with latency in fast muliplayer games.
[[http://atrevida.comprenica.com/atrtut10.html]] very old but interesting tutorial on how to do move sprites efficiently
