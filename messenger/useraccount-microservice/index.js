// USERACCOUNT-MICROSERVICE ASSIGNMENT
// Basic setup for microservice using Express
const express = require('express')
const app = express()
var port = process.env.PORT || 8080;
app.use (express.urlencoded({extended: false}))
const cors = require('cors') 
app.use(cors()) 
app.listen(port)
console.log("User Account Microservice is running on port " + port)

// Node.js code to connect to MongoDB Atlas database
const MongoClient = require('mongodb').MongoClient;
const mongourl = "mongodb+srv://cca-mirandar1:SeaKey554@cca-mirandar1.xoiwp.mongodb.net/cca-labs?retryWrites=true&w=majority";
const dbClient = new MongoClient(mongourl, {useNewUrlParser: true, useUnifiedTopology: true});
dbClient.connect(err => {
    if (err) throw err;
    console.log("Connected to the MongoDB cluster");
});

// FOR TESTING ONLY
/* app.get('/', (req, res) => {
    res.sendFile(__dirname + '/signuptest.html');
}) */

// User registration microservice
app.get('/signup/:username/:fullname/:email/:password',(req,res) => {
    //getting and validating input data from a GET request
    let username = req.params.username;
    let fullname = req.params.fullname;
    let email = req.params.email;
    let password = req.params.password;
    const db = dbClient.db(); // if no "users" cluster is found one will be created
    db.collection("users").findOne({username:username}, (err, user) => { 
        if (user) { // if user doc found is true                         
            //handle failed case where username already exists         
            res.send(`{"status": "failed", "message": "Registration failed: Username already exists!"}`); // JSON string
        } else { // userame doesn't exist --> insert new account doc
            let newUser = {username:username, password:password, fullname:fullname, email:email};
            db.collection("users").insertOne(newUser, (err, result) => { 
                if (err) { //handle case of "signup error"
                    res.send('{"status": "failed", "message": "Error: Registration failed"}');
                } // handle case of "signup successful"
                res.send('{"status": "success", "message": "Registration Successful. You can now log in."}'); 
            });
        }
    });
})

// Login microservice
app.get("/login/:username/:password", (req,res) => {
    let username = req.params.username;
    let password = req.params.password;
    const db = dbClient.db();
    db.collection("users").findOne({username:username,password:password}, (err,user) => {
        if (err || !user) {
            console.log(`DEBUG: Username: ${username}, password: ${password} not found!`);
            
            res.send('{"status": "not found", "username": "' + username + '"}');
        }
        if (user && user.username===username && user.password===password) {
            console.log(`DEBUG: ${username}/${password} was found!`);
            res.send('{"status": "found", "username": "' + username + '"}');
        }
    });
});











