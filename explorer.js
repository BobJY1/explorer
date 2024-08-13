// Add license key input box and submit button
var keyValidity;
localStorage.setItem('legitCopy', 'w');

// Check if legitCopy is not 'true' or if it's not present in localStorage
if (localStorage.getItem('legitCopy') !== 'true') {
    var body = document.getElementsByTagName("body")[0];
    var inputbox1 = document.createElement("input");
    inputbox1.setAttribute("type", "text");
    inputbox1.setAttribute("id", "prodkey");
    inputbox1.setAttribute("placeholder", "Enter your license key");
    inputbox1.className = "inputbox1-box";

    var submitButton = document.createElement("button");
    submitButton.innerHTML = "Submit License Key";
    submitButton.className = "submit-button";
    submitButton.addEventListener("click", function() {
        var enteredKey = document.getElementById("prodkey").value;
        console.log("Button clicked. Entered Key:", enteredKey);

        checkLicenseKeyValidity(enteredKey).then(valid => {
            if (valid) {
                console.log("Key valid");
                document.querySelector(".inputbox1-box").style.display = "none";
                document.querySelector(".submit-button").style.display = "none";
                render()
                document.getElementById("explorer-tbl").style.display = "block";
                document.querySelector(".toggle-button").style.display = "block";
                localStorage.setItem('legitCopy', 'true');
            }
        });
    });

    body.appendChild(inputbox1);
    body.appendChild(submitButton);
}

// Function to check if the license key is valid
function checkLicenseKeyValidity(licenseKey) {
    return new Promise((resolve, reject) => {
        // Check if the license key is empty
        if (licenseKey.trim() === "") {
            // Add flash-red class
            inputbox1.classList.add("flash-red");
            // Remove flash-red class after 2 seconds
            setTimeout(function() {
                inputbox1.classList.remove("flash-red");
            }, 2000); // Remove the class after 2 seconds (2000 milliseconds)
            // Reject the Promise with false
            console.log("License key is empty.");
            // Reject the Promise
            reject("License key is empty.");
            return; // Exit the function if the license key is empty
        }
        // Read the "Product Codes.txt" file asynchronously
        fetch(browser.runtime.getURL("Product Codes.txt"))
            .then(response => response.text())
            .then(data => {
                // Split the file content into lines
                const lines = data.split('\n');
                // Iterate through each line to check if the license key exists
                let validKey = false;
                lines.forEach(line => {
                    if (line.trim() === licenseKey.trim()) {
                        validKey = true;
                    }
                });
                
                // Check if the license key is valid and the current date is before 5/30/24
                if (validKey && new Date() < new Date('2024-08-30')) {
                    console.log("License key is valid and date is before 5/30/24.");
                    keyValidity = true;
                    // Resolve the Promise with true
                    resolve(true);
                    // Enable paid features here
                } else {
                    console.log("License key is invalid or date is after 5/30/24.");
                    keyValidity = false;
                    // Add flash-red class
                    inputbox1.classList.add("flash-red");
                    // Remove flash-red class after 2 seconds
                    setTimeout(function() {
                        inputbox1.classList.remove("flash-red");
                    }, 2000); // Remove the class after 2 seconds (2000 milliseconds)
                    // Reject the Promise with false
                    reject("License key is invalid or date is after 5/30/24.");
                    // Disable paid features or prompt user to renew
                }
            })
            .catch(error => {
                console.error('Error reading "Product Codes.txt":', error);
                // Reject the Promise with the error
                reject(error);
                // Handle error (e.g., show error message to the user)
            });
    });
}



console.log("STARTED...");

var logElement;
var playerUsername;
var initialPlacementMade = false;
var initialPlacementDoneMessage = "Giving out starting resources";
var placeInitialSettlementSnippet = "placed a";
var startingResourcesSnippet = "received starting resources";
var receivedResourcesSnippet = "got";
var builtSnippet = "built a";
var boughtSnippet = " bought ";
var tradeBankGaveSnippet = "gave bank";
var tradeBankTookSnippet = "and took";
var stoleAllOfSnippet = "stole ";
var discardedSnippet = "discarded";
var tradedWithSnippet = " and got ";
var tradedSnippet = " from ";
//var tradeWantsToGiveSnippet = "wants to give:";
var tradeGiveForSnippet = "for";
var stoleFromYouSnippet = "You stole";
var youStoleSnippet = "from you";
var stoleFromSnippet = " stole  from "; // extra space from icon
var robberSnippet = " moved robber to";
var yearOfPleantlySnippet = "took from bank"
var comTrack = "upgraded";
var activateKnight = "activated"
var upgradeKnight = "upgraded"
var buildKnight = "placed a"
var aqueduct = "selected  from"

var smithUsed = false;
var smithCount;
var spyUsed = false;
var deserterUsed = false;
var wedding = false
var masterMerchant = false
var stolenResource = 1;

var wood = "wood";
var stone = "stone";
var wheat = "wheat";
var brick = "brick";
var sheep = "sheep";
var cloth = "cloth";
var coin = "coin";
var paper = "paper";
var resourceTypes = [wood, brick, sheep, wheat, stone, cloth, coin, paper];

// Players
var players = [];
var player_colors = {}; // player -> hex

// Per player per resource
var resources = {};

// Message offset
var MSG_OFFSET = 0;

const zeros = [0, 0, 0, 0, 0, 0, 0, 0];
const zero_deltas = [zeros, zeros, zeros, zeros];
// Unknow theft potential deltas

function deep_copy_2d_array(array) {
    return array.map(sub_array => Array.from(sub_array));
}
// Initialize resources object with default values for all players and resources
players.forEach(player => {
    resources[player] = {};
    resourceTypes.forEach(resource => {
      resources[player][resource] = 0;
    });
  });
  
potential_state_deltas = [];


function LogFailedToParse(...players) {
    console.log("Failed to parse player...", ...players, resources);
}

// First, delete the discord signs
function deleteDiscordSigns() {
    var allPageImages = document.getElementsByTagName('img'); 
    for(var i = 0; i < allPageImages.length; i++) {
        if (allPageImages[i].src.includes("discord")) {
            allPageImages[i].remove();
        }
    }
    ad_left = document.getElementById("in-game-ad-left");
    if (ad_left) {
        ad_left.remove();
    }
    ad_right = document.getElementById("in-game-ad-right");
    if (ad_right) {
        ad_right.remove();
    }
}

/**
 * Calculate the total lost quantity of a resource for a given player. 
 * i.e. if 1 card was potentially stolen, return 1.
 */
function calculateTheftForPlayerAndResource(player, resourceType) {
    var result = new Set();
    const playerIndex = players.indexOf(player);
    const resourceIndex = resourceTypes.indexOf(resourceType);
    for (var potential_state_delta of potential_state_deltas) {
        var diff = potential_state_delta[playerIndex][resourceIndex];
        if (diff !== 0) {
            result.add(diff);
        }
    }
    return Array.from(result);
}

function calculateTheftForPlayer(player) {
    if (potential_state_deltas.length === 0) {
        return [[0], [0]];
    }
    const playerIndex = players.indexOf(player);

    theftsBy = potential_state_deltas.map(potential_state_delta => 
               potential_state_delta[playerIndex].filter(x => x > 0).reduce((a, b) => a + b, 0));
    theftsFrom = potential_state_deltas.map(potential_state_delta =>
                 potential_state_delta[playerIndex].filter(x => x < 0).reduce((a, b) => a + b, 0));
    
    
    return [Array.from(new Set(theftsBy)), Array.from(new Set(theftsFrom))];
}

