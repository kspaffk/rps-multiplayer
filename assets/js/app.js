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
    var dbPlayer1 = database.ref("/player1");
    var dbPlayer2 = database.ref("/player2");
    // create location for connections in database
    var connectionsRef = database.ref("/connections");
    var connectedRef = database.ref(".info/connected");

    // remove this once you have the updates to connections
    
    // local variable to keep track of players
    var isPlayer1 = false;
    var isPlayer2 = false;

    gameInit();
    
    database.ref("/player1").on("value", function(snap) {
        console.log(snap.val());
        if (snap.val()) {
            $(".player1").empty();
            createPlayerArea();
        }
    });
    
    database.ref("/player2").on("value", function(snap) {
        console.log(snap.val());
        if (snap.val()) {
            $(".player2").empty();
            createPlayerArea();
        }
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
    connectionsRef.on("value", function(snap) {});
    
    function gameInit() {
        if (isPlayer1) {
            database.ref().update({
                havePlayer1: false,
                ties: 0,
                player1Score: 0,
                player2Score: 0
            });
1        }
        
        if (isPlayer2) {
            database.ref().update({
                havePlayer2: false,
                ties: 0,
                player1Score: 0,
                player2Score: 0
            });
        }
        requestPlayer();
    }
    
    // create fields for new players if there arent 2 already
    function requestPlayer() {
        database.ref().once("value").then(function(snap) {
            console.log("Have player 1? ", snap.val().havePlayer1, " or have player 2? ", snap.val().havePlayer2);

            if (!snap.val().havePlayer1) {
                dbPlayer1.remove();
                var form = $("<form>");
                    var labelName = $("<label>")
                    .addClass("name-label")
                        .attr("for", "player1-name")
                        .text("Player 1: ");
                        var inputName = $("<input>")
                        .addClass("name-input")
                        .attr({
                            id: "player1-name",
                            type: "text",
                            placeholder: "Enter your name"
                        });
                    var submitBtn = $("<button>")
                    .addClass("submit-btn")
                        .attr({
                            id: "1"
                        })
                        .text("Submit");
                        form.append(labelName, inputName, submitBtn);
                    $(".player1").append(form);
                }

                if (!snap.val().havePlayer2) {
                    dbPlayer2.remove();
                    var form = $("<form>");
                    var labelName = $("<label>")
                        .addClass("name-lbl")
                        .attr("for", "player2-name")
                        .text("Player 2: ");
                    var inputName = $("<input>")
                        .addClass("name-input")
                        .attr({
                            id: "player2-name",
                            type: "text",
                            placeholder: "Enter your name"
                        });
                    var submitBtn = $("<button>")
                        .addClass("submit-btn")
                        .attr({
                            id: "2"
                        })
                        .text("Submit");
                    form.append(labelName, inputName, submitBtn);
                    $(".player2").append(form);
                }
                $(".submit-btn").on("click", addPlayer);
            });
    }

    function addPlayer(event) {
        event.preventDefault();
        console.log("prevented?");

        if (this.id == 1) {
            isPlayer1 = true;
            dbPlayer1.set({
                name: $("#player1-name").val(),
                score: 0
            });
            database.ref().update({
                havePlayer1: true
            });
        }
        if (this.id == 2) {
            isPlayer2 = true;
            dbPlayer2.set({
                name: $("#player2-name").val(),
                score: 0
            });
            database.ref().update({
                havePlayer2: true
            });
        }
        console.log("player 1? ", isPlayer1, " or Player 2? ", isPlayer2);
    }

    // create player area for either player 1 or 2
    function createPlayerArea() {
        var nameDiv = $("<div>").addClass("name-div");
        nameDiv.text(this.name);
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
            console.log("buttons! p1")
            $(".player1").empty();
            $(".player2").html("<div class='waiting'>Waiting on other players!</div>");
            btnsDiv.append(nameDiv).append(rockBtn, paperBtn, scissorsBtn);
            $(".player1").append(btnsDiv);
        } else if (isPlayer2) {
            console.log("buttons! p2")
            $(".player2").empty();
            $(".player1").html("<div class='waiting'>Waiting on other players!</div>");
            btnsDiv.append(nameDiv).append(rockBtn, paperBtn, scissorsBtn);
            $(".player2").append(btnsDiv);
        }
    }

    // clear out the player areas and create a score area for people to watch
    function createWatcherArea() {
        console.log("watcher ran");
        $(".player1").empty();
        $(".player2").empty();
    }
});
