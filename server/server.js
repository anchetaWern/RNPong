var express = require("express");
var bodyParser = require("body-parser");
var Pusher = require("pusher");

require("dotenv").config();

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var pusher = new Pusher({
  appId: process.env.APP_ID,
  key: process.env.APP_KEY,
  secret: process.env.APP_SECRET,
  cluster: process.env.APP_CLUSTER
});

var users = [];

app.get("/", function(req, res) {
  res.send("all is well...");
});

app.get("/opponent-found", function(req, res) {
  var unique_users = users.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });

  var player_one = unique_users[0];
  var player_two = unique_users[1];

  console.log("opponent found: " + player_one + " and " + player_two);

  pusher.trigger(
    ["private-user-" + player_one, "private-user-" + player_two],
    "opponent-found",
    {
      player_one: player_one,
      player_two: player_two
    }
  );

  res.send("opponent found!");
});

app.get("/start-game", function(req, res) {
  var unique_users = users.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });

  var player_one = unique_users[0];
  var player_two = unique_users[1];

  console.log("start game: " + player_one + " and " + player_two);

  pusher.trigger(
    ["private-user-" + player_one, "private-user-" + player_two],
    "start-game",
    {
      start: true
    }
  );

  users = [];

  res.send("start game!");
});

app.post("/pusher/auth", function(req, res) {
  var socketId = req.body.socket_id;
  var channel = req.body.channel_name;
  var username = req.body.username;

  users.push(username);
  console.log(username + " logged in");

  var auth = pusher.authenticate(socketId, channel);
  res.send(auth);
});

var port = process.env.PORT || 5000;
app.listen(port);
