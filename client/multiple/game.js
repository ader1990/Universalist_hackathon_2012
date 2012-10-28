 
$(document).ready(function(){
    
    var Context = {
        Constants: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        GlobalVariables: {
            freeze: true,
            colisionActive: false
        },
        ThreeJSVariables: {
            scene: new THREE.Scene(),
            camera:null,
            renderer:null
        },
        GameVariables:{
            movingObjects:[],
            numberOfObjects:10,
            masterObject:null
        },
        initMasterObject:function(){ 
            
            var suntext=new THREE.ImageUtils.loadTexture("../img/Planet4.jpg",{},function(){});
            var sphereMaterial=new THREE.MeshBasicMaterial({
                map:suntext
            });	
			
            var geometry3 = new THREE.SphereGeometry ( 0.275,30,30); 
            var object=new THREE.Mesh(geometry3, sphereMaterial);
            Context.GameVariables.masterObject=new MovableObject(Context,object,3);
            Context.ThreeJSVariables.scene.add(object);
            Context.GameVariables.masterObject.velocity.x=0;
            Context.GameVariables.masterObject.velocity.y=0;
            Context.GameVariables.masterObject.velocity.z=0;
            Context.GameVariables.movingObjects.push(Context.GameVariables.masterObject);
        },
        atachCanvasToBody:function(){
            document.body.appendChild(Context.ThreeJSVariables.renderer.domElement);         
        },
        activateCollision:function(){            
            console.log("Colision Activated in 3000s");
            setTimeout(
                function(){
                    Context.GlobalVariables.colisionActive=true;
                },12000);
        },
        bindKeyPress:function(){
            $("body").keydown(function(e) {
                var offset=0.005;
                var key = e.which;
                if(key==37){
                    Context.GameVariables.masterObject.velocity.x-=offset;
                }
                if(key==39){
                    Context.GameVariables.masterObject.velocity.x+=offset;
                }
                if(key==38){
                    Context.GameVariables.masterObject.velocity.y+=offset;
                }
                if(key==40){
                    Context.GameVariables.masterObject.velocity.y-=offset;
                }
                //client sends to server his position when it is moved by the player
                gameManager.socket.emit("keyPress", {
                    ID:Context.GameVariables.masterObject.ID,
                    velocity:Context.GameVariables.masterObject.velocity
                });
            });
            
            setInterval(function(){
                if(!Context.GlobalVariables.freeze)
                    gameManager.socket.emit("keyPress", {
                        ID:Context.GameVariables.masterObject.ID,
                        velocity:Context.GameVariables.masterObject.velocity
                    });
            },200);
        },
        init: function () {
            Context.ThreeJSVariables.camera = new THREE.PerspectiveCamera(75, Context.Constants.width/Context.Constants.height, 0.1, 1000); 
            Context.ThreeJSVariables.renderer = new THREE.WebGLRenderer();
            Context.ThreeJSVariables.renderer.setSize(Context.Constants.width, Context.Constants.height);  
            Context.atachCanvasToBody();
            Context.activateCollision();
            Context.initMasterObject();             
            Context.bindKeyPress();
        }
    };
    
    Context.init();
    
    var teammatesId = [];
    
    //Two players game
    var GameManager=function(){
        var self=this;
        self.socket=null;
        var clientSteps=["connectToServer","canGiveWorld","sendWorldIfMaster","readyForStart"];
        var serverSteps=["receiveClient","giveMeTheWorldIfReadyAndMaster","takeWorldIfSlave","startGameMasterAndSlave"];
        self.bindEvents=function(){
            self.bindConnectToServer();
            self.bindCreateTeammate();
            self.bindGiveWorld();            
            self.bindReceiveWorld();
            self.bindStartWorld();
            
            console.log("Events binded");
        };
        self.bindStartWorld=function(){
            self.socket.on('startGame', function () {                
                console.log("Start game");
                Context.GlobalVariables.freeze=false;
                Context.activateCollision();
            });
        },
        self.bindConnectToServer = function(){
            //connect to the server                          
            console.log("Connect to server");
            self.socket=io.connect('http://kuala.cloudapp.net:90');
        };
        self.bindGiveWorld=function(){
            //master client is asked to give his world
            
            self.socket.on('giveWorldToServer', function () {
                          
                console.log("Master have to Give the World to server");
                var mappings=[];
                   
                for(var i=1;i<Context.GameVariables.movingObjects.length;i++){
                    mappings.push({
                        velocity:Context.GameVariables.movingObjects[i].velocity
                    });
                }
                //master client sends world to server
                
                console.log("Master gives the World to server");
                self.socket.emit("sendWorldToServer",{
                    mappings:mappings
                });
            });
        },
        self.bindReceiveWorld=function(){
            //slave client will get the world from the server        
            self.socket.on('receiveWorldFromServer', function (data) {    
                console.log("Slave receives the World from server");            
                var mappings=data.mappings;
                for(var i=1;i<Context.GameVariables.movingObjects.length;i++){
                    Context.GameVariables.movingObjects[i].velocity=mappings[i-1].velocity;                   
                }
            });
        },
        self.bindCreateTeammate = function(){              
            var self=this;
            //client receives teammates move information from the server
            self.socket.on('teammateMoveInformation', function (data) {
                if (data.ID != Context.GameVariables.masterObject.ID) {                    
                    if (teammatesId.indexOf(data.ID) < 0) {
                        teammatesId.push(data.ID); //storing the new player's id

                        //creating the graphics of the new player
                        var geometryGuest = new THREE.SphereGeometry(0.275, 0.275, 0.275);
                        var suntext = new THREE.ImageUtils.loadTexture("../img/Planet1.jpg", {}, function () { });
                        var sphereMaterial = new THREE.MeshBasicMaterial({
                            map: suntext
                        });
                        var objectGuest = new THREE.Mesh(geometryGuest, sphereMaterial);
                        var MasterObjectGuest = new MovableObject(Context, objectGuest, Context.GameVariables.masterObject.level);
                        MasterObjectGuest.velocity = data.velocity;
                        MasterObjectGuest.ID = data.id;
                        
                        Context.GameVariables.movingObjects.push(MasterObjectGuest);
                        Context.ThreeJSVariables.scene.add(objectGuest);
                    }
                    else {
                        var index;
                        for (index = 0; index < Context.GameVariables.movingObjects.length; index++) {
                            if (Context.GameVariables.movingObjects[index].ID == data.id) {
                                Context.GameVariables.movingObjects[index].velocity = data.velocity;
                            }
                        }
                    }
                }
            });
        };
        
        self.bindCanGiveWorld = function(){
            //client is able to send his world to the server            
            console.log("Client can Give the World to server");
            self.socket.emit('canGiveWorld');
        };
    };
    var gameManager = new GameManager();
    gameManager.bindEvents(); 
    // Context.Constants.
    // Context.GlobalVariables.
    //Context.ThreeJSVariables.   
    //Context.GameVariables.
    //GEOMETRIES
    var geometryCubeLevels=[
    new THREE.CubeGeometry(0.05,0.05,0.05),
    new THREE.CubeGeometry(0.1,0.1,0.1),
    new THREE.CubeGeometry(0.175,0.175,0.175),
    new THREE.CubeGeometry(0.20,0.20,0.20),
    new THREE.CubeGeometry(0.3,0.3,0.3)
    ];
    var geometrySphereLevels=[
    new THREE.SphereGeometry(0.05,10,10),
    new THREE.SphereGeometry(0.1,10,10),
    new THREE.SphereGeometry(0.15,15,15),
    new THREE.SphereGeometry(0.20,15,15),
    new THREE.SphereGeometry(0.3,15,15)
    ];
                
    var geometry = new THREE.CubeGeometry(0.4,0.4,0.4); 
    var geometry2 = new THREE.SphereGeometry ( 0.2,0.2,0.2); 
            
    //MATERIALS
    var material = new THREE.MeshNormalMaterial({
        color: 0x347896
    });            
    var materialSpheres = new THREE.MeshLambertMaterial( {
        color: 0x564390, 
        shading: THREE.FlatShading, 
        overdraw: false
    } );            
    //GENERATE OBJECTS
            
    for(var geometryCubeIndex in geometryCubeLevels){
	
        for(var j=1;j<Context.GameVariables.numberOfObjects-geometryCubeIndex;j++){
            object=new THREE.Mesh(geometryCubeLevels[geometryCubeIndex], material);     
            Context.ThreeJSVariables.scene.add(object);
            Context.GameVariables.movingObjects.push(new MovableObject(Context,object,geometryCubeIndex+1));
        }
    }
    for(var geometrySphereIndex in geometrySphereLevels)
    {
	
		
        var suntext2=new THREE.ImageUtils.loadTexture("../img/Planet3.jpg",{},function(){});
        var sphereMaterial2=new THREE.MeshBasicMaterial({
            map:suntext2
        });	
        for(j=1;j<Context.GameVariables.numberOfObjects-geometrySphereIndex;j++){
            object=new THREE.Mesh(geometrySphereLevels[geometrySphereIndex], sphereMaterial2);     
            Context.ThreeJSVariables.scene.add(object);
            Context.GameVariables.movingObjects.push(new MovableObject(Context,object,geometrySphereIndex+1));
        }
    }
    //client has finished creating his world and notifies the server     
    gameManager.bindCanGiveWorld();        
            
            
    //SET CAMERA POSITION
    var aspectRatio=Context.Constants.width/Context.Constants.height;
    Context.ThreeJSVariables.camera.position.y = 0//aspectRatio;
    Context.ThreeJSVariables.camera.position.z = 8//aspectRatio+5;//aspectRatio;
    Context.ThreeJSVariables.camera.position.x = 0//aspectRatio;
            
            
    var max={};
    var divizor=165;
    if(Context.Constants.width>1000&&Context.Constants.width<1400){
        divizor=150;
    }
        
    max.x=Context.Constants.width/divizor;
    max.z=aspectRatio/2;
    max.y=Context.Constants.height/divizor;            
   
            
    //EXECUTES 60 TIMES A SECOND
    function render() { 
        requestAnimationFrame(render);  
        if(!Context.GlobalVariables.freeze){
            for(i=0;i<Context.GameVariables.movingObjects.length;i++ ){                          
                if(Context.GameVariables.movingObjects[i]){
                    if(!Context.GameVariables.movingObjects[i].object.freeze){
                                
                        //check colision
                        if(Context.GlobalVariables.colisionActive)
                            for(k=i+1;k<Context.GameVariables.movingObjects.length;k++){
                                Context.GameVariables.movingObjects[i].checkColision(Context.GameVariables.movingObjects[k]);
                            }
                                
                        //velocity 
                        Context.GameVariables.movingObjects[i].object.position.x+=   Context.GameVariables.movingObjects[i].velocity.x;                                
                        if(Math.abs(Context.GameVariables.movingObjects[i].object.position.x)>max.x){
                            Context.GameVariables.movingObjects[i].reflectSpeed(Context.GameVariables.movingObjects[i].object.position.x>0,'x');
                        //  objects[i].resetRandom();
                        //  objects[i].object.position.x=objects[i].velocity.x*3;
                        }
                    
                        Context.GameVariables.movingObjects[i].object.position.y+=   Context.GameVariables.movingObjects[i].velocity.y;                                
                        if(Math.abs(Context.GameVariables.movingObjects[i].object.position.y)>max.y){
                            Context.GameVariables.movingObjects[i].reflectSpeed(Context.GameVariables.movingObjects[i].object.position.y>0,'y');
                        // objects[i].resetRandom();
                        // objects[i].object.position.y=objects[i].velocity.y*3;
                        }
                                
                        //objects[i].object.position.z+=objects[i].velocity.z;                    
                        if(Math.abs(Context.GameVariables.movingObjects[i].object.position.z)>max.z){
                        //objects[i].reflectSpeed();
                        //objects[i].object.position.z=objects[i].velocity.z*3;
                        }
                    
                        Context.GameVariables.movingObjects[i].object.rotation.x+=Context.GameVariables.movingObjects[i].velocity.x/11;
                        Context.GameVariables.movingObjects[i].object.rotation.y+=Context.GameVariables.movingObjects[i].velocity.y/10;
                        Context.GameVariables.movingObjects[i].object.rotation.z+=Context.GameVariables.movingObjects[i].velocity.z/8;
                    }
                }
            }
            Context.ThreeJSVariables.renderer.render(Context.ThreeJSVariables.scene, Context.ThreeJSVariables.camera); 
        }
    } 
            
    render();
});