function getResourceImg(resourceType) {
    var img_name = "";
    switch (resourceType) {
        case wheat:
            img_name = "card_grain";
            break;
        case stone:
            img_name = "card_ore";
            break;
        case sheep:
            img_name = "card_wool";
            break;
        case brick:
            img_name = "card_brick";
            break;
        case wood:
            img_name = "card_lumber";
            break;
        case cloth:
            img_name = "card_cloth";
            break;
        case coin:
            img_name = "card_coin";
            break;
        case paper:
            img_name = "card_paper";
            break;
    }
    if (!img_name.length) throw Error("Couldn't find resource image icon");
    return `<img src="https://colonist.io/dist/images/${img_name}.svg" class="explorer-tbl-resource-icon" />`
}

function renderPlayerCell(player) {
    return `
        <div class="explorer-tbl-player-col-cell-color" style="background-color:${player_colors[player]}"></div>
        <span class="explorer-tbl-player-name" style="color:white">${player}</span>
    `;
}

var render_cache = null;
function shouldRenderTable(...deps) {
    if (JSON.stringify(deps) === render_cache) {
        return false;
    }
    render_cache = JSON.stringify(deps);
    console.log("Will render...");
    return true;
}

/*
function getTotalDeltas() {
    if (potential_state_deltas.length === 0)
        return deep_copy_2d_array(zero_deltas);
    
    var result = potential_state_deltas.reduce(add_array_of_arrays);
    return result;
}
*/

function render() {
    
    if (!shouldRenderTable(resources, potential_state_deltas)) {
        return;
    }

    // Initialize resources for all players if not already done
    players.forEach(function(player) {
        if (!resources[player]) {
            resources[player] = {};
            resourceTypes.forEach(function(resourceType) {
                resources[player][resourceType] = 0;
            });
            resources[player]['theftBy'] = 0; // Initialize theftBy for each player
            resources[player]['theftFrom'] = 0; // Initialize theftFrom for each player
        }
    });

    var existingTbl = document.getElementById("explorer-tbl");
    try {
        if (existingTbl) {
            existingTbl.remove();
        }
    } catch (e) {
        console.warning("had an issue deleting the table", e);
    }

    var body = document.getElementsByTagName("body")[0];
    var tbl = document.createElement("table");
    tbl.setAttribute("cellspacing", 0);
    tbl.setAttribute("cellpadding", 0);
    tbl.id = "explorer-tbl";

    // Header row - one column per resource, plus player column
    var header = tbl.createTHead();
    header.className = "explorer-tbl-header";
    var headerRow = header.insertRow(0);
    var playerHeaderCell = headerRow.insertCell(0);
    playerHeaderCell.innerHTML = "Name";
    playerHeaderCell.className = "explorer-tbl-player-col-header";
    for (var i = 0; i < resourceTypes.length; i++) {
        var resourceType = resourceTypes[i];
        var resourceHeaderCell = headerRow.insertCell(i + 1);
        resourceHeaderCell.className = "explorer-tbl-cell";
        resourceHeaderCell.innerHTML = getResourceImg(resourceType);
    }
    var theftsByHeaderCell = headerRow.insertCell(resourceTypes.length + 1);
    theftsByHeaderCell.innerHTML = "+";
    theftsByHeaderCell.className = "explorer-tbl-cell";
    var theftsFromHeaderCell = headerRow.insertCell(resourceTypes.length + 2);
    theftsFromHeaderCell.innerHTML = "-";
    theftsFromHeaderCell.className = "explorer-tbl-cell";
    var totalHeaderCell = headerRow.insertCell(resourceTypes.length + 3);
    totalHeaderCell.innerHTML = "Total";
    totalHeaderCell.className = "explorer-tbl-cell";

    var tblBody = tbl.createTBody();

    // Row per player
    for (var i = 0; i < players.length; i++) {
        var player = players[i];
        var row = tblBody.insertRow(i);
        row.className = "explorer-tbl-row";
        var playerRowCell = row.insertCell(0);
        playerRowCell.className = "explorer-tbl-player-col-cell";
        playerRowCell.innerHTML = renderPlayerCell(player);
        for (var j = 0; j < resourceTypes.length; j++) {
            var cell = row.insertCell(j + 1);
            cell.className = "explorer-tbl-cell";
            var resourceType = resourceTypes[j];
            var cellCount = resources[player][resourceType];
            var theftSet = calculateTheftForPlayerAndResource(player, resourceType);
            var theftString = theftSet.length === 0 ? "" : `(${theftSet})`;
            cell.innerHTML = `<span id="resource_${j}_${i}" class="resource-count">${Number.isNaN(cellCount) ? "" : cellCount} ${theftString}</span>`;

            // Add event listeners to resource counts
            var resourceCountSpan = cell.querySelector('.resource-count');
            if (resourceCountSpan) {
                resourceCountSpan.addEventListener('click', function (event) {
                    var resourceId = event.target.id.split("_");
                    var resourceIndex = parseInt(resourceId[1]);
                    var playerIndex = parseInt(resourceId[2]);
                    resources[players[playerIndex]][resourceTypes[resourceIndex]] += 1;
                    render(); // Re-render the table after modification
                });

                resourceCountSpan.addEventListener('contextmenu', function (event) {
                    event.preventDefault();
                    var resourceId = event.target.id.split("_");
                    var resourceIndex = parseInt(resourceId[1]);
                    var playerIndex = parseInt(resourceId[2]);
                    if (resources[players[playerIndex]][resourceTypes[resourceIndex]] > 0) {
                        resources[players[playerIndex]][resourceTypes[resourceIndex]] -= 1;
                        render(); // Re-render the table after modification
                    }
                    return false;
                });
            }
        }
        var [theftBy, theftFrom] = calculateTheftForPlayer(player);
        var theftByCell = row.insertCell(resourceTypes.length + 1);
        theftByCell.className = "explorer-tbl-cell";
        theftByCell.innerHTML =
            theftBy.length === 1 ? "" + theftBy : `(${theftBy})`;

        // Add event listeners to theft numbers (theftBy)
        theftByCell.addEventListener('click', function (event) {
            var playerIndex = i;
            resources[players[playerIndex]]['theftBy'] += 1;
            render(); // Re-render the table after modification
        });

        theftByCell.addEventListener('contextmenu', function (event) {
            event.preventDefault();
            var playerIndex = i;
            if (resources[players[playerIndex]]['theftBy'] > 0) {
                resources[players[playerIndex]]['theftBy'] -= 1;
                render(); // Re-render the table after modification
            }
            return false;
        });

        var theftFromCell = row.insertCell(resourceTypes.length + 2);
        theftFromCell.className = "explorer-tbl-cell";
        theftFromCell.innerHTML =
            theftFrom.length === 1 ? "" + theftFrom : `(${theftFrom})`;

        // Add event listeners to theft numbers (theftFrom)
        theftFromCell.addEventListener('click', function (event) {
            var playerIndex = i;
            resources[players[playerIndex]]['theftFrom'] += 1;
            render(); // Re-render the table after modification
        });

        theftFromCell.addEventListener('contextmenu', function (event) {
            event.preventDefault();
            var playerIndex = i;
            if (resources[players[playerIndex]]['theftFrom'] > 0) {
                resources[players[playerIndex]]['theftFrom'] -= 1;
                render(); // Re-render the table after modification
            }
            return false;
        });

        var totalCell = row.insertCell(resourceTypes.length + 3);
        totalCell.className = "explorer-tbl-cell";
        var totalResources = Object.values(resources[player]).reduce(
            (acc, x) => acc + x,
            0
        );
        if (theftBy.length !== 0) {
            totalResources += theftBy[0];
        }
        if (theftFrom.length !== 0) {
            totalResources += theftFrom[0];
        }
        totalCell.innerHTML = "" + totalResources;
    }

    // put <table> in the <body>
    body.appendChild(tbl);
    // tbl border attribute to
    tbl.setAttribute("border", "2");

    // Add toggle button
    var toggleButton = document.createElement("button");
    toggleButton.className = "toggle-button";
    var icon = document.createElement("img");
    icon.src = "icon64.png";
    icon.alt = "Toggle Table"; // Alternate text for the image
    toggleButton.appendChild(icon);

    toggleButton.addEventListener("click", function() {
        var tbl = document.getElementById("explorer-tbl");
        if (tbl.style.display === "none") {
            tbl.style.display = "block";
        } else {
            tbl.style.display = "none";
        }
    });

    // Append button to body
    body.appendChild(toggleButton);

    if (localStorage.getItem('legitCopy') !== 'true'){
    // Hide explorer table and toggle button initially
    var explorerTable = document.getElementById("explorer-tbl");
    if (explorerTable) {
        explorerTable.style.display = "none";
    }
    if (toggleButton) {
        toggleButton.style.display = "none";
    }
    }
}


