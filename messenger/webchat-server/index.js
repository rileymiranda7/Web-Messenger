// WEBCHAT SERVER MICROSERVICE ASSIGNMENT
const express = require('express')
const app = express()
var port = process.env.PORT || 8080;
const server = require('http').createServer(app); // NEW
const io = require('socket.io')(server); // NEW
app.use(express.static('static'))
app.use(express.urlencoded({extended: false}))
server.listen(port); // NEW
console.log("Webchat server is running on port " + port)

const https = require('https'); // for calling login microservice

// Base Page --> Login UI
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/static/chatclient.html');
})

// CHATBOT TEST
app.get('/chatbot.html', (req, res) => {
    res.sendFile(__dirname + '/static/chatbot.html');
})

// Login function to call login microservice
function login(username, password, callback) {
    https.get('https://cca-mirandar1-accountservice.herokuapp.com/login/'+username+'/'+password,
        (response) => { // 
            let data = "";
            response.on('data', (chunk) => {        
                data += chunk;                                              
            });
            response.on('end', () => {
                const result = JSON.parse(data); // turns JSON String ('{"first_name":"billy", "age":23}') into JSON object
                if (!result  || result.status==="invalid") {
                    callback(false, result.message, null);
                } else if (result.status==="notfound") {
                    callback(false, message, null);
                } else if (result.status==="found") {
                    callback(true, result.username + " has successfully logged in.", result.username)
                }
            }); 
        });
}

function signup(account, callback) {
    https.get('https://cca-chatdatabase-microservices.herokuapp.com/', account, 
        (response) => {
            let data = '';
             response.on('data', (chunk) => {
                 data += chunk;
             });
            response.on('end', () => {
                const result = JSON.parse(data);
                if (!result || result.status==="invalid") {
                    console.log("DEBUG: signup failed: ", result.message);
                    callback(false, result.message);
                } else if (result.status==="fail") {
                    console.log("DEBUG: signup failed: ", result.message);
                    callback(false, result.message);
                } else if (result.status==="success") {
                    console.log("DEBUG: signup success");
                    callback(true, result.message);
                }
                    
            });
        });
}

function BroadcastAuthenticatedClients(event, message, username) { 
    console.log("2 from " + username);    // What this function does is loop thru each authenticated client,
    var sockets = io.sockets.sockets;     // having each emit the message to its OWN front-end,
    for (var id in sockets) {             // and shows the username of the client who sent the message.       
         const socketclient = sockets[id];
         console.log("DEBUG: socketclient: " + socketclient.username + ", authenticated? " + socketclient.authenticated);
         if (socketclient && socketclient.authenticated) {
             socketclient.emit(event, username + " says: " + message); // SOLVED: chatbot WILL be able to send messages when the for loop
         }                                                             // loops to an authenticated account!
    }
}

// Event handling

// "connection" event: New client connected => send alert showing they connected and show number of connected clients
// and handle other events
io.on('connection', (socketclient) => { 
    var onlineClients = Object.keys(io.sockets.sockets).length;
    var welcomemessage = `${socketclient.id} is connected! Number of connected clients: ${onlineClients}`;
    console.log(welcomemessage);

    socketclient.on("login", (username, password) => {
        console.log(`Debug: Login data: ${username}/${password}`);
        login(username,password,(authenticated, message, account) => { // Callback function emits response to chatclient.html depending on what parameters it
            if (authenticated) {                                       // receives from the login function
                socketclient.authenticated = true;
                socketclient.username = username;
                socketclient.emit("authenticated", message);
                console.log(`Debug: ${username} is authenticated`);
            } else {
                socketclient.emit("login-failed", message);
                console.log(`Debug: Login failed: ${username}/${password}`);
            }
        });
    });

    socketclient.on("signup", (account) => {
        console.log("DEBUG: account: " + account.username + ", " + account.fullName + ", " + account.email + ", " + account.password);
        signup(account, (registered, message) => {
            if (registered) {
                socketclient.emit("registered", message);
            } else {
                socketclient.emit("signup-failed", message);
            }
        })
    })
    // "message" event: Client sent message => broadcast message to all connected clients
    socketclient.on("message", (data) => {
        console.log('DEBUG: Data from a client: ' + data);
        // prevents chatbot from sending messages
        if (socketclient.authenticated) { BroadcastAuthenticatedClients("message", data, socketclient.username); }
    });

    // "disconnect" event: A client disconnected => send alert saying they disconnected and show number of connected clients
    socketclient.on("disconnect", () => {
        var onlineClients = Object.keys(io.sockets.sockets).length;
        var byemessage = `${socketclient.id} is disconnected! Number of connected clients: ${onlineClients}`;
        console.log(byemessage);
        io.emit("online", byemessage);
    });
 });