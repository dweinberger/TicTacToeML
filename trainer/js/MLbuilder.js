// This is an amateur attempt at building a front-end for loading data and
// training a machine learning model using TensorFlow.js.
// I mentioned I'm an amateur, right?
// This accompanies a multi-part podcast series.
// It's openly licensed but you surely can find better sources
// than this. I don't care what license we say it's under, so let's
// say MIT, ok? Use it any way you want, just to don't rely on it.
// Or laugh at it.
//
// David Weinberger
// david@weinberger.org
// July 2019

// Globals. Yes, globals, dammit. Yes, vars! Stop laughing!

// file paths
var gJsonFileName = "./json/TTT-101.json"; // path to your json file of games


// hyperparameters we can set
var gEpochsNumber = 20;
var gLearningRate = 0.1;
var gBatchSize = 64;
var gValidationSplit = 0.15;
var gKernelSize = 3;
var gUnits = 3;

// one hots to describe box ownership
const oh_un = [0,0,1];
const oh_o = [0,1,0];
const oh_x = [1,0,0];
const playerO = [0,1];
const playerX = [1,0];

var gOnehotGames = new Array(); // all the games and their moves
var gBoardDim = 3; // Size of each side. Normal: 3x3


// the available TTT squares
var gBoxes= [0,1,2,3,4,5,6,7]; 

let maxGamesToLoad = 2; // if no maximum, then -1

function init(){	
	setParams();
	// display json file name
	$("#jsonFileName").text(gJsonFileName);
		
}

function setParams(){
	gEpochsNumber = parseInt($("#epochs").val());
	gLearningRate = parseFloat($("#rate").val());
	gBatchSize = parseInt($("#batch").val());
	gValidationSplit = parseFloat($("#split").val());
	gKernelSize = parseInt($("#kernel").val());
	gUnits = parseInt($("#units").val());
	maxGamesToLoad = parseFloat($("#maximagesta").val());
	console.log("Epochs: " + gEpochsNumber);
	console.log("Learning Rate: " + gLearningRate);
	console.log("Batch size: " + gBatchSize);
	console.log("Validation split : " + gValidationSplit);
	console.log("Kernel Size: " + gKernelSize);
	console.log("Units: " + gUnits);
	console.log("Max images to load: " + maxGamesToLoad);
}

function buildOnehot(){
	// build gOneHots array of onehots that is synced to list_of_all_tags list of tags
	$("#onehotstatus").text("Building onehots...");
	var numberOfBoxes = gBoxes.length;
	var i,j;
	for ( i = 0; i < numberOfBoxes; i++){
		// create array of zeroes (assuming we have 2 categories)
		var oneOneHot = new Array(); // init single onehot array
		for (j=0; j < numberOfBoxes; j++){
			oneOneHot[j] = 0;
		}
		// replace one zero with a 1
		oneOneHot[i] = 1;
		// add this onehot array of to the array of onehots
		gOneHots.push(oneOneHot);
	}
	// console.log(gOneHots);
	$("#onehotstatus").text("DONE. Built " + gOneHots.length +  " onehots.");
}


function loadData(){

	// reset arrays in case we're re-loading

	gOnehotGames.length = 0;
	setParams();

	// --  Read the json file
	$.ajax({
		url: gJsonFileName,
		async: false,
		crossDomain: true,
		dataType: 'JSON',
		success: (function(jsn){
			console.log("Read in " + gJsonFileName);
			console.log("Got jsn: count=" + jsn.length);
			processJson(jsn);
			})
		});
}	
	
