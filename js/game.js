var game = new Phaser.Game(800, 800, Phaser.AUTO, 'TutContainer', { preload: preload, create: create });

//LvL array
var levelData=
[[1,1,1,1,1,1],
[1,0,0,0,0,1],
[1,0,0,1,0,1],
[1,0,0,0,0,1],
[1,0,0,0,0,1],
[1,1,1,1,1,1]];

var tileWidth=32;//The width of a tile
var borderOffset = new Phaser.Point(250,200);//To centralise the isometric level display
var wallHeight=40; 
var gameScene;//This is the render texture onto which we draw depth sorted scene

var floorSprite;
var wallSprite;

function preload() {
	game.load.crossOrigin='Anonymous';
    //Load all necessary assets
    game.load.image('gras_land', './img/tiles/gras_land.png');
    game.load.image('wall', './img/tiles/wooden_crate.png');
}

function create() {
    game.stage.backgroundColor = '#cccccc';
    //We draw the depth sorted scene into this render texture
    gameScene=game.add.renderTexture(game.width,game.height);
    game.add.sprite(0, 0, gameScene);
    floorSprite= game.make.sprite(0, 0, 'gras_land');
    wallSprite= game.make.sprite(0, 0, 'wall');
    //Depth Sorting
    for (var i = 0; i < levelData.length; i++) {
        for (var j = 0; j < levelData[0].length; j++) {
            drawTileIso(levelData[i][j],i,j);
        }
    }
}

function drawTileIso(tileType,i,j){
    var isoPt= new Phaser.Point();
    var cartPt=new Phaser.Point();
    cartPt.x=j*tileWidth;
    cartPt.y=i*tileWidth;
    isoPt=cartesianToIsometric(cartPt);
    if (tileType==1) {
        gameScene.renderXY(wallSprite, isoPt.x+borderOffset.x, isoPt.y+borderOffset.y-wallHeight, false);
    } else { 
        gameScene.renderXY(floorSprite, isoPt.x+borderOffset.x, isoPt.y+borderOffset.y, false);
    }
}

function cartesianToIsometric(cartPt){
    var tempPt=new Phaser.Point();
    tempPt.x=cartPt.x-cartPt.y;
    tempPt.y=(cartPt.x+cartPt.y)/2;
    return (tempPt);
}
