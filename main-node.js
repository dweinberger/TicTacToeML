// plays random TicTacTo games

// const http = require('http');
// const hostname = '127.0.0.1';
// const port = 3000;
// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('Hello World\n');
// });
// server.listen(port, hostname, () => {
//   console.log(`Server running at http://${hostname}:${port}/`);
// });

// --- STRUCTURES
/*
box: one of the 9 squares
	owner: -1,0,1
	moveNumber:move when it was played
	
	
move: 
	player
	boardStr
	moveNumber
	
game:
	gameNumber
	moves array
	winner = -1, 0, 1

games: array of all games

*/

//console.log("IN NODE XXX");

'use strict';

const fs = require('fs');


var gNumberOfGamesToPlay = 5;
var gAllTheGamesArray = [];
var gFirstMover = -1;

var gDisplayWinner = false; // show winning row
var gShowStatus = true;
var gGamesPerFile = 10000;
//var gNoWinner = 0; // how many games end in a tie?
var gMoveNumber = 0; // which move in a game
var gplayer;
var gTotal1wins = 0;
var gTotal0wins = 0;
var gTotalTies =0;
var gGameCtr = 0;
var gGames = [];
var gLoadedGames = []; // games loaded from saves
//var gutil = new Array();

// create structure
function boxstruct(winner,moveNumber,owner) {
	this.winner = winner;
	this.moveNumber = moveNumber;
	this.owner = -1;
}

var boxes = new Array();

function moveStruct(player, box, boardStr, nextBoardStr, moveNumber,winner, firstMover, movesUntilEnd, nextMove){
	this.player = player;
	this.box = box;
	this.boardStr = boardStr;
	this.nextBoardStr = nextBoardStr;
	this.moveNumber = moveNumber;
	this.winner = winner;
	this.firstMover = this.firstMover;
	this.movesUntilEnd = this.movesUntilEnd;
	this.nextMove=this.nextMove;
}

function gameStruct(index, winner, firstMover, numberOfMoves, moves){
	this.index = index;
	this.winner = winner;
	this.firstMover = firstMover;
	this.numberOfMoves = numberOfMoves;
	this.moves = moves;
}

// the eight unique rows in the square
var eightrows = new Array();
eightrows[0] = new Array(0,1,2);
eightrows[1] = new Array(3,4,5);
eightrows[2] = new Array(6,7,8);
eightrows[3] = new Array(0,4,8);
eightrows[4] = new Array(2,4,6);
eightrows[5] = new Array(0,3,6);
eightrows[6] = new Array(1,4,7);
eightrows[7] = new Array(2,5,8);


// ------- EXECUTE IT
init();

playGames();


// INIT
function init(){


	console.log("In init");
	

	gMoveNumber = 0;
	gGameCtr = 0;


	
	// global array of boxes
	for (var i=0; i < 9; i++){
		var b = new boxstruct;
		boxes.push(b);	
 	}
	console.log("Init'ed");
 	

};
console.log("after init");

// -------- PLAY ALL GAMES -----
function playGames(){
	// Play every game. 
	
	// -- Reset everything
	
	status("Resetting to play new round of games");
	gAllTheGamesArray = [];
	
	gTotal1wins = 0;
	gTotal0wins = 0;
	gTotalTies =0;
	
	var player = 0;
	//var numberofgamestoplay = $("#numberofgames").val();
	for (var x = 0; x < gNumberOfGamesToPlay; x++){
		// initialize the boxes after each game
		for (var i=0; i < 9; i++){
			boxes[i].owner = "-";
			boxes[i].moveNumber = 0;
			boxes[i].winner = -1;
		}	
		gFirstMover = player;

	
		// play a game
		status("------- Starting Game # " + x + ". Player: " + player);
		var game = playGame(x, player);
		var winner = game.winner;
		
		// finished a game
		if (winner == 0){
			gTotal0wins++;
		}
		if (winner == 1){
			gTotal1wins++;
		}
		if (winner == -1){
			gTotalTies++;
		}
		
		status("Finished Game #" + x + ". Winner: " + winner);

		status("0 wins: " + gTotal0wins + " 1 wins: " + gTotal1wins + " Ties: " + gTotalTies);
		
		// add game to the array
		gAllTheGamesArray.push(game);
		
		gGameCtr++; // increment game counter
		
		// switch the first move player
		player = (player === 0) ? 1 : 0;
	}
	
	// ---- FINISHED PLAYING ALL GAMES
	status("Finished playing " + (x + 1) + " games.");
	
	// write the file
	writeJson();
}

// -------- PLAY ONE GAME -------