/**
* Process a "got resource" message: [user icon] [user] got: ...[resource images]
*/
function parseGotMessageHelper(pElement, snippet) {
    var textContent = pElement.textContent;
    if (!textContent.includes(snippet)) {
        return;
    }
    if (textContent.includes("gave")) {
        return;
    }
    var player = textContent.replace(snippet, "").split(" ")[0];
    if (!resources[player]) {
        LogFailedToParse(player);
        return;
    }
    var images = collectionToArray(pElement.getElementsByTagName('img'));
    for (var img of images) {
        if (img.src.includes("card_wool")) {
            resources[player][sheep] += 1;
        } else if (img.src.includes("card_lumber")) {
            resources[player][wood] += 1;
        } else if (img.src.includes("card_brick")) {
            resources[player][brick] += 1;
        } else if (img.src.includes("card_ore")) {
            resources[player][stone] += 1; 
        } else if (img.src.includes("card_grain")) {
            resources[player][wheat] += 1;
        } else if (img.src.includes("card_cloth")) {
            resources[player][cloth] += 1;
        } else if (img.src.includes("card_coin")) {
            resources[player][coin] += 1;
        } else if (img.src.includes("card_paper")) {
            resources[player][paper] += 1;
        }
    }
}

/**
* Process a "selected" message: [user icon] [user] selected: ...[resource images] aqueduct
*/
function parseAqueductMessageHelper(pElement, aqueductSnippet) {
    var textContent = pElement.textContent;
    if (textContent.includes(aqueductSnippet)) {
        var player = textContent.split(" ")[0];
        var resourceMatch = textContent.match(/selected\s+(.*?)\s+from Aqueduct/);
        if (!resources[player] || !resourceMatch) {
            LogFailedToParse(player);
            return;
        }
        var resource = resourceMatch[1];
        var images = collectionToArray(pElement.getElementsByTagName('img'));
        for (var img of images) {
            if (img.src.includes("card_wool")) {
                resources[player][sheep] += 1;
            } else if (img.src.includes("card_lumber")) {
                resources[player][wood] += 1;
            } else if (img.src.includes("card_brick")) {
                resources[player][brick] += 1;
            } else if (img.src.includes("card_ore")) {
                resources[player][stone] += 1; 
            } else if (img.src.includes("card_grain")) {
                resources[player][wheat] += 1;
            }
        }
    }
}

function parseGotMessage(pElement) {
    parseGotMessageHelper(pElement, receivedResourcesSnippet);
    parseAqueductMessageHelper(pElement, "selected");
}

/**
 * Process a "built" message: [user icon] [user] built a [building/road]
 */
function parseBuiltMessage(pElement) {
    var textContent = pElement.textContent;

    if (!textContent.includes(builtSnippet)) {
        return;
    }
    var images = collectionToArray(pElement.getElementsByTagName('img'));
    var player = textContent.split(" ")[0];
    if (!resources[player]) {
        console.log("Player resources not found. Skipping..."); // Debugging statement
        LogFailedToParse(player);
        return;
    }
    for (var img of images) {
        if (img.src.includes("road")) {
            resources[player][wood] -= 1;
            resources[player][brick] -= 1;
            console.log("Road built by", player); // Debugging statement
        } else if (img.src.includes("settlement")) {
            resources[player][wood] -= 1;
            resources[player][brick] -= 1;
            resources[player][sheep] -= 1;
            resources[player][wheat] -= 1;
            console.log("settle built by", player); // Debugging statement
        } else if (img.src.includes("city_wall")) {
            resources[player][brick] -= 2;
            console.log("citywall built by", player); // Debugging statement
        } else if (img.src.includes("city")) {
            resources[player][stone] -= 3;
            resources[player][wheat] -= 2;
            console.log("city built by", player); // Debugging statement

        }
        } 
    }

/**
 * Process a knight build
 */
function parseKnightbuildMessage(pElement) {
    var textContent = pElement.textContent;
    if (!textContent.includes(buildKnight)) {
        if (textContent.includes("used")){
            var images = collectionToArray(pElement.getElementsByTagName('img'));
            for (var img of images) {
                if (img.src.includes("deserter")) {
                    deserterUsed = true;
                    return;
                }
            }
        }
        return;
    }
    var images = collectionToArray(pElement.getElementsByTagName('img'));
    var player = textContent.split(" ")[0];
    if (!resources[player]) {
        console.log("Player resources not found. Skipping..."); // Debugging statement
        LogFailedToParse(player);
        return;
    }
    for (var img of images) {
        if (img.src.includes("knight")) {
            if (deserterUsed){
                deserterUsed = false;
                return;
            }
            console.log("knight built by", player); // Debugging statement
            resources[player][sheep] -= 1;
            resources[player][stone] -= 1;
        }
    }
}
/**
 * Process a knight upgrade
 */
function parseKnightUpgradeMessage(pElement) {
    var textContent = pElement.textContent;
    console.log("parse smith says:",textContent); 

    if (textContent.includes("used")){
        var images = collectionToArray(pElement.getElementsByTagName('img'));
        for (var img of images) {
            if (img.src.includes("smith")) {
                smithUsed = true;
                smithCount = 2;
                console.log("A smith was used:");
                console.log("smithCount:", smithCount);
                console.log("smithUsed:", smithUsed);
                return;
            }
        }
    }

    if (!textContent.includes(upgradeKnight)) {
        if(smithUsed){
            if(smithCount < 2) {
                console.log("resetting smith used")
                smithUsed = false;
            }
        }
        return;
    }

    var player = textContent.split(" ")[0];
    if (!resources[player]) {
        console.log("Player resources not found. Skipping..."); // Debugging statement
        LogFailedToParse(player);
        return;
    }
    var images = collectionToArray(pElement.getElementsByTagName('img'));
    for (var img of images) {
        if (img.src.includes("knight")) {
            console.log("Knight upgraded by", player); // Debugging statement
            if (smithUsed) {
                if (smithCount > 0) {
                    console.log("Smith upgrade used ");
                    smithCount = smithCount - 1;
                    console.log("Remaining smith upgrades:", smithCount);
                } else {
                    console.log("All smith upgrades used.");
                    smithUsed = false;
                }
                return;
            }
            resources[player][sheep] -= 1;
            resources[player][stone] -= 1;
            return;
        }
    }
}