function processJson(jsn){

// board: [ [0,0,0] [0,1,0], [0,0,1]... 9 times ]
// 000 = unowned    001 = O owns  010 = X owns
// no relationship to player onehot. so you first triplet is fine
// so you will have 9 of those triplets
// followed by 1 player onehot (which is a length 2 array)

	// clear table 
	$("#gamesArea").html("");
	
	// how many game records to go through?
	if (maxGamesToLoad == -1){
		maxGamesToLoad = jsn.length;
	}
	console.log("looking at " + maxGamesToLoad + " games");
	let loadedGames = 0;
	
	// --- Go through each GAME
	for (var i =0; i < maxGamesToLoad; i++){
		var game = jsn[i];
		var moves = game['moves'];
		
		
		// create structure for table of moves: char + when it was played
		var tablediv = document.createElement("div");
		$(tablediv).addClass("tablediv");
		var tablecontainer = document.createElement("div");
		$(tablecontainer).addClass("tabcont");
		var tablestr = "<table class='tinytable'>" + 
			"<tr><td id='t" + i +  "-0" + "'></td>" +
			"<td id='t" + i +  "-1" + "'></td>" +
			"<td id='t" + i +  "-2" + "'></td></tr>" +
			
			"<tr><td id='t" + i +  "-3" + "'></td>" +
			"<td id='t" + i +  "-4" + "'></td>" +
			"<td id='t" + i +  "-5" + "'></td></tr>" +
			
			"<tr><td id='t" + i +  "-6" + "'></td>" +
			"<td id='t" + i +  "-7" + "'></td>" +
			"<td id='t" + i +  "-8" + "'></td></tr></table>";
		$(tablecontainer).append(tablestr);
		$(tablediv).html(tablecontainer);
		$("#gamesArea").append(tablediv);
		
		var oh_game = [];
		
		// -- Go through all the MOVES in a game
		for (var j = 0; j < moves.length; j++){
			var thismove = moves[j];
			var movenumber = thismove.moveNumber;
			var owner = thismove.player;
			var boardstr = thismove.boardStr;
			var onehotBoard = [];
			// build onhot board for the move
			// by going through each char in the boardstring
			// replacing it with a onehot const defined with globals
			for (var k=0; k < boardstr.length; k++){
				var ch = boardstr[k];
				if (ch == "-"){
					onehotBoard.push(oh_un);
				}
				if (ch == "O"){
					onehotBoard.push(oh_o);
				}
				if (ch == "X"){
					onehotBoard.push(oh_x);
				}
			} // now we have an array of onehots repping a boardstr
			
			// add player to board onehot 
			var oh_move = [];
			oh_move.push(onehotBoard);
			if (thismove.player == 0){
				oh_move.push(oh_o);
			}
			if (thismove.player == 1){
				oh_move.push(oh_x);
			}
			// push the array of board + player onto the game
			oh_game =[oh_move];
			
			// add this move to the table
			// generate id for the table cell
			var dispchar=" ";
			switch (owner){
				case 1: dispchar="X"; break;
				case 0: dispchar="O"; break;
				case -1: dispchar = "-1"; break;
			}
			
			//var cellhtml = "<span class='tabowner "  + dispchar +  "'>" + dispchar + "</span><span class='tabnumb'>" + movenumber + "</span>";
			var cellhtml = "<span class='tabnumb'>" + movenumber + "</span>";
			
			$("#t" + i +  "-" + thismove.box).html(cellhtml);
			if( thismove.player == 1){
				$("#t" + i +  "-" + thismove.box).css({"background-color" : "#7BA9FF", "opacity" : "0.8"});
			}
			if( thismove.player == 0){
				$("#t" + i +  "-" + thismove.box).css({"background-color" : "#FF685D", "opacity" : "0.8"});
			}
			// console.log("j: " + j + " move#" + thismove.moveNumber + " player:" + dispchar + " box:" + thismove.box )
			
		
		} // gone through all the moves
		var bs = moves[j - 1].boardStr;
		bs = humanReadableBoardStr(bs);
		$(tablecontainer).append("#" + i + " " + bs);
		if (thismove.winner == 1){
			$(tablecontainer).css({"border" : "3px solid blue"});
		}
		if (thismove.winner == 0){
			$(tablecontainer).css({"border" : "3px solid red"});
		}
		
		gOnehotGames.push(oh_game);
		
		
		
		
		// var kingdom = photo["kingdomName"]; // animal, veg, mineral? 
// 		var index = photo["index"];
// 		var kingdom_number = photo["kingdomNumber"];
// 		// console.log("kingdomnumber=" + kingdom_number);
// 		var localname = photo['localFileName'];
// 		var photopath = imgRoot  +  localname;
// 		loadedGames++;
// 		gSyncedLabels.push(kingdom); // the text tags
// 		gPhotos.push(photo); // the photos
// 		gSyncedOneHots.push(gOneHots[kingdom_number]);				
  	}
  		
	// shuffle the arrays using lodash. E.g.:
	// E.g.: 
	//zipped = _.zip(['a', 'b'], [1, 2], [true, false]);
	// => [['a', 1, true], ['b', 2, false]]
	// var zipped = _.zip(gSyncedLabels,gPhotos,gSyncedOneHots);
// 	var shuffledZippedArrays = _.shuffle(zipped);
// 	var unzipped = _.unzip(shuffledZippedArrays);
// 	gPhotos = new Array();
// 	gSyncedLabels = unzipped[0];
// 	gPhotos = unzipped[1];
// 	gSyncedOneHots = unzipped[2];
		
  	$("#loaddatastatus").text("Loaded data for " + maxGamesToLoad + " games.");
  				
}

function humanReadableBoardStr(s){
	let news = "";
	for (var i = 0; i < s.length; i++){
		news += s[i];
		if ( (i > 0 ) && ((i + 1)  % 3) == 0){
		news += " ";
		}
	}
	return news;
}


