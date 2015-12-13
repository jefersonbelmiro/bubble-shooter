var BUBBLE_RADIUS = 53/2;// 148/2;//177/2 //189/2;
var BUBBLE_SIZE = BUBBLE_RADIUS * 2;

var maxRows = 6;
var maxCols = 8;

var colWidth = BUBBLE_SIZE;
var rowHeight = BUBBLE_SIZE;

// var screenWidth = Math.min(window.innerWidth, window.innerHeight); 
// var screenHeight = Math.min(window.innerWidth, screenWidth * 2);

// var screenWidth = 586;
// var screenHeight = 1024;

// 16:9 640x360 
var screenWidth = 360; 
var screenHeight = 640;

// 960x640px 
// 640x480px 3:2
// 1080p (1920x1080px) 
// 720p (1280x720px).

// var screenWidth = 640;
// var screenHeight = 960;

// 16:9
// var screenWidth = 1080;
// var screenHeight = 1920;

var width = screenWidth;
var height = screenHeight;

var boardWidht = screenWidth - 48;
var boardHeight = screenHeight/2;

// var scale = Math.min((boardWidht/colWidth/maxCols), (boardHeight/rowHeight/maxRows));
// var bubbleScale = Utils.mean([boardWidht/colWidth/maxCols, boardHeight/rowHeight/maxRows]);
var bubbleScale = boardWidht/colWidth/maxCols;
var bubbleSize = BUBBLE_SIZE * bubbleScale;
// var bubbleSize = BUBBLE_SIZE;

var UI = {

    // background: '#B07943',
    // background: '#333333',
    background: '#F5821F',

    width : width,
    height: height,

    maxRows : maxRows,
    maxCols : maxCols,

    bubble : {
        scale: bubbleScale,
        size : bubbleSize,
        radius : bubbleSize/2,
    },

    board : {
        width : boardWidht,
        height : boardHeight,
        rowHeight : bubbleSize - 9,
        separatorHeight : 5,
    }

}

module.exports = UI;
