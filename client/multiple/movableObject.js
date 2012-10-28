/*OBJECT DEFINITION
     *
     **/
var MovableObject=function(Context,object,level){
    var self=this;
    self.eatingBuffer=0;
    self.object=object;
    self.ID = parseInt(Math.random() * 1000);
    self.object.castShadow=true;
    self.freeze=false;
                
    self.level=level||0;
    self.buffer=0;
    self.bufferOverflow=5;           
                 
    var velocityClass=function(){
        var selfv=this;
        selfv.x=0;
        selfv.y=0;
        selfv.z=0;
    };
                
    self.velocity=new velocityClass();                    
    self.resetRandom=function(){                    
        self.velocity.x=Utils.getRandom();  
        self.velocity.y=Utils.getRandom();  
        self.velocity.z=Utils.getRandom();    
    };                
    self.resetRandom();					
                
    self.reflectSpeed=function(negative,axis){                    
        self.velocity[axis]=Math.pow(-1,negative ? -1:1 )*self.velocity[axis];
    };
                
    self.increaseBuffer=function(level){
        var otherObject=self;
        otherObject.buffer+=level;
        //console.log(level);
        if(otherObject.buffer>otherObject.bufferOverflow){
            otherObject.level++;
            //console.log("inc");
            var epsilonScale=0.2;
            otherObject.buffer=0;
            otherObject.object.scale.x+=epsilonScale;                                    
            otherObject.object.scale.y+=epsilonScale;
            otherObject.object.scale.z+=epsilonScale;
        }
    }
    self.checkColision=function(otherObject){                       
        if(self!=otherObject&&Utils.checkColisionOnAllAxis(self,otherObject))                     
        {    
            if(Utils.checkSameWeight(self,otherObject)){
                var v=self.velocity;
                self.velocity=otherObject.velocity;
                otherObject.velocity=v;
            }
            else
            {   
                var copy=otherObject;
                otherObject=Utils.getBiggerWeight(self,otherObject);
                if(self==otherObject){
                    copy.increaseBuffer(self.level);
                } else{
                    self.increaseBuffer(otherObject.level);
                }
                        
                var ind=Context.GameVariables.movingObjects.indexOf(otherObject);  
                var index=0;
                if(Context.ThreeJSVariables.scene.__webglObjects)
                    for(index=0;index<Context.ThreeJSVariables.scene.__webglObjects.length;index++){
                        if(Context.ThreeJSVariables.scene.__webglObjects[index].object==otherObject.object){                                       
                            Context.ThreeJSVariables.scene.remove(otherObject);
                            Context.ThreeJSVariables.scene.__removeObject(otherObject);
                            Context.ThreeJSVariables.scene.__webglObjects.splice(index,1);            
                            Context.GameVariables.movingObjects.splice(ind,1);
                                    
                          
                            if(Context.GameVariables.movingObjects.length==1) 
                            {
                                Context.GlobalVariables.freeze=true;
                                alert("You have won!");
                            }
                            break;
                        }
                    }   
            }                    
                            
        }
    }
}