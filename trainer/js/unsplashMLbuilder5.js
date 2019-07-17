// Globals

console.log("in new unsplashMLbuilder5.js")
var gJsonFileName = "./json/desert_jungle_unsplash.json";
var imgRoot = "./images/desert-jungle-unsplash_50x50/";
var bigimageRoot = "./images/desert-jungle-unsplash_full/"

var gOneHots = new Array();
var list_of_all_tags = new Array();
var gImages = new Array();
// params
var gEpochsNumber = 20;
//var theModel; // make it global 
var gLearningRate = 0.1;
var gBatchSize = 64;
var gValidationSplit = 0.15;
var gKernelSize = 3;
var gUnits = 3;

var gPhotos = new Array();
var gSyncedOneHots = new Array(); 
var gSyncedKingdoms = new Array();
//var gSyncedJson = new Array();
var gImgDim = 50; // image dimensions
var gLocalFileName; 

// the two bins we're going to sort images into
var gKingdoms= ["desert","jungle"];

let maxImagesToLoad = -1; // if no maximum, then -1

function init(){	
	setParams();
	$("#displayWindow").click(function(){$("#displayWindow").fadeOut()});
		
}

function setParams(){
	gEpochsNumber = parseInt($("#epochs").val());
	gLearningRate = parseFloat($("#rate").val());
	gBatchSize = parseInt($("#batch").val());
	gValidationSplit = parseFloat($("#split").val());
	gKernelSize = parseInt($("#kernel").val());
	gUnits = parseInt($("#units").val());
	maxImagesToLoad = parseFloat($("#maximagesta").val());
	console.log("Epochs: " + gEpochsNumber);
	console.log("Learning Rate: " + gLearningRate);
	console.log("Batch size: " + gBatchSize);
	console.log("Validation split : " + gValidationSplit);
	console.log("Kernel Size: " + gKernelSize);
	console.log("Units: " + gUnits);
	console.log("Max images to load: " + maxImagesToLoad);
}