async function createTensors(){
	// create the arrays and tensors we need
	
	// for each board:
	// Create array of 9 onehots to describe  board state
	//    - flatten it
	//    - append the one hot for the player
	// This will be a 29-element, 1D array
	//
	// Create a tensor that is the number of boards, and 29

	var gamesTensor = [], game, moves, owner, flat, botharrays;
	for (i=0; i < gOnehotGames.length; i++){
		game = gOnehotGames[i];
		moves = game[0];
		owner = game[1];
		// go through moves
		for (var j=0; j < moves.length; j++){
			var botharrays = [];
			botharrays.push(moves[j]);
			botharrays.push[owner];
			flat = [].concat.apply([],botharrays[j]);
			//flatowner = [].concat.apply([],owner);
		
			
			
		}
		
	
	
	}

	
		
		if ( i == gPhotos.length - 1){
			$("#imgloadstatus").text("Loaded " + test + " images.");
		}
	
}



//======================== TENSORFLOW.JS ==================
const debugHere = false;

async function saveModel(){
	const saveResult = await theModel.save('downloads://dwmodel-2');
}

async function loadModel(){
	const jsonUpload = document.getElementById('json-upload');
	const weightsUpload = document.getElementById('weights-upload');

	const model = await tf.loadModel(
    	tf.io.browserFiles([jsonUpload.files[0], weightsUpload.files[0]]));
}



async function buildModel(){

	// grey out the other buttons
	$("#onehotbtn").addClass("greyout");
	$("#loadbtn").addClass("greyout");
	$("#createTensorsBtn").addClass("greyout");
	setParams();

	// Preflightcheck to make sure everything is there
	var incomplete = false;
	for (i=0; i < gImages.length; i++){
		var img = gImages[i];
		if (img.complete === false){
			//console.log("Image #" + i + "is not complete");
			incomplete = true;
		}
	}
	if (incomplete === false){
		console.log("All " +  gImages.length + " images are completely loaded.")
	}
	console.log("gSyncedLabels length = " + gSyncedLabels.length + " gSyncedOneHots = " + 
				gSyncedOneHots.length + ". gImages = " + gImages.length + " gOneHots: " + gOneHots);
				
	
	console.log("epochs=" + gEpochsNumber);
	// create convolutional model
	theModel = await createConvModel();
	theModel.summary();
	var d = new Date()
	console.log( "Convolutional model started: " + d.getHours() + ":" + (d.getMinutes() + 1) + ":" + d.getSeconds() );
	await train(theModel);
  		

}

// The big comment blocks come from the file from TensorFlow.js that I pasted in

async function createConvModel() {
	// Create a sequential neural network model. tf.sequential provides an API
	// for creating "stacked" models where the output from one layer is used as
	// the input to the next layer.
	console.log("In createConvModel");
	const model = tf.sequential();

	// The first layer of the convolutional neural network plays a dual role:
	// it is both the input layer of the neural network and a layer that performs
	// the first convolution operation on the input. It receives the 3x3 pixel
	// images. This input layer uses 16 filters with a kernel size
	// of 5 pixels each. It uses a simple RELU activation function which pretty
	// much just looks like this: __/

	// -- 1 
// 	model.add(tf.layers.conv2d({
// 		inputShape: [gBoardDim,gBoardDim, 3],
// 		kernelSize: gKernelSize, // was 3
// 		filters: 16, // was 8
// 		activation: 'relu',
// 		kernelInitializer: 'VarianceScaling', 
// 		strides: 1 
// 		}));
// 	model.add(tf.layers.maxPooling2d({poolSize: 4, strides: 1}));

	//---2 
	// model.add(tf.layers.conv2d({
// 		kernelSize: 5,
// 		filters: 32, // was 16
// 		strides: 1,
// 		activation: 'relu',
// 		kernelInitializer: 'VarianceScaling', 
// 		strides: 1 
// 	}));

	model.add(tf.layers.maxPooling2d({poolSize: 2, strides: 2}));

	//   --- 3
// 	model.add(tf.layers.conv2d({
// 	kernelSize: 3,
// 		filters: 64,
// 		activation: 'relu',
// 		kernelInitializer: 'VarianceScaling',
// 		strides: 1 
// 	}));
// 	model.add(tf.layers.maxPooling2d({poolSize: 2, strides: 2}));



	// Now we flatten the output from the 2D filters into a 1D vector to prepare
	// it for input into our last layer. This is common practice when feeding
	// higher dimensional data to a final classification output layer.
	// model.add(tf.layers.flatten({}));


	// Our last layer is a dense layer which has 2 output units, one for each
	// output class (i.e. 0, 1 = desert or jungle).
	// We use the softmax function as the activation for the output layer as it
	// creates a probability distribution over our 10 classes so their output
	// values sum to 1.
	console.log("adding dense");
	const kinglen = gBoxes.length;
	model.add(tf.layers.dense({units: 32, activation: 'relu'})); // was 64
	model.add(tf.layers.dense({units: kinglen, activation: 'softmax'}));
	console.log("End of convol");
return model;
}





