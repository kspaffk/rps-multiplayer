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
        database.ref().once("value").then(function(snap) {
            // both players are chosen
            if (snap.val().player1 != undefined && snap.val().player2 != undefined) {
                createScoreboard();
                return "both";
            }
            // neither players are chosen
            else if (snap.val().player1 === undefined && snap.val().player2 === undefined) {
                requestPlayer1();
                requestPlayer2();
                waitingForPlayers();
                return "neither";
            }
            // only player 1 is chosen
            else if (snap.val().player1 != undefined) {
                requestPlayer2();
                waitingForPlayers();
                return "player1";
            }
            // otherwise just player 2 is chosen
            else {
                requestPlayer1();
                waitingForPlayers();
                return "player2"
            }
        });
    }

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
    
    
    // create fields for new players if there arent 2 already
    function requestPlayer1() {
        // create specific attr and classes for player 1
        console.log("/player1 doesnt exist");
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

    function requestPlayer2() {
        // create specific attr and classes for player 2
        console.log("/player2 doesnt exist");
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
    function waitingForPlayers() {
        $(".no-scores").show();
        $(".scores").hide();
        $(".no-scores").html("<div class='waiting'>Waiting for two players!</div>");
    }

    function createScoreboard () {
        $(".no-scores").hide();
        $(".scores").show();
        console.log("check scoreboard ran -----");
        $(".scores").empty();
        var tie = $("<div>").addClass("tie").text("tie: " + snap.val().tie);
        var plyr1score = $("<div>").addClass("player1-score").text(snap.val().player1.name + ": " + snap.val().player1.score);
        var plyr2score = $("<div>").addClass("player2-score").text(snap.val().player2.name + ": " + snap.val().player2.score);
                
        $(".scores").append(plyr1score, tie, plyr2score);
    }
        
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
    
    
    // create player area for either player 1 or 2
    function createPlayerArea() {
        database.ref().once("value").then(function(snap) {
            var btnsDiv = $("<div>").addClass("btns-div");
            var rockBtn = $("<button>")
            .addClass("rock")
            .text("Rock");
            var paperBtn = $("<button>")
            .addClass("paper")
            .text("Paper");
            var scissorsBtn = $("<button>")
            .addClass("scissors")
            .text("Scissors");
            
            if (isPlayer1) {            
                var nameDiv = $("<div>").addClass("name-div");
                nameDiv.text(snap.val().player1.name);
                $(".player1").empty();
                btnsDiv.append(nameDiv).append(rockBtn, paperBtn, scissorsBtn);
                $(".player1").append(btnsDiv);
            } else if (isPlayer2) {
                var nameDiv = $("<div>").addClass("name-div");
                nameDiv.text(snap.val().player2.name);
                $(".player2").empty();
                btnsDiv.append(nameDiv).append(rockBtn, paperBtn, scissorsBtn);
                $(".player2").append(btnsDiv);
            }            
        });        
    }
    
});

