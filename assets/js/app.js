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
var dbChat = database.ref("/chat");
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
            if (isPlayer1 || isPlayer2) {
                // assign rock paper scissors buttons to players
                assignRPStoPlayer();
                // start the timer
                startTimer();
            }
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
        var connections = $("<div>").addClass("connections")
        if (snap.numChildren() === 1)
            connections.text("There is currently " + snap.numChildren() + " person connected.");
        else {
            connections.text("There are currently " + snap.numChildren() + " people connected.");
        }

        $(".connections").remove();
        $("header").append(connections);
        
    });

    // function to check the status of the game
    function checkGameStatus() {
        // remove form as another form will be created if needed
        $(".player-form").remove();
        // reference the database for values
        database.ref().once("value").then(function(snap) {
            // if players parent exists
            if (snap.val().players != undefined) {
                // if both players exist
                if (snap.val().players.player1 != undefined && snap.val().players.player2 != undefined) {
                    createChatbox();
                    if (isPlayer1 || isPlayer2) {
                        // initializie scores
                        initializeScores();
                        // create timer divs
                        createTimers();
                        // create a chat box
                        // create a results section
                        var resultsDiv = $("<div>").addClass("results-box");
                        $(".player-section").append(resultsDiv);                
                    }
                    return "both";
                }
                // neither players are chosen
                else if (snap.val().players.player1 === undefined && snap.val().players.player2 === undefined) {
                    // clear out the interval timer if exists
                    clearInterval(timer);
                    $(".player-section").empty();
                    // neither player has joined - request both players
                    requestPlayer();
                    // add notice that we are waiting on players
                    waitingForPlayers(2);
                    return "neither";
                }
                // only player 1 is chosen
                else if (snap.val().players.player1 != undefined) {
                    // clear out the interval timer if exists
                    clearInterval(timer);
                    $(".player-section").empty();
                    // $(".timer").remove();
                    // $(".chatbox").remove();
                    // $(".announcement").remove();
                    // add notice that we are waiting on players
                    waitingForPlayers(1);
                    // if user is not player 1, request player 
                    if (!isPlayer1) {
                        requestPlayer();
                    } else {
                        $(".results-box").remove();
                    }
                    return "player1";
                }
                // otherwise just player 2 is chosen
                else {
                    // clear out the interval timer if exists
                    clearInterval(timer);
                    $(".player-section").empty();
                    // add notice that we are waiting on players
                    waitingForPlayers(1);
                    // if user is not player 2, request player
                    if (!isPlayer2) {
                        requestPlayer();
                    } else {
                        $(".results-box").remove();
                    }
                    return "player2"
                }
            } else {
                // clear out the interval timer if exists
                clearInterval(timer);
                $(".player-section").empty();
                // neither player has joined - request players
                requestPlayer();
                // add notice that we are waiting on players
                waitingForPlayers(2);
                return "neither";
            }
        });
    }

    // create the generic player form for new players
    function createPlayerForm() {
        // create generic form for player input
        var form = $("<form>").addClass("player-form");
        var labelName = $("<label>").addClass("name-label");
        var inputName = $("<input>").addClass("name-input").attr({
            type: "text",
            placeholder: "Enter your name"
        });
        var submitBtn = $("<button>").addClass("submit-btn player-submit").text("Enter Game");

        form.append(labelName, inputName, submitBtn);
        return form;
    }
    
    
    // create player 1 field for new players
    function requestPlayer() {
        // create specific attr and classes for player 1
        console.log("/player1 doesnt exist");
        $(".player-section").empty();
        var playerForm = createPlayerForm();
        $(".player-section").append(playerForm);
        $(".player-section label").attr("for", "player-name").text("Player: ");
        $(".player-section input").attr("id", "player-name");
        
        $(".player-submit").on("click", addPlayer);
    }

    // add player to database and disconnect functionality
    function addPlayer(event) {
        // prevent the submit button default behavior
        event.preventDefault();
        // get data from the database
        dbPlayers.once("value").then(function(snap) {
            // add player 1 to db if doesnt exist
            if (snap.val() === null || snap.val().player1 === undefined) {
                isPlayer1 = true;
                var playerName = $("#player-name").val();
                dbPlayer1.set({
                    name: playerName,
                });
                dbPlayer1.onDisconnect().remove();
                // set inital value for answer
                dbAnswers.set({
                    player1: "none"
                });
            } else {
                // add player 2 to db
                isPlayer2 = true;
                var playerName = $("#player-name").val();
                dbPlayer2.set({
                    name: playerName,
                });
                dbPlayer2.onDisconnect().remove();
                // set inital value for answer
                dbAnswers.set({
                    player2: "none"
                });
            }
        });
    }

    // create waiting for players notification
    function waitingForPlayers(num) {
        $(".no-scores").show();
        $(".scores").hide();
        if (num === 2) {
            $(".no-scores").html("<div class='waiting'>Waiting for two players!</div>");
        } else {
            if (isPlayer1 || isPlayer2) {
                $(".no-scores").html("<div class='waiting'>Please wait. We are looking for another player!</div>");
            } else {
                $(".no-scores").html("<div class='waiting'>Waiting for one more player!</div>");
            }
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
        var rpsDiv = $("<div>").addClass("rps-choice");
        var announcement = $("<div>").addClass("announcement").text("Choose rock, paper or scissors within 6 seconds!");
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
        
        $(".player-section").append(announcement);
        rpsDiv.append(rock, paper, scissors);

        return rpsDiv;
    }
    
    // assign the RPS buttons to player and create specific values for buttons per player
    function assignRPStoPlayer() {
        var rpsDiv = createRPS();
        $(".player-section").append(rpsDiv);
        $(".rps-choice .rock").attr({
            value: "rock"
        });
        $(".rps-choice .paper").attr({
            value: "paper"
        });
        $(".rps-choice .scissors").attr({
            value: "scissors"
        });

        console.log("-----running assignRPS -----")
        $(".rps-button").on("click", rpsClick)
    }

    // clear the rock paper scissors buttons 
    function clearRPSDiv() {
        $(".rps-choice").remove();
    }
    
    // update db when rock paper scissors are clicked
    function rpsClick() {
        console.log("----- value of button -----")
        console.log(this.alt)
        if (isPlayer1) {
            $(".rps-choice").remove();
            dbAnswers.update({
                player1: this.alt,
            });
        }
        if (isPlayer2) {
            $(".rps-choice").remove();
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
            $(".player-section").append(timerDiv);
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
                $(".timer-text").html("<span class='countdown'>" + seconds + "</span>");
                seconds--;

                if (seconds < 0) {
                    clearInterval(timer);
                    clearRPSDiv();
                    $(".timer-text").html("<span class='times-up'>Time's up!!</span>");
                    setTimeout(function() {
                        if (isPlayer1) {
                            database.ref().once("value").then(function(snap) {
                                // if only player 1 answers - player 1 wins
                                if (snap.val().answers.player1 != "none") {
                                    var ply1score = snap.val().scores.player1;
                                    ply1score++; 
                                    dbScores.update({
                                        player1: ply1score
                                    });
                                // if only player 2 answers - player 2 wins
                                } else if (snap.val().answers.player2 != "none") {
                                    var ply2score = snap.val().scores.player2;
                                    ply2score++;
                                    dbScores.update({
                                        player2: ply2score
                                    });
                                // tie if no one answers
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
    
    function createChatbox() {
        var chatbox = $("<div>").addClass("chatbox");
        var chatview = $("<div>").addClass("chatview");
        var chatForm = $("<form>").addClass("chat-form");
        var chatInput = $("<input>").addClass("chat-input").attr({
            type: "text",
            placeholder: "Talk smack to your oppontent!"
        })
        var submitBtn = $("<button>").addClass("submit-btn").attr("id", "chat-submit").text("Enter");
        
        chatForm.append(chatInput, submitBtn);
        chatbox.append(chatview, chatForm);

        
        $(".player-section").append(chatbox);
        
        if (!isPlayer1 && !isPlayer2) {
            console.log("ran is not player1 or player2 for chatbox watcher")
            $(".chatbox").attr("id", "watcher");
        }

        $("#chat-submit").on("click", function(event) {
            event.preventDefault();
            var chatMsgOwner = "Watcher";
            dbPlayers.once("value").then(function(snap) {
                if (isPlayer1) {
                    chatMsgOwner = snap.val().player1.name;
                } else if (isPlayer2) {
                    chatMsgOwner = snap.val().player2.name;
                }
                var chatVal = $(".chat-input").val();
                var chatMsgAll = chatMsgOwner + ": " + chatVal;
    
                dbChat.set({
                    chat: chatMsgAll,
                });
            });           
        });
    }

    dbChat.on("value", function(snapchat) {
        if (snapchat.val() != null) {
            if (snapchat.val().chat != "") {
                var chatMsg = $("<p>").addClass("chat-msg");
                chatMsg.text(snapchat.val().chat);
                
                $(".chatview").append(chatMsg);

                var scrollHeight;
                scrollHeight = $(".chatview").prop('scrollHeight');
                console.log(scrollHeight + " is scrollHeight");
                $(".chatview").scrollTop(scrollHeight);
                $(".chat-input").val("");
                
                dbChat.remove();
            }
        }
    });

});