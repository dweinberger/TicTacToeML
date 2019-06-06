/**
 * For machine learning project, 
 * generate games of STANDARD TicTacTo
 * Started: June 4, 2019
 * Latest: June 4, 2019
 */
 
//  String method extensions
 String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g,"");
}

 String.prototype.countXO = function() {
 	//return[0] = O; return[1] = X;
    var len = this.length;
    var x=0;
    var o=0;
	for (i=0; i < len; i++){
	 var c = this.substr(i,1).toUpperCase();
	   if (c=="X"){
	   	 x++;
	   }
	   if (c=="O"){
	   	 o++;
	   }
	}
	var ret = new Array();
	ret[0]=o;
	ret[1]=x;
	//setStatus(`Before click: Xs=${ret[1]} Os=${ret[0]}`);
	return ret;
}


// GLOBALS

var gpause = 1000; // milliseconds to pause
var gDisplayWinner = false; // show winning row
var gShowStatus = true;
var gGamesPerFile = 10000;
var gNoWinner = 0; // how many games end in a tie?
var gMoveNumber = 0; // which move in a game
var gplayer;
var X = 1;
var O = 0;
var gTotalXwins = 0;
var gTotalOwins = 0;
var gTotalGames = 0;
var gAllTheGamesArray = [];
var gLoadedGames = []; // games loaded from saves
//var gutil = new Array();
// create structure
function boxstruct(eightrow,row,col,diag,winner,xostring,xs,os, usedBomb) {
    this.eightrow = eightrow;
	this.row = row;
	this.col = col;
	this.diag = diag;
	this.winner = winner;
	this.xostring= xostring;
	this.xs = xs;
	this.os = os;
	this.usedBomb = usedBomb;
}


var boxdata = new Array();


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

// the connected corners for any corner
var connectedCorners = new Array();
connectedCorners[0] = new Array(2,6);
connectedCorners[1] = new Array(-1,-1);
connectedCorners[2] = new Array(6,8);
connectedCorners[3] = new Array(-1,-1);
connectedCorners[4] = new Array(-1,-1);
connectedCorners[5] = new Array(-1,-1);
connectedCorners[6] = new Array(0,8);
connectedCorners[7] = new Array(-1,-1);
connectedCorners[8] = new Array(2,6);

function init(){
	
	// create array of box structures
	for (i=0; i < 9; i++){
		var b = new boxstruct;
		boxdata.push(b);
	}
	// for each box record which rows (eightrows) in its in
	boxdata[0].eightrow=new Array(0,3,5);
	boxdata[0].row=0;
	boxdata[0].col=0;
	boxdata[0].diag=0;
	boxdata[1].eightrow=new Array(0,6);
	boxdata[1].row=0;
	boxdata[1].col=1;
	boxdata[1].diag =-1;
	boxdata[2].eightrow=new Array(1,4,7);
	boxdata[2].row=0;
	boxdata[2].col=2;
	boxdata[2].diag=1;
	boxdata[3].eightrow=new Array(1,5);
	boxdata[3].row=1;
	boxdata[3].col=0;
	boxdata[3].diag =-1;
	boxdata[4].eightrow=new Array(1,3,4,6);
	boxdata[4].row=1;
	boxdata[4].col=1;
	boxdata[4].diag =2;
	boxdata[5].eightrow=new Array(1,7);
	boxdata[5].row=1;
	boxdata[5].col=2;
	boxdata[5].diag =-1;
	boxdata[6].eightrow=new Array(2,4,5);
	boxdata[6].row=2;
	boxdata[6].col=0;
	boxdata[6].diag =1;
	boxdata[7].eightrow=new Array(2,6);
	boxdata[7].row=2;
	boxdata[7].col=1;
	boxdata[7].diag =-1;
	boxdata[8].eightrow=new Array(2,3,7);
	boxdata[8].row=2;
	boxdata[8].col=2;
	boxdata[8].diag =1;

	
	
	$("#numberofgames").text("0");
	$("#scoreX").text("0");
	$("#score0").text("0");
	
	gplayer = "HUMAN";
	layOut();
	//document.onkeyup = KeyCheck; 
	
	//setStatus("Initiated");
 
	


}