/**
 * Process a medicine
 */
function parseMedicineMessage(pElement) {
    var textContent = pElement.textContent;
    if (textContent.includes("used")){
        var images = collectionToArray(pElement.getElementsByTagName('img'));
        var player = textContent.split(" ")[0];

        if (!resources[player]) {
            LogFailedToParse(player);
            return;
        }

        for (var img of images) {
            if (img.src.includes("medicine")) {
                resources[player][wheat] += 1;
                resources[player][stone] += 1;
                console.log("medicine used by", player); // Debugging statement
            }
        }
    }
}

/**
 * Process a engineer
 */
function parseEngineerMessage(pElement) {
    var textContent = pElement.textContent;

    if (textContent.includes("used")){
        var images = collectionToArray(pElement.getElementsByTagName('img'));
        var player = textContent.split(" ")[0];
        
        if (!resources[player]) {
            LogFailedToParse(player);
            return;
        }

        for (var img of images) {
            if (img.src.includes("engineer")) {
                resources[player][brick] += 2;
                console.log("engineer used by", player); // Debugging statement
            }
        }
    }
}

function parseDiploMessage(pElement) {
    var textContent = pElement.textContent;
    if (!textContent.includes("is repositioning their road")) {
        return;
    }
    var player = textContent.split(" ")[0];
    if (!resources[player]) {
        LogFailedToParse(player);
        return;
    }
    resources[player][brick] += 1;
    resources[player][wood] += 1;
    console.log("diplo used by", player); // Debugging statement
}

/**
 * Process a knight activate
 */
function parseKnightActivateMessage(pElement) {
    var textContent = pElement.textContent;
    if (!textContent.includes(activateKnight)) {
        return;
    }
    var images = collectionToArray(pElement.getElementsByTagName('img'));
    var player = textContent.split(" ")[0];
    if (!resources[player]) {
        LogFailedToParse(player);
        return;
    }
    for (var img of images) {
        if (img.src.includes("knight")) {
            resources[player][wheat] -= 1;
            console.log("knight activated by", player); // Debugging statement
        }
    }
}

// Function to parse commodity upgrade messages
// Define craneUsed outside the function to maintain its state across calls
var craneUsed = false;

function parseComUPMessage(pElement) {
    var textContent = pElement.textContent;

    var player = textContent.split(" ")[0];
    if (!resources[player]) {
        LogFailedToParse(player);
        return;
    }

    // Check if crane was used
    if (textContent.includes("used")) {
        var images = collectionToArray(pElement.getElementsByTagName('img'));
        for (var img of images) {
            if (img.src.includes("crane")) {
                craneUsed = true; // Correctly set craneUsed to true
                console.log("crane used by", player); // Debugging statement
            }
        }
    }

    // Reset craneUsed to false if comTrack is not included
    if (!textContent.includes(comTrack)) {
        return;
    }

    console.log("com upgraded.", textContent);
    var level = parseInt(textContent.charAt(textContent.length - 1)); // Convert to number
    console.log("upgrade level is:", level);

    var images = collectionToArray(pElement.getElementsByTagName('img'));
    console.log("Images found:", images); // Debugging statement

    var resourcesToSubtract = craneUsed ? level - 1 : level; // Calculate resources to subtract

    for (var img of images) {
        console.log("Checking image src:", img.src); // Debugging statement

        if (img.src.includes("politics")) {
            resources[player][coin] -= resourcesToSubtract;
            console.log(`Subtracting ${resourcesToSubtract} coin from ${player}`); // Debugging statement
            craneUsed = false; // Reset craneUsed after processing
            return;
        } else if (img.src.includes("trade")) {
            resources[player][cloth] -= resourcesToSubtract;
            console.log(`Subtracting ${resourcesToSubtract} cloth from ${player}`); // Debugging statement
            craneUsed = false; // Reset craneUsed after processing
            return;
        } else if (img.src.includes("science")) {
            resources[player][paper] -= resourcesToSubtract;
            console.log(`Subtracting ${resourcesToSubtract} paper from ${player}`); // Debugging statement
            craneUsed = false; // Reset craneUsed after processing
            return;
        }
    }
}

/**
 * Process a "bought" message: [user icon] [user] built
 */
function parseBoughtMessage(pElement) {
    var textContent = pElement.textContent;
    if (!textContent.includes(placeInitialSettlementSnippet)) {
        return;
    }
    var images = collectionToArray(pElement.getElementsByTagName('img'));
    var player = textContent.split(" ")[0];
    if (!resources[player]) {
        LogFailedToParse(player);
        return;
    }
    for (var img of images) {
        if (img.src.includes("card_devcardback")) {
            resources[player][sheep] -= 1;
            resources[player][wheat] -= 1;
            resources[player][stone] -= 1;
        }
    }
}



/**
 * "[user] took from bank: [resource]
 */
 function parseYearOfPleantyMessage(pElement) {
    var textContent = pElement.textContent; 
    if (!textContent.includes(yearOfPleantlySnippet)) {
        return;
    }
    var player = textContent.split(" ")[0];
    var images = collectionToArray(pElement.getElementsByTagName('img'));
    if (!resources[player]) {
        LogFailedToParse(player);
        return;
    }
    for (var img of images) {
        if (img.src.includes("card_wool")) {
            resources[player][sheep] += 1;
        } else if (img.src.includes("card_lumber")) {
            resources[player][wood] += 1;
        } else if (img.src.includes("card_brick")) {
            resources[player][brick] += 1;
        } else if (img.src.includes("card_ore")) {
            resources[player][stone] += 1; 
        } else if (img.src.includes("card_grain")) {
            resources[player][wheat] += 1;
        } else if (img.src.includes("card_cloth")) {
            resources[player][cloth] += 1;
        } else if (img.src.includes("card_coin")) {
            resources[player][coin] += 1;
        } else if (img.src.includes("card_paper")) {
            resources[player][paper] += 1;
        } 
    }
 }


/**
 * Process a trade with the bank message: [user icon] [user] gave bank: ...[resources] and took ...[resources]
 */
function parseTradeBankMessage(pElement) {
    var textContent = pElement.textContent;
    if (!textContent.includes(tradeBankGaveSnippet)) {
        return;
    }
    var player = textContent.split(" ")[0];
    if (!resources[player]) {
        LogFailedToParse(player);
        return;
    }
    // We have to split on the text, which isn't wrapped in tags, so we parse innerHTML, which prints the HTML and the text.
    var innerHTML = pElement.innerHTML;
    var gavebank = innerHTML.slice(innerHTML.indexOf(tradeBankGaveSnippet), innerHTML.indexOf(tradeBankTookSnippet)).split("<img");
    var andtook = innerHTML.slice(innerHTML.indexOf(tradeBankTookSnippet)).split("<img");
    for (var imgStr of gavebank) {
        if (imgStr.includes("card_wool")) {
            resources[player][sheep] -= 1;
        } else if (imgStr.includes("card_lumber")) {
            resources[player][wood] -= 1;
        } else if (imgStr.includes("card_brick")) {
            resources[player][brick] -= 1;
        } else if (imgStr.includes("card_ore")) {
            resources[player][stone] -= 1; 
        } else if (imgStr.includes("card_grain")) {
            resources[player][wheat] -= 1;
        } else if (imgStr.includes("card_cloth")) {
            resources[player][cloth] -= 1;
        } else if (imgStr.includes("card_coin")) {
            resources[player][coin] -= 1;
        } else if (imgStr.includes("card_paper")) {
            resources[player][paper] -= 1;
        }
    }
    for (var imgStr of andtook) {
        if (imgStr.includes("card_wool")) {
            resources[player][sheep] += 1;
        } else if (imgStr.includes("card_lumber")) {
            resources[player][wood] += 1;
        } else if (imgStr.includes("card_brick")) {
            resources[player][brick] += 1;
        } else if (imgStr.includes("card_ore")) {
            resources[player][stone] += 1; 
        } else if (imgStr.includes("card_grain")) {
            resources[player][wheat] += 1;
        } else if (imgStr.includes("card_cloth")) {
            resources[player][cloth] += 1;
        } else if (imgStr.includes("card_coin")) {
            resources[player][coin] += 1;
        } else if (imgStr.includes("card_paper")) {
            resources[player][paper] += 1;
        }
    }
}

