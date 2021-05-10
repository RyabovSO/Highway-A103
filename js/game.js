
const clientWidth = document.body.clientWidth;
const clientHeight = document.body.clientHeight;

var game = new Phaser.Game(clientWidth, clientHeight, Phaser.AUTO, 'TutContainer', { preload: preload, create: create, update:update });
let upKey;
let downKey;
let leftKey;
let rightKey;

//LvL arrays
var levelData=
[[3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
[3,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,3],
[3,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,3],
[3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3],
[3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3],
[3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3],
[3,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,3],
[3,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,3],
[3,1,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,3],
[3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3],
[3,1,1,1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,3],
[3,1,1,1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,3],
[3,1,1,3,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,3],
[3,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3],
[3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3],
[3,1,1,1,3,3,3,1,1,1,1,1,1,1,1,1,1,1,1,3],
[3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3],
[3,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1,3],
[3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3],
[3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3]];

//x & y values of the direction vector for character movement
var dX=0;
var dY=0;
var tileWidth=32;//The width of a tile
var borderOffset = new Phaser.Point(clientWidth/2, 0);//To centralise the isometric level display
var floorGraphicWidth=50;
var heroGraphicWidth=22;
var wallHeight=40; 
var heroHeight=50;//Adjustments to make the legs hit the middle of the tile for initial load
var heroWidth= (floorGraphicWidth/2)-(heroGraphicWidth/2);//For placing hero at the middle of the tile

var facing='south';//Direction the character faces
var sorcerer;//Hero
var sorcererShadow;//Shadow
var shadowOffset=new Phaser.Point(heroWidth+7,11);
var gameScene;//This is the render texture onto which we draw depth sorted scene

var grasLandSprite;
var woodenFloorSprite;
var woodenCrate;

const visibleTiles_val = 15;
var heroMapTile=new Phaser.Point(visibleTiles_val/2,visibleTiles_val/2);//Hero tile making him stand at centre of scene
var heroMapPos;//2D coordinates of hero map marker sprite in minimap, assume this is mid point of graphic
var heroSpeed=1.2;//Well, speed of our hero 
var hero2DVolume = new Phaser.Point(30,30);
var cornerMapPos=new Phaser.Point(0,0);
var cornerMapTile=new Phaser.Point(0,0);
var halfSpeed=0.7;
var visibleTiles=new Phaser.Point(visibleTiles_val,visibleTiles_val);


function preload() {
	game.load.crossOrigin='Anonymous';
    //Load all necessary assets
    game.load.image('heroShadow', './img/tiles/ball_shadow.png');
    game.load.image('gras_land', './img/tiles/gras_land.png');
    game.load.image('wooden_floor', './img/tiles/wooden_floor.png');
    game.load.image('wooden_crate', './img/tiles/wooden_crate.png');
    game.load.atlasJSONArray('hero', './img/sprites/man_1.png', './js/maps/man_1.json');
}


function create() {
    upKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
    downKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
    leftKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
    rightKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
    game.stage.backgroundColor = '#000000';
    //We draw the depth sorted scene into this render texture
    gameScene=game.add.renderTexture(game.width,game.height);
    game.add.sprite(0, 0, gameScene);

    grasLandSprite = game.make.sprite(0, 0, 'gras_land');
    woodenFloorSprite = game.make.sprite(0, 0, 'wooden_floor');
    woodenCrate = game.make.sprite(0, 0, 'wooden_crate');

    sorcererShadow=game.make.sprite(0,0,'heroShadow');
    sorcererShadow.scale= new Phaser.Point(0.5,0.6);
    sorcererShadow.alpha=0.4;
    createLevel();
}

function update(){
    //Check key press
    detectKeyInput();
    //If no key is pressed then stop else play walking animation
    if (dY == 0 && dX == 0)
    {
        sorcerer.animations.stop();
        sorcerer.animations.currentAnim.frame=0;
    }else{
        if(sorcerer.animations.currentAnim!=facing){
            sorcerer.animations.play(facing);
        }
    }
    //Check if we are walking into a wall else move hero in 2D
    if (isWalkable())
    {
        heroMapPos.x +=  heroSpeed * dX;
        heroMapPos.y +=  heroSpeed * dY;
        
        //Move the corner in opposite direction
        cornerMapPos.x -=  heroSpeed * dX;
        cornerMapPos.y -=  heroSpeed * dY;
        cornerMapTile=getTileCoordinates(cornerMapPos,tileWidth);
        //Get the new hero map tile
        heroMapTile=getTileCoordinates(heroMapPos,tileWidth);
        //Depthsort & draw new scene
        renderScene();
    }
}

function createLevel(){
    addHero();
    heroMapPos=new Phaser.Point(heroMapTile.y * tileWidth, heroMapTile.x * tileWidth);
    heroMapPos.x+=(tileWidth/2);
    heroMapPos.y+=(tileWidth/2);
    heroMapTile=getTileCoordinates(heroMapPos,tileWidth);
    renderScene();//Draw once the initial state
}
function addHero(){
    //Sprite
    sorcerer = game.add.sprite(-50, 0, 'hero', '1.png');// Keep him out side screen area
   
    //Animation
    sorcerer.animations.add('southeast', ['1.png','2.png','3.png','4.png'], 6, true);
    sorcerer.animations.add('south', ['5.png','6.png','7.png','8.png'], 6, true);
    sorcerer.animations.add('southwest', ['9.png','10.png','11.png','12.png'], 6, true);
    sorcerer.animations.add('west', ['13.png','14.png','15.png','16.png'], 6, true);
    sorcerer.animations.add('northwest', ['17.png','18.png','19.png','20.png'], 6, true);
    sorcerer.animations.add('north', ['21.png','22.png','23.png','24.png'], 6, true);
    sorcerer.animations.add('northeast', ['25.png','26.png','27.png','28.png'], 6, true);
    sorcerer.animations.add('east', ['29.png','30.png','31.png','32.png'], 6, true);
}
function renderScene(){
    var isoPtTile = new Phaser.Point();
    var cartPt=new Phaser.Point();
    var isoPtHero = new Phaser.Point();
    var heroCornerPt=new Phaser.Point(heroMapPos.x-hero2DVolume.x/2+cornerMapPos.x,heroMapPos.y-hero2DVolume.y/2+cornerMapPos.y);
    gameScene.clear();//Clear the previous frame then draw again
    var startTileX=Math.max(0,0-cornerMapTile.x);
    var startTileY=Math.max(0,0-cornerMapTile.y);
    var endTileX=Math.min(levelData[0].length,startTileX+visibleTiles.x);
    var endTileY=Math.min(levelData.length,startTileY+visibleTiles.y);
    startTileX=Math.max(0,endTileX-visibleTiles.x);
    startTileY=Math.max(0,endTileY-visibleTiles.y);
    //Check for border condition
    for (var i = startTileY; i < endTileY; i++){
        for (var j = startTileX; j < endTileX; j++){
            drawTileIso(isoPtTile,cartPt,levelData[i][j],i,j,1);
            if(i==heroMapTile.y&&j==heroMapTile.x){
                drawHeroIso(isoPtHero,heroCornerPt);
            }
        }
    }
}
function drawHeroIso(isoPt,heroCornerPt){
    isoPt=cartesianToIsometric(heroCornerPt);//Find new isometric position for hero from 2D map position
    gameScene.renderXY(sorcererShadow,isoPt.x+borderOffset.x+shadowOffset.x, isoPt.y+borderOffset.y+shadowOffset.y, false);//drawing shadow
    gameScene.renderXY(sorcerer,isoPt.x+borderOffset.x+heroWidth, isoPt.y+borderOffset.y-heroHeight, false);//drawing hero
}
function drawTileIso(isoPt,cartPt,tileType,i,j){//Place isometric level tiles
    cartPt.x=j*tileWidth+cornerMapPos.x;
    cartPt.y=i*tileWidth+cornerMapPos.y;
    isoPt=cartesianToIsometric(cartPt);
    
    //We could further optimise by not drawing if tile is outside screen.
    if (tileType==0){
        //Nothing...
    } else if(tileType==1){
        gameScene.renderXY(grasLandSprite, isoPt.x+borderOffset.x, isoPt.y+borderOffset.y, false);
    } else if(tileType==2){
        gameScene.renderXY(woodenFloorSprite, isoPt.x+borderOffset.x, isoPt.y+borderOffset.y, false);
    } else if(tileType==3){
        gameScene.renderXY(woodenCrate, isoPt.x+borderOffset.x, isoPt.y+borderOffset.y-wallHeight, false);
    } else { 
        gameScene.renderXY(grasLandSprite, isoPt.x+borderOffset.x, isoPt.y+borderOffset.y, false);
    }
}
function isWalkable(){
    var able=true;
    var heroCornerPt = new Phaser.Point(heroMapPos.x-hero2DVolume.x/2,heroMapPos.y-hero2DVolume.y/2);
    var cornerTL = new Phaser.Point();
    cornerTL.x = heroCornerPt.x +  (heroSpeed * dX);
    cornerTL.y = heroCornerPt.y +  (heroSpeed * dY);
    //Now we have the top left corner point. we need to find all 4 corners based on the map marker graphics width & height
    //Ideally we should just provide the hero a volume instead of using the graphics' width & height
    var cornerTR =new Phaser.Point();
    cornerTR.x=cornerTL.x+hero2DVolume.x;
    cornerTR.y=cornerTL.y;
    var cornerBR =new Phaser.Point();
    cornerBR.x=cornerTR.x;
    cornerBR.y=cornerTL.y+hero2DVolume.y;
    var cornerBL =new Phaser.Point();
    cornerBL.x=cornerTL.x;
    cornerBL.y=cornerBR.y;
    var newTileCorner1;
    var newTileCorner2;
    var newTileCorner3=heroMapPos;
    //Let us get which 2 corners to check based on current facing, may be 3
    switch (facing){
        case "north":
            newTileCorner1=cornerTL;
            newTileCorner2=cornerTR;
        break;
        case "south":
            newTileCorner1=cornerBL;
            newTileCorner2=cornerBR;
        break;
        case "east":
            newTileCorner1=cornerBR;
            newTileCorner2=cornerTR;
        break;
        case "west":
            newTileCorner1=cornerTL;
            newTileCorner2=cornerBL;
        break;
        case "northeast":
            newTileCorner1=cornerTR;
            newTileCorner2=cornerBR;
            newTileCorner3=cornerTL;
        break;
        case "southeast":
            newTileCorner1=cornerTR;
            newTileCorner2=cornerBR;
            newTileCorner3=cornerBL;
        break;
        case "northwest":
            newTileCorner1=cornerTR;
            newTileCorner2=cornerBL;
            newTileCorner3=cornerTL;
        break;
        case "southwest":
            newTileCorner1=cornerTL;
            newTileCorner2=cornerBR;
            newTileCorner3=cornerBL;
        break;
    }
    //Check if those corners fall inside a wall after moving
    newTileCorner1=getTileCoordinates(newTileCorner1,tileWidth);
    if(isWall(levelData[newTileCorner1.y][newTileCorner1.x])){
        able=false;
    }
    newTileCorner2=getTileCoordinates(newTileCorner2,tileWidth);
    if(isWall(levelData[newTileCorner2.y][newTileCorner2.x])){
        able=false;
    }
    newTileCorner3=getTileCoordinates(newTileCorner3,tileWidth);
    if(isWall(levelData[newTileCorner3.y][newTileCorner3.x])){
        able=false;
    }
    return able;
}

function detectKeyInput(){//Assign direction for character & set x,y speed components
    if (upKey.isDown && rightKey.isDown) {     
        facing = "north";
        dY = -1;
        dX = 0;
    } else if (upKey.isDown && leftKey.isDown) { 
        facing = "west";
        dY = 0;
        dX = -1;
    } else if (downKey.isDown && leftKey.isDown) { 
        facing = "south";
        dY = 1;
        dX = 0;
    } else if (downKey.isDown && rightKey.isDown) { 
        facing = "east";
        dY = 0;
        dX = 1;
    } else if (upKey.isDown) { 
        facing = "northwest";
        dX = dY=-1*halfSpeed;
    } else if (downKey.isDown) {
        facing = "southeast";
        dX = dY=halfSpeed;
    } else if (rightKey.isDown) {
        facing = "northeast";
        dX=halfSpeed;
        dY=-1*halfSpeed;
    } else if (leftKey.isDown) {
        facing = "southwest";
        dY=halfSpeed;
        dX=-1*halfSpeed;
    } else {
        dY = 0;
        dX = 0;
    } 

}

function cartesianToIsometric(cartPt){
    var tempPt=new Phaser.Point();
    tempPt.x=cartPt.x-cartPt.y;
    tempPt.y=(cartPt.x+cartPt.y)/2;
    return (tempPt);
}
function isometricToCartesian(isoPt){
    var tempPt=new Phaser.Point();
    tempPt.x=(2*isoPt.y+isoPt.x)/2;
    tempPt.y=(2*isoPt.y-isoPt.x)/2;
    return (tempPt);
}
function getTileCoordinates(cartPt, tileHeight){
    var tempPt=new Phaser.Point();
    tempPt.x=Math.floor(cartPt.x/tileHeight);
    tempPt.y=Math.floor(cartPt.y/tileHeight);
    return(tempPt);
}
function getCartesianFromTileCoordinates(tilePt, tileHeight){
    var tempPt=new Phaser.Point();
    tempPt.x=tilePt.x*tileHeight;
    tempPt.y=tilePt.y*tileHeight;
    return(tempPt);
}

function isWall(tileType){
    switch (tileType) {
        case 0:
            return false;
        case 1:
            return false;
        case 2:
            return false;
        case 3:
            return true;
        default:
            return false;
    }
}