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
// create locations for items in db
var dbPlayers = database.ref("/players");
var dbPlayer1 = database.ref("/players/player1");
var dbPlayer2 = database.ref("/players/player2");
var dbScores = database.ref("/scores");
var dbAnswers = database.ref("/answers");
// create location for connections in database
var connectionsRef = database.ref("/connections");
var connectedRef = database.ref(".info/connected");

$(document).ready(function() {
    // Your web app's Firebase configuration

    // local variable to keep track of players
    var isPlayer1 = false;
    var isPlayer2 = false;
    var timer;
    
    // when players are added or removed update the game status
    dbPlayers.on("value", checkGameStatus);

    // when scores change update scoreboard and answers
    dbScores.on("value", function(snap) {
        if (snap.val() != null) {
            // clear out the timer for all players
            clearInterval(timer);
            // update the scoreboard
            updateScoreboard();
            // clear out the answers
            dbAnswers.update({
                player1: "none",
                player2: "none"
            });
            // assign rock paper scissors buttons to players
            assignRPStoPlayer();
            // start the timer
            startTimer();
        } else {
            // clear out rock paper scissors buttons as someone dropped
            clearRPSDiv();
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
    connectionsRef.on("value", function(snap) {
        console.log(snap.numChildren());
    });

    // function to check the status of the game
    function checkGameStatus() {
        // remove form as another form will be created if needed
        $(".player1 form").remove();
        $(".player2 form").remove();
        // reference the database for values
        database.ref().once("value").then(function(snap) {
            // if players parent exists
            if (snap.val().players != undefined) {
                // if both players exist
                if (snap.val().players.player1 != undefined && snap.val().players.player2 != undefined) {
                    if (isPlayer1 || isPlayer2) {
                        // has the game started with 2 players?
                        console.log("--!! initialized is true !!--")
                        // initializie scores
                        initializeScores();
                        // create timer divs
                        createTimers();
                    }
                    return "both";
                }
                // neither players are chosen
                else if (snap.val().players.player1 === undefined && snap.val().players.player2 === undefined) {
                    // has the game started with 2 players?
                    $(".player1").empty();
                    $(".player2").empty();
                    // neither player has joined - request both players
                    requestPlayer1();
                    requestPlayer2();
                    // add notice that we are waiting on players
                    waitingForPlayers(2);
                    return "neither";
                }
                // only player 1 is chosen
                else if (snap.val().players.player1 != undefined) {
                    // has the game started with 2 players?
                    $(".player1").empty();
                    $(".player2").empty();
                    // add notice that we are waiting on players
                    waitingForPlayers(1);
                    if (!isPlayer1) {
                        requestPlayer2();
                    }
                    return "player1";
                }
                // otherwise just player 2 is chosen
                else {
                    // has the game started with 2 players?
                    $(".player1").empty();
                    $(".player2").empty();
                    // add notice that we are waiting on players
                    waitingForPlayers(1);
                    if (!isPlayer2) {
                        requestPlayer1();
                    }
                    return "player2"
                }
            } else {
                // has the game started with 2 players?
                $(".player1").empty();
                $(".player2").empty();
                // neither player has joined - request for both players
                requestPlayer1();
                requestPlayer2();
                // add notice that we are waiting on players
                waitingForPlayers(2);
                return "neither";
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

    // add player to database and disconnect functionality
    function addPlayer(event) {
        event.preventDefault();
        // add player 1 to db
        if (this.value == 1) {
            isPlayer1 = true;
            var playerName = $("#player1-name").val();
            dbPlayer1.set({
                name: playerName,
            });
            dbPlayer1.onDisconnect().remove();
            dbAnswers.set({
                player1: "none"
            });
        }
        // add player 2 to db
        if (this.value == 2) {
            isPlayer2 = true;
            var playerName = $("#player2-name").val();
            dbPlayer2.set({
                name: playerName,
            });
            dbPlayer2.onDisconnect().remove();
            dbAnswers.set({
                player2: "none"
            });
        }
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

    // initialize scores
    function initializeScores() {
        dbScores.update({
            tie: 0,
            player1: 0,
            player2: 0
        });
        dbScores.onDisconnect().remove();
    }

    // create and update scoreboard
    function updateScoreboard () {
        database.ref().once("value").then(function(snap) {
            $(".scores").show();
            $(".no-scores").hide();
            $(".scores").empty();
            var scoreHeader = $("<div>").addClass("scores-header").text("---- Scores ----");
            var tie = $("<div>").addClass("tie").text("tie: " + snap.val().scores.tie);
            var plyr1score = $("<div>").addClass("player1-score").text(snap.val().players.player1.name + ": " + snap.val().scores.player1);
            var plyr2score = $("<div>").addClass("player2-score").text(snap.val().players.player2.name + ": " + snap.val().scores.player2);
                    
            $(".scores").append(scoreHeader, plyr1score, tie, plyr2score);
        });
    }
    
    // create the rock paper scissors buttons
    function createRPS() {
        var rpsDiv = $("<div>").addClass("rps-div");
        var rpsTextDiv = $("<div>").addClass("announcement").text("Choose rock, paper or scissors within 5 seconds!");
        var rock = $("<img>")
            .addClass("rock rps-button")
            .attr({
                src: "assets/img/rock.png",
                alt: "rock"
            })
            .text("Rock");
        var paper = $("<img>")
            .addClass("paper rps-button")
            .attr({
                src: "assets/img/paper.png",
                alt: "paper"
            })
            .text("Paper");
        var scissors = $("<img>")
            .addClass("scissors rps-button")
            .attr({
                src: "assets/img/scissors.png",
                alt: "scissors"
            })
            .text("Scissors");

        rpsDiv.append(rpsTextDiv, rock, paper, scissors);

        return rpsDiv;
    }
    
    // assign the RPS buttons to player and create specific values for buttons per player
    function assignRPStoPlayer() {
        var rpsDiv = createRPS();
        if (isPlayer1) {            
            $(".player1").append(rpsDiv);
            $(".player1 .rock").attr({
                id: 1,
                value: "rock"
            });
            $(".player1 .paper").attr({
                id: 1,
                value: "paper"
            });
            $(".player1 .scissors").attr({
                id: 1,
                value: "scissors"
            });
        } else if (isPlayer2) {
            $(".player2").append(rpsDiv);
            $(".player2 .rock").attr({
                id: 2,
                value: "rock"
            });
            $(".player2 .paper").attr({
                id: 2,
                value: "paper"
            });
            $(".player2 .scissors").attr({
                id: 2,
                value: "scissors"
            });
        }
        console.log("-----running assignRPS -----")
        $(".rps-button").on("click", rpsClick)
    }

    // clear the rock paper scissors buttons 
    function clearRPSDiv() {
        $(".rps-div").remove();
    }
    
    // update db when rock paper scissors are clicked
    function rpsClick() {
        console.log("----- value of button -----")
        console.log(this.alt)
        if (isPlayer1) {
            $(".rps-div").remove();
            dbAnswers.update({
                player1: this.alt,
            });
        }
        if (isPlayer2) {
            $(".rps-div").remove();
            dbAnswers.update({
                player2: this.alt,
            });
        }
        checkAnswers();
    }

    // create a timer for the game
    function createTimers() {
        // only for the players
        if (isPlayer1 || isPlayer2) {
            // create divs for timers and attach them to players
            var timerDiv = $("<div>").addClass("timer");
            var timerTxt = $("<div>").addClass("timer-text");
            $(timerDiv).append(timerTxt);
            $(".players").append(timerDiv);
        }
    }
    
    // start the timer
    function startTimer() {
        if (isPlayer1 || isPlayer2) {
            // set the number of seconds to countdown
            var seconds;
            seconds = 6;
            // start timer until it reaches 0
            timer = setInterval(function(){
                $(".timer-text").text(seconds);
                seconds--;

                if (seconds < 0) {
                    clearInterval(timer);
                    clearRPSDiv();
                    console.log("---- timeout ----")
                    $(".timer-text").text("Time's up!!");
                    setTimeout(function() {
                        if (isPlayer1) {
                            database.ref().once("value").then(function(snap) {
                                if (snap.val().answers.player1 != "none") {
                                    var ply1score = snap.val().scores.player1;
                                    ply1score++; 
                                    dbScores.update({
                                        player1: ply1score
                                    });
                                } else if (snap.val().answers.player2 != "none") {
                                    var ply2score = snap.val().scores.player2;
                                    ply2score++;
                                    dbScores.update({
                                        player2: ply2score
                                    });
                                } else {
                                    var pTie = snap.val().scores.tie;
                                    pTie++;
                                    dbScores.update({
                                        tie: pTie
                                    });
                                }
                            });
                        }
                        if (isPlayer2) {
                            console.log("---waiting for timeout---");
                        }
                    }, 1000);

                }
            }, 1000);
        }
    }

    // check database for rps answers and evaluate if both entered
    function checkAnswers() {
        database.ref().once("value").then(function(snap) {
            // check for both players answers
            var p1Ans = snap.val().answers.player1;
            var p2Ans = snap.val().answers.player2;
            var p1score = snap.val().scores.player1;
            var pTie = snap.val().scores.tie;
            var p2score = snap.val().scores.player2;

            p1score++;
            p2score++;
            pTie++;

            // if either answer is none (someone hasnt responded) wait for response
            if (p1Ans === "none" || p2Ans === "none") {
                return false;
            }

            if (p1Ans === "rock") {
                if (p2Ans === "rock") {
                    dbScores.update({
                        tie: pTie
                    });
                }
                else if (p2Ans === "paper") {
                    dbScores.update({
                        player2: p2score
                    });
                }
                else {
                    dbScores.update({
                        player1: p1score
                    });
                }
            } else if (p1Ans === "paper") {
                if (p2Ans === "rock") {
                    dbScores.update({
                        player1: p1score
                    });
                }
                else if (p2Ans === "paper") {
                    dbScores.update({
                        tie: pTie
                    });
                }
                else {
                    dbScores.update({
                        player2: p2score
                    });
            }
            } else {
                if (p2Ans === "rock") {
                    dbScores.update({
                        player2: p2score
                    });
                }
                else if (p2Ans === "paper") {
                    dbScores.update({
                        player1: p1score
                    });
                }
                else {
                    dbScores.update({
                        tie: pTie
                    });
                }
            }
        });
    }

    function youWon() {
        var winDiv = $("<div>").addClass("results").text("You won!");
        $(".results-box").prepend(winDiv);
    }

    function youLost() {
        var lostDiv = $("<div>").addClass("results").text("You lost!");
        $(".results-box").prepend(lostDiv);
    }

    function youTied() {
        var tieDiv = $("<div>").addClass("results").text("You tied!");
        $(".results-box").prepend(tieDiv);
    }

    var dbP1Score = database.ref("/scores/player1");
    var dbP2Score = database.ref("/scores/player2");
    var dbTieScore = database.ref("/scores/tie");

    dbP1Score.on("value", function(snap){
        if (snap.val() != 0) {
            if (isPlayer1) {
                youWon();
            }
            else if (isPlayer2) {
                youLost();
            }
        }
    });

    dbP2Score.on("value", function(snap){
        if (snap.val() != 0) {
            if (isPlayer1) {
                youLost();
            }
            else if (isPlayer2) {
                youWon();
            }
        }
    });

    dbTieScore.on("value", function(snap){
        if (snap.val() != 0) {
            if (isPlayer1) {
                youTied();
            }
            else if (isPlayer2) {
                youTied();
            }
        }
    });
    
});