function stealAllOfResource(receivingPlayer, resource, amountStolen) {
    var maxSteal = (resource === cloth || resource === coin || resource === paper) ? 1 : 2;

    // Initialize variable to track total stolen amount
    var totalStolen = 0;

    for (var plyr of players) {
        if (plyr !== receivingPlayer && resources[plyr][resource] > 0) {
            var amountToSteal = Math.min(resources[plyr][resource], maxSteal);

            // Adjust potential state deltas for the player being stolen from
            for (var delta of potential_state_deltas) {
                if (delta.hasOwnProperty(plyr)) {
                    var totalResources = delta[plyr][resource] + resources[plyr][resource];
                    if (totalResources <= amountToSteal) {
                        // Clear the delta for the resource
                        delta[plyr][resource] = 0;
                    }
                }
            }
            
            // Update actual resources for both players
            resources[receivingPlayer][resource] += amountToSteal;
            resources[plyr][resource] -= amountToSteal;

            // Update total stolen amount
            totalStolen += amountToSteal;

            // Check if total stolen amount exceeds amountStolen
            if (totalStolen >= amountStolen) {
                break; // Stop if total stolen amount reaches or exceeds amountStolen
            }
        }
    }
}


/* 
*  [user] stole [number]: [resource]
*/
function isMonopoly(text) {
    arr = text.replace(":", "").split(" ");
    if (arr[1] === "stole" && !isNaN(parseInt(arr[2]))) {
        return true;
    }
    return false;
}

/**
 * Parse monopoly card
 */
function parseStoleAllOfMessage(pElement) {
    var textContent = pElement.textContent;
    if (!isMonopoly(textContent)) {
        return;
    }
    var player = textContent.split(" ")[0];
    if (!resources[player]) {
        LogFailedToParse(player);
        return;
    }
    var monoAmount = parseInt(textContent.split(" ")[2]);
    console.log("mono amount is:", monoAmount)
    var images = collectionToArray(pElement.getElementsByTagName('img'));
    // there will only be 1 resource icon
    for (var img of images) {
        if (img.src.includes("card_wool")) {
            stealAllOfResource(player, sheep, monoAmount);
        } else if (img.src.includes("card_lumber")) {
            stealAllOfResource(player, wood, monoAmount);
        } else if (img.src.includes("card_brick")) {
            stealAllOfResource(player, brick, monoAmount);
        } else if (img.src.includes("card_ore")) {
            stealAllOfResource(player, stone, monoAmount);
        } else if (img.src.includes("card_grain")) {
            stealAllOfResource(player, wheat, monoAmount);
        } else if (img.src.includes("card_cloth")) {
            stealAllOfResource(player, cloth, monoAmount);
        } else if (img.src.includes("card_coin")) {
            stealAllOfResource(player, coin, monoAmount);
        } else if (img.src.includes("card_paper")) {
            stealAllOfResource(player, paper, monoAmount);
        }
    }
}


/**
 * When the user has to discard cards because of a robber.
 */
function parseDiscardedMessage(pElement) {
    var textContent = pElement.textContent;
    if (!textContent.includes(discardedSnippet)) {
        return;
    }
    var player = textContent.replace(receivedResourcesSnippet, "").split(" ")[0];
    if (!resources[player]) {
        LogFailedToParse(player);
        return;
    }
    var images = collectionToArray(pElement.getElementsByTagName('img'));
    for (var img of images) {
        if (img.src.includes("card_wool")) {
            resources[player][sheep] -= 1;
        } else if (img.src.includes("card_lumber")) {
            resources[player][wood] -= 1;
        } else if (img.src.includes("card_brick")) {
            resources[player][brick] -= 1;
        } else if (img.src.includes("card_ore")) {
            resources[player][stone] -= 1; 
        } else if (img.src.includes("card_grain")) {
            resources[player][wheat] -= 1;
        } else if (img.src.includes("card_cloth")) {
            resources[player][cloth] -= 1;
        } else if (img.src.includes("card_coin")) {
            resources[player][coin] -= 1;
        } else if (img.src.includes("card_paper")) {
            resources[player][paper] -= 1;
        }
    }
}


function resolveUnknownTheft(player) {
    for (var otherPlayer in resources) {
        if (otherPlayer !== player && resources[otherPlayer]) {
            var stolenResources = subtractObjects(resources[player], resources[otherPlayer]);
            
            // Adjust stolen resources based on potential state deltas
            for (var delta of potential_state_deltas) {
                var adjustedStolenResources = subtractObjects(stolenResources, delta[players.indexOf(otherPlayer)]);
                if (areAllNonNegative(adjustedStolenResources)) {
                    stolenResources = adjustedStolenResources;
                    break;
                }
            }

            if (areAllNonNegative(stolenResources)) {
                // Update the resources and clear potential state deltas
                for (var resourceType in resources[player]) {
                    resources[otherPlayer][resourceType] = resources[player][resourceType];
                }
                potential_state_deltas = [];
                return;
            }
        }
    }
}


// Function to subtract resources from one object (player) to another (target)
function subtractObjects(playerResources, targetResources) {
    var stolenResources = {};
    for (var resourceType in playerResources) {
        stolenResources[resourceType] = playerResources[resourceType] - (targetResources[resourceType] || 0);
    }
    return stolenResources;
}

// Function to check if all values in an object are non-negative
function areAllNonNegative(object) {
    for (var key in object) {
        if (object[key] < 0) {
            return false;
        }
    }
    return true;
}



function transferResource(srcPlayer, destPlayer, resource, quantity = 1) {
    resources[srcPlayer][resource] -= quantity;
    resources[destPlayer][resource] += quantity;
    console.log(srcPlayer, "recieved",resource,"from",destPlayer)
}  

/**
 * Message T-1: [user1] wants to give: ...[resources] for: ...[resources]
 * Message T: [user1] traded with: [user2]
 */