async function train(model) {
	console.log("In train function");
	$("#trainstatus").text('Training model...');

	// Now that we've defined our model, we will define our optimizer. The
	// optimizer will be used to optimize our model's weight values during
	// training so that we can decrease our training loss and increase our
	// classification accuracy.

	// The learning rate defines the magnitude by which we update our weights each
	// training step. The higher the value, the faster our loss values converge,
	// but also the more likely we are to overshoot optimal parameters
	// when making an update. A learning rate that is too low will take too long
	// to find optimal (or good enough) weight parameters while a learning rate
	// that is too high may overshoot optimal parameters. Learning rate is one of
	// the most important hyperparameters to set correctly. Finding the right
	// value takes practice and is often best found empirically by trying many
	// values.
	//const  LEARNING_RATE = 0.01;
	LEARNING_RATE = gLearningRate; // default 0.01, was const

	// We are using rmsprop as our optimizer.
	// An optimizer is an iterative method for minimizing a loss function.
	// It tries to find the minimum of our loss function with respect to the
	// model's weight parameters.

	// const optimizer = 'adam'; // 'rmsprop'; // default
	const optimizer = 'sgd';

	// We compile our model by specifying an optimizer, a loss function, and a
	// list of metrics that we will use for model evaluation. Here we're using a
	// categorical crossentropy loss, the standard choice for a multi-class
	// classification problem.
	// The categorical crossentropy loss is differentiable and hence makes
	// model training possible. But it is not amenable to easy interpretation
	// by a human. This is why we include a "metric", namely accuracy, which is
	// simply a measure of how many of the examples are classified correctly.
	// This metric is not differentiable and hence cannot be used as the loss
	// function of the model.
	model.compile({
	optimizer,
	loss: 'categoricalCrossentropy',
	metrics: ['accuracy'],
	});


	// Batch size is another important hyperparameter. It defines the number of
	// examples we group together, or batch, between updates to the model's
	// weights during training. A value that is too low will update weights using
	// too few examples and will not generalize well. Larger batch sizes require
	// more memory resources and aren't guaranteed to perform better.

	var batchSize = gBatchSize; 

	// Leave out the a percentage (typically 15%) of the training data for validation, to monitor
	// overfitting during training.
	const validationSplit = gValidationSplit;

	// Get number of training epochs from the UI.
	//const trainEpochs = 20;
	var trainEpochs = gEpochsNumber;

	  // We'll keep a buffer of loss and accuracy values over time.
	  let trainBatchCount = 0;

	console.log("var oneHotTensors=" + gSyncedOneHots.length);
	var oneHotsTensors = tf.tensor(gSyncedOneHots);



	var canvas = document.createElement('canvas');
	canvas.height = gBoardDim;
	canvas.width = gBoardDim;
	var ctx = canvas.getContext('2d');
	//var imageTensors = new Array();
	var pixelData = [];
	console.log("gImages = " + gImages.length);

	for (var i = 0; i < gImages.length; i++){
		// console.log("gimages: " + i,gImages[i]);
		ctx.drawImage(gImages[i], 0, 0);
		var imageData = ctx.getImageData(0,0,gBoardDim,gBoardDim);
		var uint8data = imageData.data; // reducedImageData

		for (var j=0; j < uint8data.length; j+=4){
			pixelData.push( (uint8data[j]   / 255) - 0.5);
			pixelData.push( (uint8data[j+1] / 255) - 0.5 );
			pixelData.push( (uint8data[j+2] / 255) - 0.5);
		}
	}
	console.log('done with imagedata', pixelData.length)
	console.log('gImages length =' + gImages.length);
	var allImagesTensor = tf.tensor(pixelData, [gImages.length,gBoardDim,gBoardDim,3]);


	console.log('done tensoring images', allImagesTensor);
	console.log('oneHotsTensors.shape', oneHotsTensors.shape);
	console.log('allImagesTensor.shape',allImagesTensor.shape);

	console.log("awaiting model.fit:");

	await model.fit(allImagesTensor, oneHotsTensors, {
	batchSize,
	validationSplit,
	epochs: trainEpochs,
	shuffle: true,
	callbacks: {
		onEpochEnd: (epoch, loss) => {
			//console.log(epoch);
			console.log(loss);
			if (epoch == gEpochsNumber - 1){
				console.log("Finished " + epochs + " epochs.");
			}
		}
	}

	});
  
  

	var allpreds = model.predict(allImagesTensor);
	var predMax = allpreds.argMax([-1]);
	var oneHotMax = oneHotsTensors.argMax([-1]);

}
