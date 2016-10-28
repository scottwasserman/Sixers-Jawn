
//getScoresForGame("0021600011");


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
    "Yo man!"
];

var LOSE_MESSAGES = [
    "We'll get them next time!",
    "Dang!"
];

getGameLog();

function getGameLog() {
	var http = require('http');
	var url = "http://stats.nba.com/stats/teamgamelog/?TeamID=1610612755&LeagueID=00&seasonType=Regular%20Season&season=2016-17";
	//var url = "http://stats.nba.com/stats/teamgamelog/?TeamID=1610612755&LeagueID=00&seasonType=Preseason&season=2016-17";
	
	http.get(url, function(response) {
		var finalData = "";

	 	response.on("data", function (data) {
	 		finalData += data.toString();
	  	});
		
		response.on("end", function() {
	    	handleGameLogCallback(finalData);
	  	});

	 	response.on("error", function(err) {
  			weFailed(err);
		});
	});
}


function handleGameLogCallback(data) {
	var jsonData = JSON.parse(data);

	var teamGameLogResultSet = getResultSetByName(jsonData.resultSets,"TeamGameLog");

	var gameIdIdx = getIndexOfProperty(teamGameLogResultSet,"Game_ID");
	var gameDateIdx = getIndexOfProperty(teamGameLogResultSet,"GAME_DATE");

	var gameId = teamGameLogResultSet.rowSet[0][gameIdIdx];
	var gameDate = teamGameLogResultSet.rowSet[0][gameDateIdx];
	
	console.log("Found: " + gameId + " on " + gameDate);
	getScoresForGame(gameId);
}

function getScoresForGame(gameID) {
	var http = require('http');
	var url = "http://stats.nba.com/stats/boxscoresummaryv2?GameID=" + gameID;
	http.get(url, function(response) {
	 	var finalData = "";

	 	response.on("data", function (data) {
	 		finalData += data.toString();
	  	});
		
		response.on("end", function() {
	    	handleScoreCallback(finalData);
	  	});

	 	response.on("error", function(err) {
  			weFailed(err);
		});
	});
}

function handleScoreCallback(data) {
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
	if (sixersPoints == null || opponentPoints == null || opponentPoints == null) {
		weFailed();
	}
	else {
		if (gameCompleted) {
			if (sixersPoints > opponentPoints) {
				winning = true;
				gameResultsString = randomMessageByType("WIN") + " " + whenWasTheGame + " The Sixers beat The" + opponentNickname + " " + sixersPoints + " to " + opponentPoints + ". We're " + winLossString + " now.";
			}
			else {
				winning = false;
				gameResultsString = randomMessageByType("LOSE") + " " + whenWasTheGame + " The Sixers lost to The " + opponentNickname + " " + opponentPoints + " to " + sixersPoints + ". We're " + winLossString + " now.";
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

function weFailed(err) {
	var gameResultsString =  randomMessageByType("ERROR") + " I can't get the scores right now. Try back in a back.";
	console.log(gameResultsString);
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