function parseTradedMessage(pElement, prevElement) {
    var textContent = pElement.textContent;
    if (!textContent.includes(tradedWithSnippet)) {
        return;
    }
    var tradingPlayer = textContent.split("gave")[0].trim();
    var agreeingPlayer = textContent.split("from")[1].trim();

    console.log("trading player is:" , tradingPlayer) // Debugging statements
    console.log("agreeing player is:" , agreeingPlayer)

    if (!resources[tradingPlayer] || !resources[agreeingPlayer]) {
        LogFailedToParse(tradingPlayer, agreeingPlayer, pElement.textContent, prevElement.textContent);
        return;
    }
    // We have to split on the text, which isn't wrapped in tags, so we parse innerHTML, which prints the HTML and the text.
    var innerHTML = pElement.innerHTML; // on the trade description msg
    var wantstogive = innerHTML.slice(/*innerHTML.indexOf(tradeWantsToGiveSnippet)*/0, innerHTML.indexOf("and")).split("<img");
    var givefor = innerHTML.slice(innerHTML.indexOf("got")).split("<img");
    console.log("wants to give",wantstogive)
    console.log("give for",givefor)
    for (var imgStr of wantstogive) {
        if (imgStr.includes("card_wool")) {
            transferResource(tradingPlayer, agreeingPlayer, sheep);
        } else if (imgStr.includes("card_lumber")) {
            transferResource(tradingPlayer, agreeingPlayer, wood);
        } else if (imgStr.includes("card_brick")) {
            transferResource(tradingPlayer, agreeingPlayer, brick);
        } else if (imgStr.includes("card_ore")) {
            transferResource(tradingPlayer, agreeingPlayer, stone);
        } else if (imgStr.includes("card_grain")) {
            transferResource(tradingPlayer, agreeingPlayer, wheat);
        } else if (imgStr.includes("card_cloth")) {
            transferResource(tradingPlayer, agreeingPlayer, cloth);
        } else if (imgStr.includes("card_coin")) {
            transferResource(tradingPlayer, agreeingPlayer, coin);
        } else if (imgStr.includes("card_paper")) {
            transferResource(tradingPlayer, agreeingPlayer, paper);
        }
    }
    for (var imgStr of givefor) {
        if (imgStr.includes("card_wool")) {
            transferResource(agreeingPlayer, tradingPlayer, sheep);
        } else if (imgStr.includes("card_lumber")) {
            transferResource(agreeingPlayer, tradingPlayer, wood);
        } else if (imgStr.includes("card_brick")) {
            transferResource(agreeingPlayer, tradingPlayer, brick);
        } else if (imgStr.includes("card_ore")) {
            transferResource(agreeingPlayer, tradingPlayer, stone);
        } else if (imgStr.includes("card_grain")) {
            transferResource(agreeingPlayer, tradingPlayer, wheat);
        } else if (imgStr.includes("card_cloth")) {
            transferResource(agreeingPlayer, tradingPlayer, cloth);
        } else if (imgStr.includes("card_coin")) {
            transferResource(agreeingPlayer, tradingPlayer, coin);
        } else if (imgStr.includes("card_paper")) {
            transferResource(agreeingPlayer, tradingPlayer, paper);
        }
    }
}

function isKnownSteal(textContent) {
    return textContent.includes(stoleFromYouSnippet) || textContent.includes(youStoleSnippet)
}

/**
 * Message T-1: [stealingPlayer] moved robber to [number] [resource]
 * Message T: [stealingPlayer] stole: [resource] from [targetPlayer]
 */
function parseStoleFromYouMessage(pElement, prevElement) {
    var textContent = pElement.textContent;

    var splitText = textContent.split(" ");
    console.log(splitText)
    var stealingPlayer = splitText[0] === "You" ? playerUsername : splitText[0];
    var targetPlayer = splitText[5] === "you" ? playerUsername : splitText[5];

    var images = collectionToArray(pElement.getElementsByTagName('img'));
    for (var img of images) {
        if (img.src.includes("master")) {
            masterMerchant = true
            console.log("found master merchant")
        }
    }

    for (var img of images) {
        if (img.src.includes("wedding")) {
            wedding = true
            console.log("found wedding")
        }
    }

    if (!isKnownSteal(textContent)) {
        return;
    }

    var resourceMap = {
        "card_wool": "sheep",
        "card_lumber": "wood",
        "card_brick": "brick",
        "card_ore": "stone",
        "card_grain": "wheat",
        "card_cloth": "cloth",
        "card_coin": "coin",
        "card_paper": "paper"
    };

    var stolenResources = {};

    // Count each resource stolen
    for (var img of images) {
        for (var key in resourceMap) {
            if (img.src.includes(key)) {
                var resource = resourceMap[key];
                stolenResources[resource] = (stolenResources[resource] || 0) + 1;
                break;
            }
        }
    }

    // Adjust the resources for each type of stolen resource
    for (var resource in stolenResources) {
        if (wedding){
            targetPlayer = splitText[6] === "you" ? playerUsername : splitText[6];
            wedding = false
        }
        if (masterMerchant){
            targetPlayer = splitText[6] === "you" ? playerUsername : splitText[6];
            masterMerchant = false
        }
        if (!resources[stealingPlayer] || !resources[targetPlayer]) {
            LogFailedToParse(stealingPlayer, targetPlayer);
            console.log("failed to parse in stolefromyou")
            return;
        }
        var count = stolenResources[resource];
        resources[stealingPlayer][resource] += count;
        resources[targetPlayer][resource] -= count;
    }

}



function add_array_of_arrays(array0, array1) {
    // Ensure that array0 has the same number of rows as array1
    const minLength = Math.min(array0.length, array1.length);
    array0 = array0.slice(0, minLength);

    console.log("add array of arrays 0 and 1:", array0, array1)
    // Perform element-wise addition for each row
    return array0.map((row, outer_index) =>
      row.map((element, inner_index) => array1[outer_index][inner_index] + element)
    );
}

  

/**
 * Message T-1: [stealingPlayer] stole [resource] from: [targetPlayer]
 * Message T is NOT: [stealingPlayer] stole: [resource]
 */

function parseYouCommercialHarbor(pElement, prevElement) {
    var textContent = pElement.textContent;
    if (!textContent.includes(" gave ") || !textContent.includes(" received ")) {
        return;
    }

    var tradingPlayer = textContent.split(" gave")[0];
    var agreeingPlayer = textContent.match(/to\s(.*?)\s+and\sreceived/)[1];


    if (tradingPlayer === "You"){
        tradingPlayer = playerUsername;
    } 
    if (agreeingPlayer === "you"){
        agreeingPlayer = playerUsername;
    } 

    if (!resources[tradingPlayer] || !resources[agreeingPlayer]) {
        LogFailedToParse(tradingPlayer, agreeingPlayer, pElement.textContent, prevElement.textContent);
        console.log("failed to parse in comharbfromyou")
        return;
    }

    // We have to split on the text, which isn't wrapped in tags, so we parse innerHTML, which prints the HTML and the text.
    var innerHTML = pElement.innerHTML; // on the trade description msg
    var wantstogive = innerHTML.slice(/*innerHTML.indexOf(tradeWantsToGiveSnippet)*/0, innerHTML.indexOf("to")).split("<img");
    var givefor = innerHTML.slice(innerHTML.indexOf("received")).split("<img");
    for (var imgStr of wantstogive) {
        if (imgStr.includes("card_wool")) {
            transferResource(tradingPlayer, agreeingPlayer, sheep);
        } else if (imgStr.includes("card_lumber")) {
            transferResource(tradingPlayer, agreeingPlayer, wood);
        } else if (imgStr.includes("card_brick")) {
            transferResource(tradingPlayer, agreeingPlayer, brick);
        } else if (imgStr.includes("card_ore")) {
            transferResource(tradingPlayer, agreeingPlayer, stone);
        } else if (imgStr.includes("card_grain")) {
            transferResource(tradingPlayer, agreeingPlayer, wheat);
        } else if (imgStr.includes("card_cloth")) {
            transferResource(tradingPlayer, agreeingPlayer, cloth);
        } else if (imgStr.includes("card_coin")) {
            transferResource(tradingPlayer, agreeingPlayer, coin);
        } else if (imgStr.includes("card_paper")) {
            transferResource(tradingPlayer, agreeingPlayer, paper);
        }
    }
    for (var imgStr of givefor) {
        if (imgStr.includes("card_wool")) {
            transferResource(agreeingPlayer, tradingPlayer, sheep);
        } else if (imgStr.includes("card_lumber")) {
            transferResource(agreeingPlayer, tradingPlayer, wood);
        } else if (imgStr.includes("card_brick")) {
            transferResource(agreeingPlayer, tradingPlayer, brick);
        } else if (imgStr.includes("card_ore")) {
            transferResource(agreeingPlayer, tradingPlayer, stone);
        } else if (imgStr.includes("card_grain")) {
            transferResource(agreeingPlayer, tradingPlayer, wheat);
        } else if (imgStr.includes("card_cloth")) {
            transferResource(agreeingPlayer, tradingPlayer, cloth);
        } else if (imgStr.includes("card_coin")) {
            transferResource(agreeingPlayer, tradingPlayer, coin);
        } else if (imgStr.includes("card_paper")) {
            transferResource(agreeingPlayer, tradingPlayer, paper);
        }
    }
}

