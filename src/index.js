/**
    Copyright 2016 Scott L. Wasserman. All Rights Reserved.
*/

/**
 * Messages
 */
var ERROR_MESSAGES = [
    "Dang!",
    "Bummer!",
    "Well that sucks!",
    "Doh!",
    "Dude, Really!",
    "What the!"
];

var WIN_MESSAGES = [
    "Yes!",
    "Alright, Alright, Alright!",
    "Philly in the house!",
    "Philly won up in here!",
    "In your face!",
    "Go Philly!"
];

var LOSE_MESSAGES = [
    "We'll get them next time!",
    "Dang!",
    "Come on Philly!",
    "Sucks!",
    "What the heck!",
    "Disapointing!"
];

/**
 * App ID for the skill
 */
var APP_ID = undefined; //OPTIONAL: replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

var Skill = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
Skill.prototype = Object.create(AlexaSkill.prototype);
Skill.prototype.constructor = Skill;

Skill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    //console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

Skill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    //console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleHelpRequest(response);
};

/**
 * Overridden to show that a subclass can override this function to teardown session state.
 */
Skill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    //console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

Skill.prototype.intentHandlers = {
    "WhatsUpIntent": function (intent, session, response) {
        handleWhatsUpRequest(response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        handleHelpRequest(response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Stopping. Talk to you later";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Cancelling. Talk to you later";
        response.tell(speechOutput);
    }
};

function handleHelpRequest(response) {
    response.ask("I'm a Sixers fan just like you. I'll be here to keep you update to date on the latest score. Just ask me what's up!");
}


function handleWhatsUpRequest(response) { 
    getGameLog(response);
}

function getGameLog(response) {
    var http = require('http');
    var url = "http://stats.nba.com/stats/teamgamelog/?TeamID=1610612755&LeagueID=00&seasonType=Regular%20Season&season=2016-17";

    http.get(url, function(http_response) {
        var finalData = "";

        http_response.on("data", function (data) {
            finalData += data.toString();
        });
        
        http_response.on("end", function() {
            handleGameLogCallback(response,finalData);
        });

        http_response.on("error", function(err) {
            weFailed(response,err);
        });
    });
}


function handleGameLogCallback(response,data) {
    var jsonData = JSON.parse(data);

    var teamGameLogResultSet = getResultSetByName(jsonData.resultSets,"TeamGameLog");

    var gameIdIdx = getIndexOfProperty(teamGameLogResultSet,"Game_ID");
    var gameDateIdx = getIndexOfProperty(teamGameLogResultSet,"GAME_DATE");

    var gameId = teamGameLogResultSet.rowSet[0][gameIdIdx];
    var gameDate = teamGameLogResultSet.rowSet[0][gameDateIdx];
    
    console.log("Found: " + gameId + " on " + gameDate);
    getScoresForGame(response,gameId);
}

function getScoresForGame(response,gameID) {
    var http = require('http');
    var url = "http://stats.nba.com/stats/boxscoresummaryv2?GameID=" + gameID;
    http.get(url, function(http_response) {
        var finalData = "";

        http_response.on("data", function (data) {
            finalData += data.toString();
        });
        
        http_response.on("end", function() {
            handleScoreCallback(response,finalData);
        });

        http_response.on("error", function(err) {
            weFailed(response,err);
        });
    });
}

function handleScoreCallback(response,data) {
    var jsonData = JSON.parse(data);

    var gameSummaryResultSet = getResultSetByName(jsonData.resultSets,"GameSummary");
    var gameSummaryTextIdx = getIndexOfProperty(gameSummaryResultSet,"GAME_STATUS_TEXT");
    var gameSummaryText = gameSummaryResultSet.rowSet[0][gameSummaryTextIdx];
    var gameCompleted = gameSummaryText == "Final";

    var lineScoreResultSet = getResultSetByName(jsonData.resultSets,"LineScore");
    var pointsIdx = getIndexOfProperty(lineScoreResultSet,"PTS");
    var nicknameIdx = getIndexOfProperty(lineScoreResultSet,"TEAM_NICKNAME");
    var gameDateIdx = getIndexOfProperty(lineScoreResultSet,"GAME_DATE_EST");
    var winLossIdx = getIndexOfProperty(lineScoreResultSet,"TEAM_WINS_LOSSES");

    var gameDateString = lineScoreResultSet.rowSet[0][gameDateIdx];
    var gameDate = Date.parse(gameDateString);
    var rawDate = new Date();
    var today = new Date(rawDate.getFullYear(),rawDate.getMonth(),rawDate.getDate());
    var dateDifference = today-gameDate;
    var oneDayEpoch = 24*60*60*1000;
    var daysAgo = (dateDifference/oneDayEpoch).toFixed();

    var whenWasTheGame = null;
    if (gameDate < today) {
        if (daysAgo == 1) {
            whenWasTheGame = "Yesterday";
        }
        else {
            whenWasTheGame = "The other day";
        }
        
    }
    else {
        whenWasTheGame = "Today";
    }


    var firstNickname = lineScoreResultSet.rowSet[0][nicknameIdx];
    var firstPoints = lineScoreResultSet.rowSet[0][pointsIdx];
    var secondNickname = lineScoreResultSet.rowSet[1][nicknameIdx];
    var secondPoints = lineScoreResultSet.rowSet[1][pointsIdx];

    var sixersPoints = null;
    var opponentPoints = null;
    var opponentNickname = null;
    var winLossString = null;

    if (firstNickname == "76ers") {
        sixersPoints = firstPoints;
        opponentPoints = secondPoints;
        opponentNickname = secondNickname;
        winLossString = lineScoreResultSet.rowSet[0][winLossIdx];
    }
    else {
        opponentPoints = firstPoints;
        opponentNickname = firstNickname;
        sixersPoints = secondPoints;
        winLossString = lineScoreResultSet.rowSet[1][winLossIdx];
    }

    winLossString = winLossString.replace("-"," and ");

    var gameResultsString = "";
    var winning = null;
    if (sixersPoints === null || opponentPoints === null || opponentPoints === null) {
        weFailed();
    }
    else {
        if (gameCompleted) {
            if (sixersPoints > opponentPoints) {
                winning = true;
                gameResultsString = randomMessageByType("WIN") + " " + whenWasTheGame + " The Sixers beat The" + opponentNickname + " " + sixersPoints + " to " + opponentPoints + ". We're " + winLossString + " for the season now.";
            }
            else {
                winning = false;
                gameResultsString = randomMessageByType("LOSE") + " " + whenWasTheGame + " The Sixers lost to The " + opponentNickname + " " + opponentPoints + " to " + sixersPoints + ". We're " + winLossString + " for the season now.";
            }
        }
        else {
            if (sixersPoints > opponentPoints) {
                winning = true;
                gameResultsString = "Game in progress, the Sixers are beating The" + opponentNickname + " " + sixersPoints + " to " + opponentPoints;
            }
            else {
                winning = false;
                gameResultsString = "Game in progress, the Sixers are losing to The " + opponentNickname + " " + opponentPoints + " to " + sixersPoints;
            }
        }

        console.log(gameResultsString);
        response.tell(gameResultsString);
    }
 }

 function randomMessageByType(messageType) {
    if (messageType == "WIN") {
        var winMessageIndex = Math.floor(Math.random() * WIN_MESSAGES.length);
        var randomWinMessage = WIN_MESSAGES[winMessageIndex];
        return randomWinMessage;
    }
    
    if (messageType = "LOSE") {
        var loseMessageIndex = Math.floor(Math.random() * LOSE_MESSAGES.length);
        var randomLoseMessage = LOSE_MESSAGES[loseMessageIndex];
        return randomLoseMessage;
    }

    if (messageType = "ERROR") {
        var errorIndex = Math.floor(Math.random() * ERROR_MESSAGES.length);
        var randomError = ERROR_MESSAGES[errorIndex];
    }
 }

function weFailed(response,err) {
    var errorString =  randomMessageByType("ERROR") + " I can't get the scores right now. Try back in a little bit.";
    console.log(gameResultsString);
    response.tell(errorString);
}

function getIndexOfProperty(resultSet,propertyName) {
    var idx = null;
    for (var i=0;i<resultSet.headers.length;i++) {
        if (currResultSet.headers[i] == propertyName) {
            idx = i;
        }
    }   
    return idx;
}

function getResultSetByName(resultSets,resultName) {
    var resultSet = null;

    for (var i=0;i<resultSets.length;i++) {
        currResultSet = resultSets[i];
        if (currResultSet.name == resultName) {
            resultSet = currResultSet;
            break;
        }
    }
    return resultSet;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var skill = new Skill();
    skill.execute(event, context);
};

