var sourceData = {};
var truths = [];
var dares = [];
var turnCounter = 0;
var players = [];

var currentTask = {};
var caller = {};
var doer = {};

FEMALE = 1;
MALE = 2;

function init() {
    sourceData = {};
    truths = [];
    dares = [];
    turnCounter = 0;
    players = [];
}

function saveState() {
    state = {
        sourceData: sourceData,
        truths: truths,
        dares: dares,
        turnCounter: turnCounter,
        players: players
    };
    console.log("saving");
    console.log(state);
    localStorage.setItem("tdstate", JSON.stringify(state));
}

function loadState() {
    jobj = localStorage.getItem("tdstate");
    if (jobj) {
        state = JSON.parse(jobj);
        sourceData = state.sourceData;
        truths = state.truths;
        dares = state.dares;
        turnCounter = state.turnCounter;
        players = state.players;
        console.log("loaded");
        console.log(state);
        return true;
    } else {
        init();
        return false;
    }
}

function addLevel(levelIndex) {
    level = sourceData.levels[levelIndex];

    newTruths = level.truth.map((truth) => {
        return {
            text: truth,
            level: levelIndex,
            repeat: false,
            done: false
        };
    });

    truths.push(...newTruths);

    newDares = level.dare.map((dare) => {
        lastDot = dare.lastIndexOf(".");
        codes = dare.substring(lastDot);
        sexes = 0;
        if (codes.includes("g")) sexes += FEMALE;
        if (codes.includes("b")) sexes += MALE;
        if (sexes == 0) sexes = MALE + FEMALE;
        return {
            text: dare.substring(0, lastDot + 1),
            level: levelIndex,
            sexes: sexes,
            repeat: codes.includes("*"),
            done: false
        };
    });

    dares.push(...newDares);
}

function removeLevel(level) {
    truths = truths.filter((x) => x.level != level);
    dares = dares.filter((x) => x.level != level);
}

function startNewGame() {
    $.getJSON("data.json", (jobj) => {
        sourceData = jobj;
        addLevel(0);
        saveState();
        window.location.href = "players.html";
    });
}

function continueGame() {
    loadState();
}

function showPlayers() {
    playerDiv = $("#players");
    playerDiv.empty();
    for (p of players) {
        cls = p.sex == MALE ? "boy" : "girl";
        html = `<div class="${cls}">${p.name}</div>`;
        playerDiv.append(html);
    }
    $("#startButton").prop("disabled", players.length == 0);
}

function addPlayer() {
    name = $("#name").val().trim();
    if (name.length == 0) return;

    newPlayer = {
        name: $("#name").val(),
        sex: $("#isgirl").prop("checked") ? FEMALE : MALE,
        id: players.length
    };

    players.push(newPlayer);
    $("#name").val("");
    $("#isgirl").prop("checked", false);
    showPlayers();
    $("#name").focus();
}

function removePlayer() {
    if (players.length > 0) {
        players.pop();
    }
    showPlayers();
}

function firstTurn() {
    loadState();
    turnCounter = 0;
    addLevel(0);
    saveState();
    window.location.href = "turn.html";
}

function takeTurn() {
    loadState();
    np = players.length;
    console.log(`np=${np}`);
    console.log(players);
    caller = players[turnCounter % np];
    noncallers = players.filter((p) => p.id != caller.id);
    doer = noncallers[turnCounter % (np - 1)];
    nextplayer = players[(turnCounter + 1) % np];
    $("#caller").text(caller.name);
    $("#doer").text(doer.name);
    $("#nextplayer").text(nextplayer.name);

    $("#choiceButtons").show();
    $("#task").hide();
}

function nextTurn() {
    turnCounter += 1;
    saveState();
    takeTurn();
}

function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function playTask() {
    $("#choiceButtons").hide();
    $("#taskText").text(currentTask.text);
    $("#task").show();
}

function doTruth() {
    console.log(truths);
    available = truths.filter(t => !t.done);
    console.log(available);
    currentTask = randomItem(available);
    playTask();
}

function doDare() {
    available = dares.filter((d) => {
        if (d.done) return false;
        if ((doer.sex & d.sexes) == 0) return false;
    });
    currentTask = randomItem(available);
    playTask();
}