function parseStoleUnknownMessage(pElement, prevElement) {
    if (!prevElement) {
        return;
    }

    var messageT = pElement.textContent;

    var images = collectionToArray(pElement.getElementsByTagName('img'));

    // figure out the 2 players
    var involvedPlayers = messageT.split(" ");
    var stealingPlayer = involvedPlayers[0];
    var targetPlayer = involvedPlayers[5];


    for (var img of images) {
        if (img.src.includes("master")) {
            masterMerchant = true
        }
    }

    for (var img of images) {
        if (img.src.includes("wedding")) {
            wedding = true
        }
    }

    if (!messageT.includes("stole") || isKnownSteal(messageT) || isMonopoly(messageT)) {
        return;
    }

    // for the player being stolen from, (-1) on all resources that are non-zero
    // for the player receiving, (+1) for all resources that are non-zero FOR THE OTHER PLAYER
    // record the unknown and wait for it to surface

    var stealingPlayerIndex = players.indexOf(stealingPlayer);
    var targetPlayerIndex = players.indexOf(targetPlayer);

    var potential_deltas = [];

    if (wedding || masterMerchant) {
        targetPlayer = involvedPlayers[6];
        targetPlayerIndex = players.indexOf(targetPlayer);

        if (!resources[stealingPlayer] || !resources[targetPlayer]){
            LogFailedToParse(stealingPlayer, targetPlayer);
            console.log("failed to parse in unknown rob with a weddding/master merchant")
            wedding = false
            masterMerchant = false
            return;
        }
        
        for (let i = 0; i < 2; i++) {
            for (const index of resourceTypes.keys()) {
                var temp = deep_copy_2d_array(zero_deltas);
    
                temp[stealingPlayerIndex][index] = stolenResource;
                temp[targetPlayerIndex][index] = -stolenResource;
    
                potential_deltas.push(temp);
            }
    
            potential_state_deltas = (potential_state_deltas.length === 0
                ? [deep_copy_2d_array(zero_deltas)]
                : potential_state_deltas
            ).flatMap(potential_accumulated_delta =>
                potential_deltas.map(potential_delta =>
                    add_array_of_arrays(potential_delta, potential_accumulated_delta)));
        }
        return;
    }    

    if (!resources[stealingPlayer] || !resources[targetPlayer]){
        LogFailedToParse(stealingPlayer, targetPlayer);
        console.log("failed to parse in unknown rob, no wedding")
        return;
    }

    for (const index of resourceTypes.keys()) {
        var temp = deep_copy_2d_array(zero_deltas);

        temp[stealingPlayerIndex][index] = stolenResource;
        temp[targetPlayerIndex][index] = -stolenResource;

        potential_deltas.push(temp);
    }

    potential_state_deltas = (potential_state_deltas.length === 0
        ? [deep_copy_2d_array(zero_deltas)]
        : potential_state_deltas
    ).flatMap(potential_accumulated_delta =>
        potential_deltas.map(potential_delta =>
            add_array_of_arrays(potential_delta, potential_accumulated_delta)));
}


function ParseUnkownComHarbor(pElement, prevElement){
    if (!prevElement) {
        return;
    }
    var textContent = pElement.textContent;

    if (!textContent.includes("in exchange for a commodity")){
        return;
    }

    var involvedPlayers = textContent.split(" ");
    var stealingPlayer = involvedPlayers[0];
    var targetPlayer = involvedPlayers[2].trim();
    
    var stolenResource = 1;
    var stealingPlayerIndex = players.indexOf(stealingPlayer);
    var targetPlayerIndex = players.indexOf(targetPlayer);

    var potential_deltas = [];

    for (const index of resourceTypes.keys()) {
        var temp = deep_copy_2d_array(zero_deltas);

        // Subtract cloth, coin, and paper from stealing player and add to target player
        if (resourceTypes[index] === "coin" || resourceTypes[index] === "cloth" || resourceTypes[index] === "paper") {
            temp[stealingPlayerIndex][index] = stolenResource;
            temp[targetPlayerIndex][index] = -stolenResource;
        }

        potential_deltas.push(temp);
    }

    potential_state_deltas = (potential_state_deltas.length === 0
        ? [deep_copy_2d_array(zero_deltas)]
        : potential_state_deltas
    ).flatMap(potential_accumulated_delta =>
        potential_deltas.map(potential_delta =>
            add_array_of_arrays(potential_delta, potential_accumulated_delta)));

    for (const index of resourceTypes.keys()) {
        var temp = deep_copy_2d_array(zero_deltas);

        // Subtract wood, brick, sheep, wheat, and stone from target player and add to stealing player
        if (resourceTypes[index] === "wood" || resourceTypes[index] === "brick" || resourceTypes[index] === "sheep" || resourceTypes[index] === "wheat" || resourceTypes[index] === "stone") {
            temp[stealingPlayerIndex][index] = -stolenResource;
            temp[targetPlayerIndex][index] = stolenResource;
        }

        potential_deltas.push(temp);
    }

    potential_state_deltas = (potential_state_deltas.length === 0
        ? [deep_copy_2d_array(zero_deltas)]
        : potential_state_deltas
    ).flatMap(potential_accumulated_delta =>
        potential_deltas.map(potential_delta =>
            add_array_of_arrays(potential_delta, potential_accumulated_delta)));
}

function getIndices(predicate, delta) {
    for (var [outer_index, player_delta] of delta.entries()) {
        var inner_index = player_delta.findIndex(predicate);
        if (inner_index >= 0) {
            return [outer_index, inner_index];
        }
    }
    throw Error("no entry satisfies getIndices predicate");
}

function areAnyNegative(arrayOfArrays) {
    for (let row of arrayOfArrays) {
        for (let element of row) {
            if (element < 0) {
                return true;
            }
        }
    }
    return false;
}

function areAllZero(arrayOfArrays) {
    for (let row of arrayOfArrays) {
        for (let element of row) {
            if (element !== 0) {
                return false;
            }
        }
    }
    return true;
}

function shouldKeep(potential_resources, delta) {
    if (areAnyNegative(potential_resources) || areAllZero(delta)) {
        return false;
    }
    return true;
}

function playerResourcesToArray(playerResourcesDict) {
    var result = [];
    for (const resource of resourceTypes) {
        result.push(playerResourcesDict[resource]);
    }
    return result;
}