// --- PLAY GAMES

function playGames(){
	var howmany = parseInt($("#timesthrough").val());
	gNoWinner = 0;
	gTotalGames = 0;
	gTotalXwins = 0;
	gTotalOwins = 0;
	//$("#beachball").show();
	var i = 0; done = false;
	while (done === false){
		playAGame();
		var allgameslength = gAllTheGamesArray.length;
		if (i  % gGamesPerFile === 0){
			if ( i > 0){ // 0 % n = 0
				//var slice = gAllTheGamesArray.slice(i, i + gGamesPerFile);
				saveData(i, gAllTheGamesArray);
				gAllTheGamesArray.length = 0;
			}
		}
		i++;
		if (i >= howmany){
			done = true;
			// write out the left over bit
			saveData(i, gAllTheGamesArray);
		}
	}
	
	// out of while loop
	$("#beachball").hide();
	gAllTheGamesArray.length = 0; // reset the array
}

// ---- PLAY A GAME

function playAGame(){
	// autoplays a game
	var i;
	$("#status").html("<b>New Game</b>"); // clear status
	for (i=0; i < 9; i++){
		boxdata[i].xs=0;
		boxdata[i].os=0;
		boxdata[i].winner= -1;
		boxdata[i].usedBomb = false;
		boxdata[i].xostring="";
		$("#xo" + i).text("");
		$("#" + i).removeClass("boxwinner");
	}
	var gTotalXwins = 0;
	var gTotalOwins = 0;
	var onegame = [];
	
	var gameNotDone = true;
	var player = "X";
	var movenumber = -1;
	gMoveNumber = 0;
	gPlayerHasBomb = [1,1]; // load up the bombs. (0 = no bomb)
	var playerUsedBomb = false;
	var winningmoves = [];
	var playernumber = player == "X" ? 1 : 0;

	
	
	// ------- play the game
	while (gameNotDone){
		// Do a move
		movenumber++;
		var winner = -1;
		
				 //boxdata[winningmove].xostring = boxdata[winningmove].xostring + player.toLowerCase();
			
			
			// change player
			if (player == "X") {player="O";}else{player="X";}
		
		
			var squares=[0,1,2,3,4,5,6,7,8];
			// randomize the squares
			// then look through them until find an empty
			// else declare the game over
			squares = shuffle(squares)
			let i = 0,sq, sqIndex = 0;
			var boxwinner =-1;
			let stillLooking = true;
			while (stillLooking){
				sq = squares[sqIndex];
				if ( boxdata[sq].xostring === ""){
					//  update string representation	
					boxdata[sq].xostring =  player.toLowerCase();
					$("#xo" + sq).text(boxdata[sq].xostring);
					if (player == "X"){
						$("#xo" + sq ).addClass("xdisplay");
					}
					else{
						$("#xo" + sq ).removeClass("xdisplay");
					}
					stillLooking = false;
					setStatus("Player " + player + "found empty box #" + sq)
				}
			
				if (stillLooking){
					sqIndex++;
					// no boxes left?
					if (sqIndex == 9){
						stillLooking = false;
					}
				}// 
// 				else {
// 
// 					// change player
// 					
// 				}
	
			}// end of move
		
		
		// prevent loop where game never ends
		gMoveNumber++;
		if (gMoveNumber > 9){
			gameNotDone = false;
		}
	// -- is it a winner?
	if (winner == -1){
		winner = isAGameWinner();
	}
	if (winner != -1){
		gameNotDone = false;
		// change player
		if (player == "X") {player="O";}else{player="X";}
		
	}	
		
	// -- add move to data
	var onemove = {};
	onemove["movenumber"] = movenumber;
	if (player == "X"){
		onemove["player"] = "o";
	}
	else{
		onemove["player"] = "x";
	}
	// capture the board as a continuous string
	var boxstring = "";
	for (var k =0 ; k < 9; k++){
		var newstr = boxdata[k].xostring;
		var len = newstr.length
		if (len == 2) {
			newstr = newstr + "-";
		}
		if (len == 1) {
			newstr = newstr + "--";
		}
		if (len == 0) {
			newstr = "---";
		}
		boxstring += newstr;
	}
	onemove["movenumber"] = movenumber;
	onemove["board"] = boxstring;
	onemove["winner"] = winner;
	onemove["XHasBomb"] = gPlayerHasBomb[1];
	onemove["OHasBomb"] = gPlayerHasBomb[0];
	//onemove[k]=boxa;
	onegame.push(onemove);

	}
	//-- GAME END
	gTotalGames++;
	$("#numberofgames").text(gTotalGames);
	gAllTheGamesArray[gAllTheGamesArray.length] = onegame;	
	//setStatus("---END OF GAME. Winner= " + winner);
	if (winner == -1){
		gNoWinner++;
		$("#nowinnergames").text(gNoWinner);
		setStatus("Ended in a tie.")
	}
	
	return;
	
}

