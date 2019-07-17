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

//  node --inspect /Users/dweinberger/Sites/TicTacToeML-master/main-node.js 


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
var gFilename = "./trainer/json/TTT-101.json";
var gNumberOfGamesToPlay = 101;
var gAllTheGamesArray = [];
var gAttemptedGamesCtr = 0; // includes tied games (not recorded)
var gFirstMover = 0;

var gDisplayWinner = false; // show winning row
var gShowStatus = true;
var gGamesPerFile = 10000;
//var gNoWinner = 0; // how many games end in a tie?
var gMoveNumber = 0; // which move in a game
var gplayer;
var gTotal1wins = 0;
var gTotal0wins = 0;
var gTotalTies =0;
var gUsableGamesCtr = 0;
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

function moveStruct(player,box,boardStr, nextBoardStr,moveNumber,winner,firstMover,movesUntilEnd,nextMove){
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
eightrows[0] = new Array(0,1,2); // row 1
eightrows[1] = new Array(3,4,5); // row 2
eightrows[2] = new Array(6,7,8); // row 3
eightrows[3] = new Array(0,4,8); // diag 1
eightrows[4] = new Array(2,4,6); // diag 2
eightrows[5] = new Array(0,3,6); // col 1
eightrows[6] = new Array(1,4,7); // col 2
eightrows[7] = new Array(2,5,8); // col 3


// ------- EXECUTE IT
init();

playGames();


// INIT
function init(){


	console.log("In init");
	

	gMoveNumber = 0;
	gUsableGamesCtr = 0;


	
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
	gFirstMover = 0;
	
	
	// -- PLAY GAMES
	//var numberofgamestoplay = $("#numberofgames").val();
	while (gUsableGamesCtr < gNumberOfGamesToPlay){
		
		// initialize the boxes after each game
		for (var i=0; i < 9; i++){
			boxes[i].owner = "-";
			boxes[i].moveNumber = 0;
			boxes[i].winner = -1;
			boxes[i].boardStr = "---------";
			boxes[i].nextBoardStr = "---------";
			
		}	
		//gFirstMover = player;

	
		// -- play a game
		status("------- Starting Game # " + gUsableGamesCtr + ". FirstMover: " + gFirstMover);
		var game = playGame(gUsableGamesCtr, gFirstMover);
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
		
		status("Finished Game #" + gUsableGamesCtr + ". Winner: " + winner + " FirstMover:" + gFirstMover);

		status("O wins: " + gTotal0wins + ". X wins: " + gTotal1wins + ". Ties: " + gTotalTies);
		
		// add game to the array IF O or X WON
		if (winner > -1){
			gAllTheGamesArray.push(game);
			gUsableGamesCtr++; // increment game counter
		}
		
		// how games have we tried overall, including ties?
		gAttemptedGamesCtr++;
		
		// switch the first move player
		gFirstMover = (gFirstMover === 0) ? 1 : 0;
	}
	
	// ---- FINISHED PLAYING ALL GAMES
	status("O has won " + (gUsableGamesCtr + 1) + " times, out of " + gAttemptedGamesCtr + " attempts.");
	
	// write the file
	writeJson();
}

// -------- PLAY ONE GAME -------

function playGame(gameCtr, player){
	// player is gFirstMover
	status("Starting Game#" + gameCtr + "with player " + player + " starting");
	var done = false;
	var whichbox = -1;

	let i = 0,sq, sqIndex = 0;
	var boxwinner =-1;
	let stillPlaying = true;
	var moveCtr = 1; // 0th is blank board
	var game = new gameStruct;
	game.moves = [];
	// add an initial blank board
		var move = new moveStruct;
		move.moveNumber = 0;
		move.boardStr = "---------";
		move.player = -1;
		move.box = -1;
		game.moves[0] = move;
	
	// play the game
	while (stillPlaying){
		// set up for move
		//status("Still playing game. Player: " + player)
		var move = new moveStruct;
		move.player = player;
		move.moveNumber = moveCtr;
		// get a move, i.e., a random empty box
		var boxToPlay = getAMove();
		//status("Got a move: " + boxToPlay);
		
		// if there is an available random move
		if (boxToPlay != -1){
			// mark the box as used
			boxes[boxToPlay].owner = player;
			move.boardStr = getboardString(boxToPlay);	
			//status(move.boardStr);
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
		
		
		// add 
		game.moves.push(move);
		
		// increment move counter
		moveCtr++;
		
		// switch player
		player = (player === 0) ? 1 : 0;

	}
	// game is over
	
	// record game (already recorded the moves)
	game.index = gUsableGamesCtr ;
	game.winner = winner;
	game.firstMover = gFirstMover;
	game.numberOfMoves = moveCtr;
	
	// modify game.moves array to get next board, etc.	
	for (var b=0; b < moveCtr; b++){
		game.moves[b].movesUntilEnd = game.numberOfMoves - (b + 1);
		if (b < (moveCtr -1)){
			var nextbs = game.moves[b + 1].boardStr;
			game.moves[b].nextMove = game.moves[b + 1].box;
			game.moves[b].nextBoardStr = nextbs;
		}
		game.moves[b].winner = winner;
	}
	// null out the last label
	game.moves[moveCtr - 1].nextBoardStr = "";
	game.moves[moveCtr - 1].nextMove = -1;
	
		
	return game;
  }

function getAMove(){
	// get a random move
	// randomize the boxes we
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
	fs.writeFile(gFilename, jsn, (err) => { 
    if (err) throw err;
    console.log('Data written to file');
});  

	
}

function getboardString(box){
	// go through the boxes constructing a string,
	// one char for each box
	var str = "", ownerchar;
	for (var i=0; i < 9; i++){
		ownerchar = "-"; // default
		if (boxes[i].owner == 0){
			ownerchar = "O";
		}
		if (boxes[i].owner == 1){
			ownerchar = "X";
		}
		str = str + ownerchar;	
	}
	
	
	
	// print the string as a board
	// var brd = ' <br><span style="color:white">' + str[0] + str[1] + str[2] + "<br>";
// 	brd = brd + str[3] + str[4] + str[5] + "<br>";
// 	brd = brd  + str[6] + str[7] + str[8] + "</span><br>";
// 	status(brd);
	
	var brd = str[0] + str[1] + str[2] + "\n";
	brd = brd + str[3] + str[4] + str[5] + "\n";
	brd = brd + str[6] + str[7] + str[8] + "\n";
	//status(brd);
	
	
	return str;

}

function checkForWinner(){
	// go through the 8 winning rows looking for a winner
	var winner = -1;
	var done = false;
	var rowctr = 0;
	var  thisrow;
	while (done == false){
		// look at each row of eight and count Xes and Oes
		thisrow = eightrows[rowctr]; // get a new row  of 8
		var ones = 0, zeros = 0, owner = -1;
		for (var j = 0; j < 3; j++){
			owner = boxes[thisrow[j]].owner;
			if (owner == "0"){
				zeros++;
			}
			if (owner == "1"){
				ones++
			}
		
		}
		// gone through one of the 8 rows
		if (zeros == 3){
			winner = 0;
			done = true;
		}
		if (ones == 3){
			winner = 1;
			done = true;
		}
		rowctr++;
		if (rowctr == 8){
			done = true;
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