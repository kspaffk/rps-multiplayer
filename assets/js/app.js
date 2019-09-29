$(document).ready(function() {
    // Your web app's Firebase configuration
    var firebaseConfig = {
        apiKey: "AIzaSyCmT7m4fhYL_X6EsSkGL6vrZ5XtTouC834",
        authDomain: "rps-multiplayer-2e150.firebaseapp.com",
        databaseURL: "https://rps-multiplayer-2e150.firebaseio.com",
        projectId: "rps-multiplayer-2e150",
        storageBucket: "rps-multiplayer-2e150.appspot.com",
        messagingSenderId: "444299491099",
        appId: "1:444299491099:web:930bddba95ee18a7bfc5be"
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    var database = firebase.database();
    // create locations for players in database
    var dbPlayers = database.ref("/players");
    var dbPlayer1 = database.ref("/players/player1");
    var dbPlayer2 = database.ref("/players/player2");
    // create location for connections in database
    var connectionsRef = database.ref("/connections");
    var connectedRef = database.ref(".info/connected");

    // remove this once you have the updates to connections
    
    // local variable to keep track of players
    var isPlayer1 = false;
    var isPlayer2 = false;
    var timer;
    
    dbPlayers.on("value", function(snap) {
        console.log(snap.val());
        checkGameStatus();
    });
    
    // get connected info of clients
    connectedRef.on("value", function(snap) {
        console.log("connected ref", snap.val());
        if (snap.val()) {
            var con = connectionsRef.push(true);
            con.onDisconnect().remove();
        }
    });
    
    // add how many people are on the website here
    connectionsRef.on("value", function(snap) {
        console.log(snap.numChildren());
    });

    // function to check the status of the game
    function checkGameStatus() {
        $(".player1 form").remove();
        $(".player2 form").remove();
        database.ref().once("value").then(function(snap) {
            console.log("database look ", snap.val());
            // both players are chosen
            if (snap.val().players.player1 != undefined && snap.val().players.player2 != undefined) {
                createScoreboard();
                assignRPStoPlayer();
                return "both";
            }
            // neither players are chosen
            else if (snap.val().players.player1 === undefined && snap.val().players.player2 === undefined) {
                requestPlayer1();
                requestPlayer2();
                waitingForPlayers(2);
                return "neither";
            }
            // only player 1 is chosen
            else if (snap.val().players.player1 != undefined) {
                waitingForPlayers(1);
                if (!isPlayer1) {
                    requestPlayer2();
                }
                return "player1";
            }
            // otherwise just player 2 is chosen
            else {
                waitingForPlayers(1);
                if (!isPlayer2) {
                    requestPlayer1();
                }
                return "player2"
            }
        });
    }

    // create the generic player form for new players
    function createPlayerForm() {
        // create generic form for player input
        var form = $("<form>");
        var labelName = $("<label>").addClass("name-label");
        var inputName = $("<input>").addClass("name-input").attr({
            type: "text",
            placeholder: "Enter your name"
        });
        var submitBtn = $("<button>").addClass("submit-btn").text("Enter Game");

        form.append(labelName, inputName, submitBtn);
        return form;
    }
    
    
    // create player 1 field for new players
    function requestPlayer1() {
        // create specific attr and classes for player 1
        console.log("/player1 doesnt exist");
        $(".player1").empty();
        var playerForm = createPlayerForm();
        $(".player1").append(playerForm);
        $(".player1 label").attr("for", "player1-name").text("Player 1: ");
        $(".player1 input").attr("id", "player1-name");
        $(".player1 button").attr({
            id: "submit-1",
            value: "1"
        });
        $("#submit-1").on("click", addPlayer);
    }

    //create player 2 field for new players
    function requestPlayer2() {
        // create specific attr and classes for player 2
        console.log("/player2 doesnt exist");
        $(".player2").empty();
        var playerForm = createPlayerForm();
        $(".player2").append(playerForm);
        $(".player2 label").attr("for", "player2-name").text("Player 2: ");
        $(".player2 input").attr("id", "player2-name");
        $(".player2 button").attr   ({
            id: "submit-2",
            value: "2"
        });
        $("#submit-2").on("click", addPlayer);
    }

    // create waiting for players notification
    function waitingForPlayers(num) {
        $(".no-scores").show();
        $(".scores").hide();
        if (num === 2) {
            $(".no-scores").html("<div class='waiting'>Waiting for two players!</div>");
        } else {
            $(".no-scores").html("<div class='waiting'>Waiting for one more player!</div>");
        }
    }

    // create scoreboard 
    function createScoreboard () {
        dbPlayers.once("value").then(function(snap) {
            $(".no-scores").hide();
            $(".scores").show();
            console.log("check scoreboard ran -----");
            $(".scores").empty();
            var tie = $("<div>").addClass("tie").text("tie: " + snap.val().tie);
            var plyr1score = $("<div>").addClass("player1-score").text(snap.val().player1.name + ": " + snap.val().player1.score);
            var plyr2score = $("<div>").addClass("player2-score").text(snap.val().player2.name + ": " + snap.val().player2.score);
                    
            $(".scores").append(plyr1score, tie, plyr2score);

            var p1Name = $("<div>").addClass("name-div").attr("id", "player1-name").text(snap.val().player1.name);
            $(".player1").prepend(p1Name);
            var p2Name = $("<div>").addClass("name-div").attr("id", "player2-name").text(snap.val().player2.name);
            $(".player2").prepend(p2Name);

            createTimer();
        });
    }
    
    // add player to database and disconnect functionality
    function addPlayer(event) {
        event.preventDefault();
        // add tie score variable
        dbPlayers.update({
            tie: 0
        });

        if (this.value == 1) {
            isPlayer1 = true;
            var playerName = $("#player1-name").val();
            console.log("player1 name ", playerName);
            dbPlayer1.update({
                name: playerName,
                score: 0
            });
            dbPlayer1.onDisconnect().remove();
        }
        if (this.value == 2) {
            isPlayer2 = true;
            var playerName = $("#player2-name").val();
            dbPlayer2.update({
                name: playerName,
                score: 0
            });
            dbPlayer2.onDisconnect().remove();
        }
        console.log("player 1? ", isPlayer1, " or Player 2? ", isPlayer2);
    }
    
    // create the rock paper scissors buttons
    function createRPS() {
        var rpsDiv = $("<div>").addClass("rps-div");
        var rpsTextDiv = $("<div>").addClass("announcement").text("Choose rock, paper or scissors within 5 seconds!");
        var rock = $("<button>")
            .addClass("rock")
            .text("Rock");
        var paper = $("<button>")
            .addClass("paper")
            .text("Paper");
        var scissors = $("<button>")
            .addClass("scissors")
            .text("Scissors");

        rpsDiv.append(rpsTextDiv, rock, paper, scissors)

        return rpsDiv;
    }
    
    // assign the RPS buttons to player and create specific values for buttons per player
    function assignRPStoPlayer() {
        var rpsDiv = createRPS();
        if (isPlayer1) {            
            $(".player1").append(rpsDiv);
            $(".player1 .rock").attr("id", "rock-1");
            $(".player1 .paper").attr("id", "paper-1");
            $(".player1 .scissors").attr("id", "scissors-1");
        } else if (isPlayer2) {
            $(".player2").append(rpsDiv);
            $(".player2").append(rpsDiv);
            $(".player2 .rock").attr("id", "rock-2");
            $(".player2 .paper").attr("id", "paper-2");
            $(".player2 .scissors").attr("id", "scissors-2");
        }
    }

    function createTimer() {
        var seconds = 5;

        for (var i = 1; i < 3; i++) {
            var timerDiv = $("<div>").addClass("timer");
            var nameId = "#player" + i + "-name";
            $(nameId).append(timerDiv);
        }

        timer = setInterval(function(){
            $(".timer").text(seconds);
            seconds--;

            if (seconds < 0) {
                clearInterval(timer);
            }
        }, 1000);
    }
});

