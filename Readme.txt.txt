TO start with, this web application was developed on top of HTML5, WebGL, WebSockets.
On the client side we used Three.js, JQuery, Socket.io.
On the server side we used NodeJS as the primary dataserver and NGinX or Apache as our basic file server.

The code is structured in two folders:
		- ClientSide code("client")
		- ServerSide code("server")

Our website has an Entry Page that gives you the opportunity to play the game single Player or multi Player and a little bit of
information about it.

The code for the single player game resides in client/single.
The code for the multi player game resides in client/multi.

Single player mode code uses only HTML5 while the multi player game uses also a server infrastructure based on NodeJS.
The server code for the dataserver resides in server/app.js .


About the game:
	It is an arcade game where you can control a planet-like shere using the keyboards(Left, Right, Up and Down).
	The goal of the game is to "eat" all the smaller-then-you objects and keep away from being eaten by the bigger objects.
	Everytime you eat an object you grow up and you will be able to eat larger objects.
	The multiPlayer game consists, at the moment, of two player room where the players can play against each other.
	The synchronization is based on WebSockets and NodeJS powered WebServer.
	The game ends when you get eaten or when you are the one left.