function playGame(gameCtr, player){
	var done = false;
	var whichbox = -1;

	let i = 0,sq, sqIndex = 0;
	var boxwinner =-1;
	let stillPlaying = true;
	var moveCtr = 0;
	var game = new gameStruct;
	game.moves = [];
	// play the game
	while (stillPlaying){
		// set up for move
		//status("Still playing game. Player: " + player)
		var move = new moveStruct;
		move.player = player;
		move.moveNumber = moveCtr;
		// get a move, i.e., a random empty box
		var boxToPlay = getAMove();
		status("Got a move:" + boxToPlay);
		
		// if there is an available random move
		if (boxToPlay != -1){
			// mark the box as used
			boxes[boxToPlay].owner = player;
			move.boardStr = getboardString(boxToPlay);	
			status(move.boardStr);
		}
		// if there are no moves left
		else{
			stillPlaying = false;
		}
		// did someone just win?
		var winner = checkForWinner();
		if (winner > -1){
			boxes[boxToPlay].winner = player;
			stillPlaying = false;
		}
		
		// finished a move. Record it.
		//    (already recorded boardStr)
		move.firstMover = gFirstMover;
		move.player = player;
		move.box = boxToPlay;
		move.moveNumber = moveCtr;
		move.boardStr 
		
		// add 
		game.moves.push(move);
		
		// increment move counter
		moveCtr++;
		
				
		// switch the player
		player = (player === 0) ? 1 : 0;
	}
	// game is over
	
	// record game (already recorded the moves)
	game.index = gGameCtr ;
	game.winner = winner;
	game.firstMover = gFirstMover;
	game.numberOfMoves = moveCtr;
	
	// modify moves array to get next board, etc.
	var nextbrd = "";
	for (var b=0; b < moveCtr - 1; b++){
		var nbs = game.moves[b + 1].boardStr;
		game.moves[b].nextBoardStr = game.moves[b + 1].boardStr;
		game.moves[b].movesUntilEnd = game.numberOfMoves - b;
		game.moves[b].nextMove = game.moves[b + 1].box;
	}
	// null out the last label
	game.moves[moveCtr - 1].nextBoardStr = "";
	game.moves[moveCtr - 1].nextMove = -1;
		
	return game;
  }

function getAMove(){
	// get a random move
		// randomize the boxes we/
	var boxToPlay = -1;
	var squares=[0,1,2,3,4,5,6,7,8];
	squares = shuffle(squares);
	var stillLooking = true;
	var i = 0, sqi;
	while (stillLooking){
		sqi = squares[i]; // get next randomized box index
		if (boxes[sqi].owner == "-"){ // found an empty
			boxToPlay = sqi;
			stillLooking = false;
		}
		else{
			i++;
			if (i >= 9){
				stillLooking = false;
			}
		}
		
	}
	return boxToPlay;
}

function createJson(){
	
	return stringified;
}

function writeJson(){
	// writes out the json
	
	// creates json from the games global
// 		var stringified = [];
// 	for (var i=0; i < gAllTheGamesArray.length; i++){
// 		var jsn = JSON.stringify(gAllTheGamesArray[i],null, 2);
// 		stringified.push(jsn)
// 	}
	
	var jsn = JSON.stringify(gAllTheGamesArray,null, 2)
	fs.writeFile('/Users/dweinberger/Sites/TicTacToeML-master/main.js/TTT-001.json', jsn, (err) => {  
    if (err) throw err;
    console.log('Data written to file');
});  

	
}

function getboardString(box){
	// go through the boxes constructing a string,
	// one char for each box
	var str = "";
	for (var i=0; i < 9; i++){
		str = str + boxes[i].owner;	
	}
	
	
	
	// print the string as a board
	// var brd = ' <br><span style="color:white">' + str[0] + str[1] + str[2] + "<br>";
// 	brd = brd + str[3] + str[4] + str[5] + "<br>";
// 	brd = brd  + str[6] + str[7] + str[8] + "</span><br>";
// 	status(brd);
	
	var brd = str[0] + str[1] + str[2] + "\n";
	brd = brd + str[3] + str[4] + str[5] + "\n";
	brd = brd + str[6] + str[7] + str[8] + "\n";
	status(brd);
	
	
	return str;

}

function checkForWinner(){
	// go through the 8 winning rows looking for a winner
	var winner = -1;
	var done = false;
	var boxctr = 0;
	var row = 0, whichrow;
	while (done == false){
		// look at each box and count Xes and Oes
		whichrow = eightrows[row]; // get a new row  of 8
		var ones = 0, zeros = 0, owner = -1;
		for (var j = 0; j < 3; j++){
			owner = boxes[whichrow[j]].owner;
			if (owner == "0"){
				zeros++;
			}
			if (owner == "1"){
				ones++
			}
		
		}
		if (zeros == 3){
			winner = 0;
			done = true;
		}
		if (ones == 3){
			winner = 1;
			done
		}
		boxctr++;
		if (boxctr == 8){
			done = true;
		}
		row++;
		if (row > 7){
			done = true
		}
	}

	return winner;
}

// ------- SHUFFLE 
function shuffle(a){
	
	var currentIndex = a.length, tempVal, randomi;
	while (0 !== currentIndex){
		randomi = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		tempVal = a[currentIndex];
		a[currentIndex] = a[randomi];
		a[randomi] = tempVal;
	}
	return a;
}



// --------- STATUS
function status(txt){
	// $("#status").append(txt + "<br>");
	//var curtext = $("#status").text();
	console.log(txt);

}