function buildOnehot(){
	// build gOneHots array of onehots that is synced to list_of_all_tags list of tags
	$("#onehotstatus").text("Building onehots...");
	var NumbOfKingdoms = gKingdoms.length;
	var i,j;
	for ( i = 0; i < NumbOfKingdoms; i++){
		// create array of 3 zeroes (assuming we have 3 cats)
		var oneOneHot = new Array(); // init single onehot array
		for (j=0; j < NumbOfKingdoms; j++){
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
	gSyncedKingdoms.length = 0; 
	gPhotos.length = 0;
	gSyncedOneHots.length = 0;
	setParams();

	// Ñ--  Read the json file
	$.ajax({
			url: gJsonFileName,
			async: false,
			crossDomain: true,
			dataType: 'JSON',
			success: (function(jsn){
				console.log("Got jsn: count=" + jsn.length);
				processJson(jsn);
			})
			});
	}

	// Is image file on local server?
	// https://stackoverflow.com/questions/38606268/jquery-check-if-a-file-exist-locally	
	function checkIfFileLoaded(fileName) {
		$.get(fileName, function(data, textStatus) {
			if (textStatus !== "success") {
				console.log(fileName + " missing!");
				return -1;
				}
			else {
				console.log(fileName + " found!");
				return 1;
			}
		
		});
}		
	
function processJson(jsn){
	
	// shuffle the original array - lodash
	//jsn =  _.shuffle(jsn);
	
	// go through each image record
	if (maxImagesToLoad == -1){
		maxImagesToLoad = jsn.length;
	}
	console.log("looking at " + maxImagesToLoad + " images");
	let loadedImages = 0;
	
	for (var i =0; i < maxImagesToLoad; i++){
		var photo = jsn[i];
		var kingdom = photo["kingdomName"]; // animal, veg, mineral? 
		var index = photo["index"];
		var kingdom_number = photo["kingdomNumber"];
		// console.log("kingdomnumber=" + kingdom_number);
		var localname = photo['localFileName'];
		var photopath = imgRoot  +  localname;
		loadedImages++;
		gSyncedKingdoms.push(kingdom); // the text tags
		gPhotos.push(photo);
		gSyncedOneHots.push(gOneHots[kingdom_number]);				
  	}
  		
	// shuffle the arrays using lodash. E.g.:
	// E.g.: 
	//zipped = _.zip(['a', 'b'], [1, 2], [true, false]);
	// => [['a', 1, true], ['b', 2, false]]
	var zipped = _.zip(gSyncedKingdoms,gPhotos,gSyncedOneHots);
	var shuffledZippedArrays = _.shuffle(zipped);
	var unzipped = _.unzip(shuffledZippedArrays);
	gPhotos = new Array();
	gSyncedKingdoms = unzipped[0];
	gPhotos = unzipped[1];
	gSyncedOneHots = unzipped[2];
		
  	$("#loaddatastatus").text("Loaded data for " + loadedImages + " images.");
  				
}
function imgFound(newpath){
	//console.log("found:" + newpath);
}
function imgNotFound(img, newpath){
	console.log("-- img ERROR:" + newpath);
}

async function loadImages(){
	// create an array of imported photos synced to gPhotos 
	
	gImages.length = 0; // initiate the global just in case
	$("#imageArea").html("");
	setParams();
	
	var ctr = 0;
	for (let i=0; i < gPhotos.length; i++){
		//gLocalFileName = imgRoot + gPhotos[i]["localFileName"];
		//console.log(localFileName);

	
		// See if the file exists
		$.ajax({
			type: "GET",
			url: gLocalFileName,
			success: (function(){	// -- create the image object
				var img = new Image(); 
				var imagename = gPhotos[i]["localFileName"];
				var newpath = imgRoot + imagename;
				img.src = newpath;

				// -- display images
				//console.log(newpath);
				var div = document.createElement("div");
				$(div).attr({"class" : "imgdemo", "index" : i});
				$(div).append(img);
				var label = document.createElement("div");
				$(label).attr( {"class" : "label", "title" : gSyncedKingdoms[ctr] });
				$(label).text(gSyncedKingdoms[ctr] );
				
				$(div).on( "click", function(){ displayImage(this);} );
				$(div).append(label);
				$("#imageArea").append(div);
				ctr++;
				gImages.push(img);
				})
		});
	
		
		if ( i == gPhotos.length - 1){
			$("#imgloadstatus").text("Loaded " + gPhotos.length + " images.");
		}
	}
	
}

function displayImage(div){
	let i = $(div).attr("index");
	console.log("displaying image " + i);
	$("#displayWindow").fadeIn();
	var filename = gPhotos[i]['localFileName'];
	
	var pathToFullImage = bigimageRoot + filename;
	console.log("display image filename: " + pathToFullImage);
	let king = gPhotos[i]["kingdomName"];
	$("#displayWindow").html(king + " : " + filename + "<br><img src='" + pathToFullImage +  "'> ");
	
}

async function saveModel(){
	const saveResult = await theModel.save('downloads://dwmodel-2');
}

async function loadModel(){
	const jsonUpload = document.getElementById('json-upload');
	const weightsUpload = document.getElementById('weights-upload');

	const model = await tf.loadModel(
    tf.io.browserFiles([jsonUpload.files[0], weightsUpload.files[0]]));
}

//======================== TENSORFLOW.JS ==================
const debugHere = false;


async function buildModel(){

	// grey out the other buttons
	$("#onehotbtn").addClass("greyout");
	$("#loadbtn").addClass("greyout");
	$("#loadimagesbtn").addClass("greyout");
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
	console.log("gSyncedKingdoms length = " + gSyncedKingdoms.length + " gSyncedOneHots = " + 
				gSyncedOneHots.length + ". gImages = " + gImages.length + " gOneHots: " + gOneHots);
				
	
	console.log("epochs=" + gEpochsNumber);
	// create convolutional model
	//var theModel;
	theModel = await createConvModel();
	theModel.summary();
	var d = new Date()
	console.log( "Convolutional model started: " + d.getHours() + ":" + (d.getMinutes() + 1) + ":" + d.getSeconds() );
	await train(theModel);
  		

}

async function createConvModel() {
  // Create a sequential neural network model. tf.sequential provides an API
  // for creating "stacked" models where the output from one layer is used as
  // the input to the next layer.
  console.log("In createConvModel");
  const model = tf.sequential();

  // The first layer of the convolutional neural network plays a dual role:
  // it is both the input layer of the neural network and a layer that performs
  // the first convolution operation on the input. It receives the 28x28 pixels
  // black and white images. This input layer uses 16 filters with a kernel size
  // of 5 pixels each. It uses a simple RELU activation function which pretty
  // much just looks like this: __/
  
  // -- 1 
  model.add(tf.layers.conv2d({
    inputShape: [gImgDim,gImgDim, 3],
    kernelSize: gKernelSize, // was 3
    filters: 16, // was 8
    activation: 'relu',
    kernelInitializer: 'VarianceScaling', 
   	strides: 1 
  }));
  model.add(tf.layers.maxPooling2d({poolSize: 4, strides: 2}));
 
 //---2 
 model.add(tf.layers.conv2d({
    kernelSize: 5,
    filters: 32, // was 16
    strides: 1,
    activation: 'relu',
    kernelInitializer: 'VarianceScaling', 
   	strides: 1 
  }));
  
  model.add(tf.layers.maxPooling2d({poolSize: 2, strides: 2}));
  
//   --- 3
  model.add(tf.layers.conv2d({
    kernelSize: 3,
    filters: 64,
    activation: 'relu',
    kernelInitializer: 'VarianceScaling',
    strides: 1 
  }));
  model.add(tf.layers.maxPooling2d({poolSize: 2, strides: 2}));
  
   
 
  // Now we flatten the output from the 2D filters into a 1D vector to prepare
  // it for input into our last layer. This is common practice when feeding
  // higher dimensional data to a final classification output layer.
  model.add(tf.layers.flatten({}));
  

   // Our last layer is a dense layer which has 10 output units, one for each
  // output class (i.e. 0, 1, 2, 3, 4, 5, 6, 7, 8, 9). Here the classes actually
  // represent numbers, but it's the same idea if you had classes that
  // represented other entities like dogs and cats (two output classes: 0, 1).
  // We use the softmax function as the activation for the output layer as it
  // creates a probability distribution over our 10 classes so their output
  // values sum to 1.
 	 console.log("adding dense");
 // console.log("length of gKingdoms" + gKingdoms.length);
 	const kinglen = gKingdoms.length // units originally were kinglen
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
  // An optimizer is an iterative method for minimizing an loss function.
  // It tries to find the minimum of our loss function with respect to the
  // model's weight parameters.
  
    // const optimizer = 'adam'; // 'rmsprop'; // default
    const optimizer = 'sgd';

  // We compile our model by specifying an optimizer, a loss function, and a
  // list of metrics that we will use for model evaluation. Here we're using a
  // categorical crossentropy loss, the standard choice for a multi-class
  // classification problem like MNIST digits.
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
  //const batchSize = 128;
  var batchSize = gBatchSize; // default 320; was const, not var;

  // Leave out the last 15% of the training data for validation, to monitor
  // overfitting during training.
  const validationSplit = gValidationSplit;

  // Get number of training epochs from the UI.
  //const trainEpochs = 20;
  var trainEpochs = gEpochsNumber; // default 20

  // We'll keep a buffer of loss and accuracy values over time.
  let trainBatchCount = 0;

	
	console.log("var oneHotTensors=" + gSyncedOneHots.length);
	var oneHotsTensors = tf.tensor(gSyncedOneHots);

	
	
	var canvas = document.createElement('canvas');
	canvas.height = gImgDim;
	canvas.width = gImgDim;
	var ctx = canvas.getContext('2d');
	//var imageTensors = new Array();
	var pixelData = [];
	console.log("gImages = " + gImages.length);

	for (var i = 0; i < gImages.length; i++){
		// console.log("gimages: " + i,gImages[i]);
		ctx.drawImage(gImages[i], 0, 0);
		var imageData = ctx.getImageData(0,0,gImgDim,gImgDim);
		var uint8data = imageData.data; // reducedImageData
		
		for (var j=0; j < uint8data.length; j+=4){
			pixelData.push( (uint8data[j]   / 255) - 0.5);
			pixelData.push( (uint8data[j+1] / 255) - 0.5 );
			pixelData.push( (uint8data[j+2] / 255) - 0.5);
		}
	}
	console.log('done with imagedata', pixelData.length)
	console.log('gImages length =' + gImages.length);
	var allImagesTensor = tf.tensor(pixelData, [gImages.length,gImgDim,gImgDim,3]);
	
	
	console.log('done tensoring images', allImagesTensor);
	console.log('oneHotsTensors.shape', oneHotsTensors.shape);
	console.log('allImagesTensor.shape',allImagesTensor.shape);
	
  //const trainData = //data.getTrainData();
  //const testData = //data.getTestData();

  //const totalNumBatches =
  //    Math.ceil(trainData.xs.shape[0] * (1 - validationSplit) / batchSize) *
  //    trainEpochs;

  // During the long-running fit() call for model training, we include
  // callbacks, so that we can plot the loss and accuracy values in the page
  // as the training progresses.
  //let valAcc;
  
  console.log("awaiting model.fit:");
 
  await model.fit(allImagesTensor, oneHotsTensors, {
    batchSize,
    validationSplit,
    epochs: trainEpochs,
    shuffle: true,
//     callbacks: tfvis.show.fitCallbacks({
//     	name: "training"
//     }, ['loss', 'acc', 'val_loss', 'val_acc'], {
//     	height: 250,
//     	//callbacks: ['onEpochEnd'],
//     })
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





