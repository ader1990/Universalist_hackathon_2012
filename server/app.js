var app = require('http').createServer(handler)
, io = require('socket.io').listen(app)
, fs = require('fs')

app.listen(90);

//handles every request
function handler (req, res) {

}


var Group = function(){
    var self = this;
    self.id = 0;
    self.clients = [];
    self.maxClients = 2;
    self.world=[];
    self.started=false;
}

var groups = [];  
var sockets=[];

//on every connection
io.sockets.on('connection', function (socket) {
    
    sockets.push(socket);
    var group;
    
    if(sockets.length % 2 == 1)
    {
        //new group
        group = new Group;
        group.id =parseInt(Math.random() * 1000);
        group.clients.push(socket);
        groups.push(group);
    }
    else
    {   //existent group   
        group=groups[groups.length-1];
        group.clients.push(socket);
       
        if(group.world.length>0){
            console.log("application - Receive World From Server");
            group.clients[1].emit("receiveWorldFromServer",{
                mappings:group.world
            });
            if(!group.started){
                for(var ind in group.clients){                
                    console.log("application - Start Game");
                    group.clients[ind].emit("startGame",{
                        });
                }
                group.started=true;
            }
        }
    }   
    socket.on("sendWorldToServer",function(data){
        //search the belonging group        
        console.log("application - Send world to server");    
        var group=groups[groups.length-1];
        group.world=data.mappings;
        if(group.clients.size==2){
            group.clients[1].emit("receiveWorldFromServer",{
                mappings:group.world
            });
            if( group.world.length>0 &&!group.started)
                for(var ind in group.clients){
                    group.clients[ind].emit("startGame",{
                        });
                }
        }
    });
    socket.on("keyPress",function(data){
        console.log("application - Key Press");
        for(var clientId in group.clients){
            if(socket!=group.clients[clientId]){
                group.clients[clientId].emit("teammateMoveInformation",{
                    ID:data.ID,
                    velocity:data.velocity
                }); 
            }
        }
    });
    socket.on('canGiveWorld', function () {        
        console.log("application - Can Give World");
        if(groups[groups.length-1].clients[0]==socket)
            socket.emit('giveWorldToServer');       
        else
        {
            var group=groups[groups.length-1];
            if(group.world.length>0)
                for(var ind in group.clients){                
                    console.log("application - Start Game");
                    group.clients[ind].emit("startGame",{
                        });
                }
            
        }
    });
});