// ---- SAVE DATA

function saveData(gameNumber, dataslice){

// DEBUG
return

	var datas = JSON.stringify(dataslice);
	$.ajax({
	type: "POST",
		url: './php/savedata.php', 
		data: {thedata :  datas, endinggame : gameNumber },
		success:  function savedatasuc (res){
			setStatus("Data saved to" + res);
		},
		error: function(e){
			alert("Error saving data:" + e.statusText);
		}
	});


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

//--- DID THIS MOVE JUST WIN THE GAME?

function isAGameWinner(forced){
	var done = false, i=0, gotAWinner = -1;
	//setStatus("In Is a Game Winner");
	while (!done){
		//setStatus("GameWinner row:" + i);
		// look at rows
		var row = eightrows[i];
		// check the three squares to look for winner
		var Xs=0, Os=0;
		for (var j=0; j < 3; j++){
			//setStatus("-row:" + i + " j:" + j + " sq:" + row[j] );
			var sq = row[j];
			if (boxdata[sq].winner == 1){
				Xs++; 
			}
			if (boxdata[sq].winner === 0){
				Os++; 
			}
			//setStatus("--Xs:" + Xs  + " Os:" + Os);
		}
		// is this a winning row?
		if ((Xs ==3 )){
			gotAWinner = 1;
			gTotalXwins++;
			$("#scoreX").text(gTotalXwins);
			done = true;
		}
		if ((Os == 3)){
			gotAWinner = 0;
			gTotalOwins++;
			$("#scoreO").text(gTotalOwins);
			done = true;
		}
		if (!done){
			i++;
			if (i == 8){
				done = true;
			}
		}
	}	

	//display winner. Force it if button pressed
	if (gotAWinner > -1) {
		if ( (forced==true) || gDisplayWinner){
			displayWinningRow(i);
		}
	}
	
	return gotAWinner;
}


//--- ARE WE ONE MOVE FROM WINNING?

function oneMoveFromWinning(player){
	// one move from winning?
	// w == 1 for human, 0 for computer
	// fill global utility array with squares that are one away from winning
	
	// create other player
	var otherplayer = player == 1  ? 0 : 1;
	var i,j,s, wonboxtotal,thisbox, usedBomb = false;
	var tarray = new Array();
	var winningboxes = []; 
	for (i=0; i < 8; i++){ // check the eight unique lines for one-away
	   // are there two boxes won by w already?
	   let player_wonboxtotal = 0;
	   let otherplayer_wonboxtotal = 0;
	   // check each box in the row
	   // (assume player is X)
	   // if X owns boxes two and can own the third, own it
	   var row = eightrows[i];
	   for (var j=0; j < 3; j++){
	   		var boxnumb = row[j];
	       if (boxdata[boxnumb].winner == player){
	        player_wonboxtotal++;
	        } 
	    	if (boxdata[boxnumb].winner == otherplayer){
	        	otherplayer_wonboxtotal++;
	    	} 
		} // looked at one of the 8 rows
	    // does this row have two winning boxes for this player?
	    // If so, then own this box
	    if (player_wonboxtotal == 2) { 
	       // find the remaining box to play
	       for (j=0; j < 3; j++) {
	      	var thisboxnumber = eightrows[i][j]; // get the square
	      	var thisbox = boxdata[thisboxnumber];
	        if (thisbox.winner == -1) { // this one is not won, so count Xs and Os
	          	var scores = thisbox.xostring.countXO();
	          	//var score = (player == 0) ? scores[0] : scores[1];
	          	// if player can win this box, add it to array
	          	if ( 
	          		( (scores[player] == 0) && (gPlayerHasBomb[player] !== 0)) ||
	          		( scores[player] == 1) 
	          		){
	          		setStatus('Move ' + gMoveNumber + ": " + player  + "found a winning move: " +  thisboxnumber);
	          		winningboxes.push(i);
	          		// update the bomb info if it's played
	          		if (scores[player] == 0){
	          			gPlayerHasBomb[player] = 0;
	          			var str = (player == 0) ? "OO" : "XX";
	          			thisbox.xosstring += str;
	          			usedBomb = true;
	          			setStatus(gMoveNumber + ": " + player + " can play the bomb in " + i);
	          		}
	          	}
	          }
		}
	   }
	
	}
	// if there's more than one winning move, randomly pick one
	var len = winningboxes.length;
	if (len > 1){
		var r = Math.floor(Math.random() * len);
		setStatus("winning move:" + r);
		boxdata[r].winner = player;
		return {box: winningboxes[r], usedBomb : usedBomb};
	}
	else {
		return {box : -1, usedBomb : false};
	}
}



//--- DISPLAY WINNING ROW

function displayWinningRow(i){
	// i = which eightrow
	var b;
	for (y=0; y < 3; y++){
		b = eightrows[i][y]; // box number	
		bx = document.getElementById(b);
		$(bx).addClass("boxwinner");
	}
}


function layOut(){
  var board = document.getElementById("boarddiv"); // get the board div
  
  // clear it
  board.innerHTML = "";
  
  // create 3 rows of 3
  var i,j,k;
  i=0;
  for (j=0;j<3;j++){
    for (k=0;k<3;k++){
      sq = document.createElement("div");
      board.appendChild(sq);
      sq.setAttribute("class","square");
      sq.setAttribute("id",i);
      sq.setAttribute("onclick", "playMove(" + "'"+ i + "'" +")");
      // create area for x and 0
      var xo = document.createElement("p");
      sq.appendChild(xo);
      xo.setAttribute("id", "xo" + i);
      xo.setAttribute("class","xobox");
      xo.innerHTML=""; //"XO"  + i;
      // create area for display of owner of square
      var win = document.createElement("p");
      sq.appendChild(win);
      win.setAttribute("id","boxwinner" + i);
      win.setAttribute("class","boxwinner");
      if ( (i>0) && (i % 3) == 0 ) {
      	 sq.setAttribute("style","float:left");
      }
       else { sq.setAttribute("style","float:left");}
      
      i++;
    }
  }

}

function displayWinningRowManually(){
	isAGameWinner(true); // force display manually
}


function updateXostring(sq){
	//update the display of the marks
	// also update the structure
	var xoel = document.getElementById("xo" +  sq); // get the square
	if (xoel == null) {alert("Null box in updateXostring. Sq=" + sq);}
	var xostring = xoel.innerHTML; // get the existing string
	// get marker
	var marker;
	if (gplayer=="HUMAN") {
		marker="X";
	}
	else {marker = "O";}
	// change the display
	xostring = xostring + marker; // add marker
	xoel.innerHTML = xostring;   // update display string
	boxdata[sq].xostring = xostring; // update data structure
	var xos = new Array();
	xos = xostring.countXO();
	boxdata[sq].xs = xos[0];
	boxdata[sq].os = xos[1];
	
	// flash the box
	flashTheBox(sq,"NORMAL");
}


function isMoveOk(sq,who,status){
   // who == "HUMAN" or "COMPUTER"
   // status is bomb status, eg "NORMAL"
   // returns true or false
   
	var ok = true;
	// get the xo element
	var xop = document.getElementById("xo" + sq);
	// check to see if there's already a winner
	var isq = sq * 1; // convert to int
	var winner = boxdata[isq].winner;
	//setStatus("IsMoveOk: " + sq + " Winner: " + winner);
	if (winner > -1) {
		if (status != "HIDDEN"){
		//setStatus("++ Bad move: Square already owned.");
		showBadMove(sq);
		}
		return false;
	}
	// get xo string
	var xostring = xop.innerHTML;
	var xoarray = xostring.countXO(); // get array of number of x and o's
	if ( (xoarray[0] >=  2) || (xoarray[1] >= 2) ){ // if either == 2, then not ok
		ok = false; // initialized as true
	}
	
	// if ((who == "HUMAN") && xoarray[1] < 2) { // already 2 human markers in it?
// 		ok = true;
// 	}
// 	if ((who == "COMPUTER") && xoarray[0] < 2) { //already 2 comp markers in it?
// 		ok = true;
// 	}
	return ok;
	
}

function showBadMove(sq){
	$("#badMoveDiv").text("Illegal move in square #" + sq);
	$("#badMoveDiv").show();
}





// www.sean.co.uk

function pausecomp(millis) 
{
var date = new Date();
var curDate = null;

do { curDate = new Date(); } 
while(curDate-date < millis);
} 

function randomizeArray(){
   // use: anyArray.sort( randomizeArray );
   return (Math.round(Math.random())-0.5); 
}

function finishGame(){
	return
}
function setStatus(s){
	if (gShowStatus == false){
		return;
	}
	var tx = s + "\n" + $("#status").text();
	$("#status").text(tx);
	//return; //DEBUG
    // append line, unless it's "CLEAR"
// 	el = document.getElementById("status");
// 	if (s == "CLEAR") {
// 	    el.innerHTML="";
// 	    return
// 	}
	var statdiv = document.createElement("div");
	$(statdiv).attr({"class" : "statusmsg"});
	$(statdiv).html(s);
	// stripe it
	let prev = $(statdiv).prev();
	
	$( statdiv ).css( "backgroundColor", "#DCFFFF" ).css( "background", "#D6FFC1" );
	$("#debugmsgs").append(statdiv);
	//el.innerHTML=s + "<br>" + el.innerHTML ;
}


function flashTheBox(sq,typeofflash){
	return; // debug
  // put border around the box
  var i, el, si="";
  if (typeofflash == "NORMAL"){
    for (i=0;i < 9; i++) {
     el = document.getElementById("" + i);
     si = "" + i;
      if (sq == si) {
        el.style.borderColor="RED";
      }
      else { el.style.borderColor= "#FFDDAA";
    }
    
  }
  }
  
  return


}


function displayWinningBox(w,who){
  // wh0 = 0 for 0, 1 for X
  // w = which square
  	
  	var sel = document.getElementById("boxwinner" + w);
  	var marker="O";
  	if (who == 1) { 
  		marker = "X";
  		}
 	sel.innerHTML = marker;
 	//setStatus(marker + " won square #" + w);
}




function checkRow(w,n){
	//check row that w is in for number n
	var wel = document.getElementById(w);
    // get the ordinal number of B2 from its id
	var id = wel.getAttribute("id");
	var b2number = getB2NumberFromID(id);
	var r = getRowArrayFromB2Id(b2number);
	var id,arraynumber;
	if (r == -1) {
		alert("couldn't find row for: " + n);
		return
	}
	
	//var wnumb = w.substr(3,w.length); // turn b2-3 into 3, or whatever, getting ordinal number of b2 square
	
	// check the row for matches
	var s = String.fromCharCode(n);
	var nomatch = true;
	var olds, oldel;
	for (var i = 0; i < 9; i++){
		id = "b2p-" + ROWarray[r][i];
		oldel = document.getElementById(id); // get el in row aarray 
		olds = oldel.innerHTML; // get the number, if any, in the b2 sq
		arraynumber = ROWarray[r][i];
		if ((b2number != arraynumber) && (olds == s)){
			matchesArray.push(arraynumber); // push it into the global array of matches
			nomatch = false;
		}
	}
	return nomatch;
}

function checkCol(w,n){
	
}

function checkB1(w,n){
	
}

	


 function clicked(which){
 	
		
    var ss = new Array();
	var whichel = document.getElementById(which);
	//whichel.innerHTML = "TETTTT";
	//ss = parseSRC(whichel);
	//whichel.textContent="clicked";
	//alert(ss[0]);
   }
 
 function loadGames(){
 	var filename = $("#filenametext").val();
 	$.ajax({
    url:'./data/' + filename,
    dataType: "json",
    success: function (data){
    	gLoadedGames = data;
    	$("#loadGameInstruction").text(data.length + " games loaded.");
    	$("#loadGameSpan").css("display","block");
    	displayStats();
    },
    error: function(e){
    	alert(e.statusText);
    }
    });
    
    return;
 }
 
function loadAGame(){
	// get the number from textarea
	gamenumber = $("#gameToLoad").val();
	if (gamenumber === ""){
		alert("Enter a game number, jerk.");
		return
	}
	// get the game
	gLoadedGame = gLoadedGames[gamenumber];
	var movenumber = 0;
	var  boardState = gLoadedGame[movenumber]["board"];
	setStatus("#" + movenumber + " board:" + boardState);
	// load last move
	$("#whichmovespan").text("0");
	displaySavedBoard(gLoadedGame[0]);
}

function displayStats(){
	// get stats about all the loaded games
	var games = gLoadedGames;
	var howmanygames = games.length;
	setStatus("=============== STATS ON GAMES LOADED ===");
	setStatus("Number of games: " + howmanygames);
	var xwon=0; owon=0; totalmoves=0;; xusedbomb=0;ousedbomb=0;
	for (var i=0; i < howmanygames; i++){
		var game = games[i];
		var gamelength = game.length;
		var lastmove =game[gamelength - 1];
		if (lastmove["winner"] == "0"){
			owon++;
		}
			if (lastmove["winner"] == ""){
			owon++;
		}
		
	}

}
function displaySavedBoard(moveinfo){
	// recreate board from string such as --x-00--etc
	var str = moveinfo["board"];
	var i, s="", sq=0;
	// walk through the string for the board,
	// filling in each box. (string = --x-oo-etc.)
	for (i=0; i < 27; i+3){
		s =str.substr(i,3);
		s += "<br>winner: " + moveinfo["winner"];
		$("#" + sq).html(s);
		//$("#whichmovespan").text(sq);
		sq++;
		i += 3;
	}
	return
}
function walkThroughGame(){
	var nextmove = Number($("#whichmovespan").text()) + 1;
	if (nextmove < gLoadedGame.length){
		displaySavedBoard(gLoadedGame[nextmove]);
		var laststr = "";
		if (nextmove == gLoadedGame.length - 1){
			laststr = " (End of Game)."
		}
		$("#whichmovespan").text( nextmove + laststr);
	}
}
function rerunMove(){
	// set up the board and rerun the move for debugging
	// get the move number from the status
	var movenumber =  Number($("#whichmovespan").text());
	var gamestate = gLoadedGame[movenumber]
	

}

 
 function KeyCheck(e)

{
   var k = (window.event) ? event.keyCode : e.keyCode;
   
 //  alert("key =" + KeyID);
 
 // check for in range

if ((k >= 49) && (k <= 57)) {
	var s = (k);
	acceptB2key((k))
}

   switch(k)
   {
      case 32:
     
      break; 
      case 17:
     // document.Form1.KeyName.value = "Ctrl";
      break;
      case 18:
      //document.Form1.KeyName.value = "Alt";
      break;
      case 40:
     // document.Form1.KeyName.value = "Arrow Down";
      break;
   }

}