function resourcesToDict(resourcesArray) {
    var result = {};
    for (const [playerIndex, playerResources] of resourcesArray.entries()) {
        var playerResourceDict = {};
        for (const [resourceIndex, resourceAmount] of playerResources.entries()) {
            playerResourceDict[resourceTypes[resourceIndex]] = resourceAmount;
        }

        result[players[playerIndex]] = playerResourceDict;
    }
    return result;
}

function resourcesToArray(resourcesDict) {
    var result = [];
    for (const player of players) {
        result.push(playerResourcesToArray(resourcesDict[player]));
    }
    console.log("resoure to array result:", result)
    return result;
}
/**
 * See if thefts can be solved based on current resource count.
 * Rules:
 *  
 *  - if resource count < 0, then they spent a resource they stole (what if there are multiple thefts that could account for this?)
 *  - if resource count + theft count < 0, then we know that resource was stolen, and we can remove it from the list of potentials.
 *     - if there's only 1 resource left, we know what was stolen in another instance.
 */
function reviewThefts() {
    const resourcesArray = resourcesToArray(resources);

    // Filter potential_state_deltas to keep only those where the player has at least 1 resource
    potential_state_deltas_temp = potential_state_deltas.filter(delta =>
        shouldKeep(add_array_of_arrays(resourcesArray, delta), delta)
    );

    // If no potential state deltas remain and any resource count is negative, log an error
    if (potential_state_deltas_temp.length === 0 && areAnyNegative(resourcesArray)) {
        getAllMessages().map(x => x.textContent).slice(-100);
        console.error("Couldn't resolve thefts correctly. There almost certainly is a bug parsing messages");
    }

    // Update potential_state_deltas with the filtered deltas
    potential_state_deltas = potential_state_deltas_temp;

    // If only one potential state delta remains, update actual resources and clear potential_state_deltas
    if (potential_state_deltas.length === 1) {
        const actual_resources_delta = potential_state_deltas[0];
        const actual_resources = add_array_of_arrays(actual_resources_delta, resourcesArray);

        // If any resource count is negative after resolving thefts, throw an error
        if (areAnyNegative(actual_resources)) {
            throw Error("Couldn't resolve thefts correctly");
        }

        // Update resources and clear potential_state_deltas
        resources_temp = resourcesToDict(actual_resources);

        resources = resources_temp;
        potential_state_deltas = [];
    }

    // Check if any player has total resources equal to 0 and clear potential deltas
    for (const player of players) {
        const totalResources = Object.values(resources[player]).reduce((acc, x) => acc + x, 0);
        if (totalResources === 0) {
            potential_state_deltas = potential_state_deltas.filter(delta => {
                const playerIndex = players.indexOf(player);
                return delta[playerIndex].every(resourceChange => resourceChange === 0);
            });
        }
    }
}





var ALL_PARSERS = [
    parseGotMessage,
    parseBuiltMessage,
    parseKnightActivateMessage,
    parseKnightbuildMessage,
    parseKnightUpgradeMessage,
    parseMedicineMessage,
    parseEngineerMessage,
    parseDiploMessage,
    parseComUPMessage,
    parseBoughtMessage,
    parseTradeBankMessage,
    parseYearOfPleantyMessage,
    parseStoleAllOfMessage,
    parseDiscardedMessage,
    parseTradedMessage,
    parseStoleFromYouMessage,
    parseStoleUnknownMessage,
    ParseUnkownComHarbor,
    parseYouCommercialHarbor,
    ];

function checkValidResourceCount() {
    for([playerName, resourceDict] of Object.entries(resources)) {
        for ([resource, count] of Object.entries(resourceDict)) {
            if (count < 0) {
                console.log(`${playerName} has ${count} of ${resource}`);
            }

        }
    }
}

function zip(x, y) {
    return Array.from(Array(Math.max(x.length, y.length)), (_, i) => [x[i], y[i]]);
}
/**
 * Parses the latest messages and re-renders the table.
 */
function parseLatestMessages() {
    var allMessages = getAllMessages();
    var newOffset = allMessages.length;
    var newMessages = allMessages.slice(MSG_OFFSET);
    if (newMessages.length == 0)
        return;

    prevMessages = allMessages.slice(MSG_OFFSET - 1, -1);

    for (const [message, prevMessage] of zip(newMessages, prevMessages)) {
        ALL_PARSERS.forEach(parser => parser(message, prevMessage));
        reviewThefts();
    }
    MSG_OFFSET = newOffset;
    render();
}

function startWatchingMessages() {
    setInterval(parseLatestMessages, 500);
}

/**
* Log initial resource distributions.
*/
function tallyInitialResources() {
    var allMessages = getAllMessages();
    MSG_OFFSET = allMessages.length;
    allMessages.forEach(pElement => parseGotMessageHelper(pElement, startingResourcesSnippet));
    allMessages.forEach(pElement => parseGotMessage(pElement));
    deleteDiscordSigns();
    render();
    deleteDiscordSigns(); // idk why but it takes 2 runs to delete both signs
    startWatchingMessages();
}

/**
* Once initial settlements are placed, determine the players.
*/
function recognizeUsers() {
    var allMessages = getAllMessages();
    var placementMessages = allMessages.filter(msg => msg.textContent.includes(placeInitialSettlementSnippet));
    console.log("total placement messages", placementMessages.length);
    for (var msg of placementMessages) {
        msg_text = msg.textContent;
        username = msg_text.replace(placeInitialSettlementSnippet, "").split(" ")[0];
        console.log(username);
        if (!resources[username]) {
            players.push(username);
            player_colors[username] = msg.style.color;
            resources[username] = {
                [wood]: 0,
                [stone]: 0,
                [wheat]: 0,
                [brick]: 0,
                [sheep]: 0,
                [cloth]: 0,
                [coin]: 0,
                [paper]: 0,
            };
        }
    }
}

function clearResources() {
    for (var player of players) {
        resources[player] = {};
        for (var resourceType of resourceTypes) {
            resources[player][resourceType] = 0;
        }
    }
}

function loadCounter() {
    setTimeout(() => {
        recognizeUsers();
        tallyInitialResources();
    }, 500); // wait for inital resource distribution to be logged
}

function getAllMessages() {
    if (!logElement) {
        throw Error("Log element hasn't been found yet.");
    }
    return collectionToArray(logElement.children);
}

function collectionToArray(collection) {
    return Array.prototype.slice.call(collection);
}

/**
* Wait for players to place initial settlements so we can determine who the players are.
*/
function waitForInitialPlacement() {
    var interval = setInterval(() => {
        if (initialPlacementMade) {
            clearInterval(interval);
            loadCounter();
        } else {
            var messages = Array.prototype.slice.call(logElement.children).map(p => p.textContent);
            if (messages.some(m => m.includes("rolled"))) {
                initialPlacementMade = true;
            }
        }
    }, 500);
}

/**
* Find the transcription.
*/
function findTranscription() {
    var interval = setInterval(() => {
        if (logElement) {
            console.log("Logs loaded...");
            clearInterval(interval);
            waitForInitialPlacement();
        } else {
            logElement = document.getElementById("game-log-text");
        }
    }, 500);
}

function findPlayerName() {
    var interval = setInterval(() => {
        if (playerUsername) {
            console.log("player name loaded...");
            clearInterval(interval);
            playerUsername = playerUsername.textContent
        } else {
            playerUsername = document.getElementById("header_profile_username")//document.getElementById("game-log-text");
        }
    }, 500);
}

findPlayerName();
findTranscription();
