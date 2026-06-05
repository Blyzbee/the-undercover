// Game logic for Undercover

class UndercoverGame {
	constructor() {
		// Game state
		this.players = [];
		this.wordPairs = [];
		this.selectedWordPair = null;
		this.currentPlayerIndex = 0;
		this.holdStartTime = null;
		this.holdInterval = null;
		this.holdThreshold = 1000; // ms
		this.gamePhase = "setup"; // setup, names, gameplay, results

		// DOM elements
		this.elements = {
			setup: document.getElementById("setup"),
			names: document.getElementById("names"),
			gameplay: document.getElementById("gameplay"),
			results: document.getElementById("results"),
			playerCountButtons: document.querySelectorAll(".count-btn"),
			nameInputs: document.getElementById("name-inputs"),
			startGameBtn: document.getElementById("start-game"),
			currentPlayerName: document.getElementById("current-player-name"),
			playerWord: document.getElementById("player-word"),
			card: document.querySelector(".card"),
			holdIndicator: document.querySelector(".hold-indicator"),
			holdBar: document.querySelector(".hold-bar"),
			nextPlayerBtn: document.getElementById("next-player"),
			revealAllBtn: document.getElementById("reveal-all"),
			restartGameBtn: document.getElementById("restart-game"),
			resultsContent: document.getElementById("results-content"),
		};

		// Initialize the game
		this.init();
	}

	init() {
		// Load word pairs from JSON
		this.loadWordPairs()
			.then(() => {
				// Set up event listeners
				this.setupEventListeners();

				// Show setup phase
				this.showPhase("setup");
			})
			.catch((err) => {
				console.error("Error loading word pairs:", err);
				alert(
					"Erreur lors du chargement des mots. Veuillez vérifier le fichier words.json.",
				);
			});
	}

	async loadWordPairs() {
		try {
			const response = await fetch("data/words.json");
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			this.wordPairs = await response.json();
			console.log("Word pairs loaded:", this.wordPairs.length, "pairs");
		} catch (error) {
			console.error("Failed to load word pairs:", error);
			// Fallback to a small set of words if JSON fails
			this.wordPairs = [
				["chat", "chien"],
				["voiture", "avion"],
				["pomme", "banane"],
			];
		}
	}

	setupEventListeners() {
		// Player count selection
		this.elements.playerCountButtons.forEach((button) => {
			button.addEventListener("click", (e) => {
				const count = parseInt(e.target.dataset.count);
				this.selectPlayerCount(count);
			});
		});

		// Start game button
		this.elements.startGameBtn.addEventListener("click", () => {
			this.startGame();
		});

		// Card interaction
		this.elements.card.addEventListener("mousedown", (e) => {
			e.preventDefault();
			this.holdStartTime = Date.now();
			this.holdInterval = setInterval(() => {
				const elapsed = Date.now() - this.holdStartTime;
				const progress = Math.min(100, (elapsed / this.holdThreshold) * 100);
				this.elements.holdBar.style.width = `${progress}%`;

				if (elapsed >= this.holdThreshold) {
					this.showWord();
					clearInterval(this.holdInterval);
				}
			}, 10);

			// Show hold indicator
			this.elements.holdIndicator.classList.add("active");
		});

		this.elements.card.addEventListener("touchstart", (e) => {
			e.preventDefault();
			this.holdStartTime = Date.now();
			this.holdInterval = setInterval(() => {
				const elapsed = Date.now() - this.holdStartTime;
				const progress = Math.min(100, (elapsed / this.holdThreshold) * 100);
				this.elements.holdBar.style.width = `${progress}%`;

				if (elapsed >= this.holdThreshold) {
					this.showWord();
					clearInterval(this.holdInterval);
				}
			}, 10);

			// Show hold indicator
			this.elements.holdIndicator.classList.add("active");
		});

		// Mouse/touch up
		document.addEventListener("mouseup", () => {
			if (this.holdInterval) {
				clearInterval(this.holdInterval);
				this.holdInterval = null;
			}
			this.holdStartTime = null;
			this.hideWord();
		});

		document.addEventListener("touchend", () => {
			if (this.holdInterval) {
				clearInterval(this.holdInterval);
				this.holdInterval = null;
			}
			this.holdStartTime = null;
			this.hideWord();
		});

		// Next player button
		this.elements.nextPlayerBtn.addEventListener("click", () => {
			this.nextPlayer();
		});

		// Reveal all button
		this.elements.revealAllBtn.addEventListener("click", () => {
			this.revealAllWords();
		});

		// Restart game button
		this.elements.restartGameBtn.addEventListener("click", () => {
			this.restartGame();
		});
	}

	selectPlayerCount(count) {
		// Remove active class from all buttons
		this.elements.playerCountButtons.forEach((button) => {
			button.classList.remove("active");
		});

		// Add active class to selected button
		const selectedButton = document.querySelector(
			`.count-btn[data-count="${count}"]`,
		);
		if (selectedButton) {
			selectedButton.classList.add("active");
		}

		// Store selected count
		this.playerCount = count;

		// Show name input section
		this.showPhase("names");

		// Create player name inputs
		this.createNameInputs();
	}

	createNameInputs() {
		const container = this.elements.nameInputs;
		container.innerHTML = "";

		for (let i = 1; i <= this.playerCount; i++) {
			const inputDiv = document.createElement("div");
			inputDiv.className = "player-name-input";

			inputDiv.innerHTML = `
                <span class="player-number">${i}</span>
                <input type="text" placeholder="Nom du joueur ${i}" data-index="${i - 1}" required>
            `;

			container.appendChild(inputDiv);
		}
	}

	startGame() {
		// Get player names
		const nameInputs = document.querySelectorAll("#name-inputs input");
		const names = [];

		let valid = true;
		nameInputs.forEach((input) => {
			const name = input.value.trim();
			if (!name) {
				valid = false;
				input.style.borderColor = "red";
			} else {
				input.style.borderColor = "";
				names.push(name);
			}
		});

		if (!valid) {
			alert("Veuillez entrer un nom pour chaque joueur.");
			return;
		}

		// Store player names
		this.players = names.map((name, index) => ({
			name: name,
			word: "",
			isUndercover: false,
		}));

		// Select a word pair
		const randomIndex = Math.floor(Math.random() * this.wordPairs.length);
		this.selectedWordPair = this.wordPairs[randomIndex];

		// Assign words
		// All players get the first word, except one who gets the second word (the undercover)
		const undercoverIndex = Math.floor(Math.random() * this.players.length);

		this.players.forEach((player, index) => {
			player.word =
				index === undercoverIndex
					? this.selectedWordPair[1]
					: this.selectedWordPair[0];
			player.isUndercover = index === undercoverIndex;
		});

		// Show gameplay phase
		this.showPhase("gameplay");

		// Set current player
		this.currentPlayerIndex = 0;
		this.updateCurrentPlayer();

		// Reset card state
		this.elements.card.classList.remove("flipped");
		this.elements.holdBar.style.width = "0%";
		this.elements.holdIndicator.classList.remove("active");

		// Update word display
		this.updatePlayerWord();
	}

	nextPlayer() {
		this.currentPlayerIndex =
			(this.currentPlayerIndex + 1) % this.players.length;
		this.updateCurrentPlayer();
		this.updatePlayerWord();

		// Reset card state
		this.elements.card.classList.remove("flipped");
		this.elements.holdBar.style.width = "0%";
		this.elements.holdIndicator.classList.remove("active");
	}

	showWord() {
		this.elements.card.classList.add("flipped");
		this.updatePlayerWord();

		// Add a little shake effect
		this.elements.card.classList.add("shake");
		setTimeout(() => {
			this.elements.card.classList.remove("shake");
		}, 300);
	}

	// Add this method to hide the word when released
	hideWord() {
		this.elements.card.classList.remove("flipped");
		this.elements.holdBar.style.width = "0%";
		this.elements.holdIndicator.classList.remove("active");
	}

	revealAllWords() {
		// Reveal all words
		this.players.forEach((player) => {
			player.isRevealed = true;
		});

		// Update the display
		this.updatePlayerWord();

		// Save game history
		saveGameHistory(this.players.map((p) => p.name));

		// Show results
		this.showResults();
	}

	updatePlayerWord() {
		const currentPlayer = this.players[this.currentPlayerIndex];
		this.elements.playerWord.textContent = currentPlayer.word;

		// If the word is revealed, add a visual cue
		if (this.gamePhase === "gameplay" && currentPlayer.isRevealed) {
			this.elements.playerWord.style.color = "#e74c3c";
		} else {
			this.elements.playerWord.style.color = "";
		}
	}

	updateCurrentPlayer() {
		const currentPlayer = this.players[this.currentPlayerIndex];
		this.elements.currentPlayerName.textContent = currentPlayer.name;
	}

	showPhase(phase) {
		// Hide all sections
		this.elements.setup.classList.add("hidden");
		this.elements.names.classList.add("hidden");
		this.elements.gameplay.classList.add("hidden");
		this.elements.results.classList.add("hidden");

		// Show the selected phase
		this.elements[phase].classList.remove("hidden");

		// Update game phase
		this.gamePhase = phase;
	}

	showResults() {
		// Show results section
		this.showPhase("results");

		// Display results
		const resultsContainer = this.elements.resultsContent;
		resultsContainer.innerHTML = "";

		// Create result items
		this.players.forEach((player) => {
			const resultItem = document.createElement("div");
			resultItem.className = "result-item";

			const status = player.isUndercover ? "Agent secret" : "Joueur normal";
			const statusClass = player.isUndercover ? "undercover" : "";

			resultItem.innerHTML = `
                <div class="player-name">${player.name}</div>
                <div class="word">${player.word}</div>
                <div class="status ${statusClass}">${status}</div>
            `;

			resultsContainer.appendChild(resultItem);
		});

		// Add a message about the undercover
		const undercover = this.players.find((p) => p.isUndercover);
		const message = document.createElement("p");
		message.textContent = `L'agent secret est ${undercover.name} avec le mot "${undercover.word}".`;
		message.style.color = "#e74c3c";
		message.style.fontWeight = "bold";
		message.style.textAlign = "center";
		message.style.marginTop = "20px";
		resultsContainer.appendChild(message);
	}

	restartGame() {
		// Reset game state
		this.players = [];
		this.selectedWordPair = null;
		this.currentPlayerIndex = 0;
		this.holdStartTime = null;
		this.holdInterval = null;
		this.gamePhase = "setup";

		// Reset UI
		this.showPhase("setup");

		// Clear player count selection
		this.elements.playerCountButtons.forEach((button) => {
			button.classList.remove("active");
		});

		// Clear name inputs
		this.elements.nameInputs.innerHTML = "";

		// Reset card state
		this.elements.card.classList.remove("flipped");
		this.elements.holdBar.style.width = "0%";
		this.elements.holdIndicator.classList.remove("active");

		// Reset current player
		this.elements.currentPlayerName.textContent = "-";
		this.elements.playerWord.textContent = "-";
	}
}

// Initialize the game when the page loads
window.addEventListener("DOMContentLoaded", () => {
	// Check if there's player history in localStorage
	const savedHistory = localStorage.getItem("undercoverHistory");
	if (savedHistory) {
		const history = JSON.parse(savedHistory);
		displayHistory(history);
	}

	new UndercoverGame();
});

// Function to display player history
function displayHistory(history) {
	const historyContainer = document.getElementById("history-container");
	if (!historyContainer) return;

	// Clear existing history
	historyContainer.innerHTML = "";

	// Sort history by date (newest first)
	history.sort((a, b) => new Date(b.date) - new Date(a.date));

	// Create history items
	history.forEach((game, index) => {
		const historyItem = document.createElement("div");
		historyItem.className = "history-item";

		// Create date display
		const date = new Date(game.date);
		const formattedDate = date.toLocaleDateString("fr-FR", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});

		// Create player list display
		const playerList = game.players.join(", ");

		// Create the history item HTML
		historyItem.innerHTML = `
                <div class="history-info">
                    <div class="history-date">${formattedDate}</div>
                    <div class="history-players">${playerList}</div>
                </div>
                <button class="load-btn" data-index="${index}">Rejouer</button>
                <button class="delete-btn" data-index="${index}">Supprimer</button>
            `;

		historyContainer.appendChild(historyItem);
	});

	// Add event listeners to delete buttons
	document.querySelectorAll(".delete-btn").forEach((button) => {
		button.addEventListener("click", function () {
			const index = parseInt(this.getAttribute("data-index"));
			const history = JSON.parse(localStorage.getItem("undercoverHistory"));
			history.splice(index, 1);
			localStorage.setItem("undercoverHistory", JSON.stringify(history));
			displayHistory(history);
		});
	});

	// Add event listeners to load buttons
	document.querySelectorAll(".load-btn").forEach((button) => {
		button.addEventListener("click", function () {
			const index = parseInt(this.getAttribute("data-index"));
			const history = JSON.parse(localStorage.getItem("undercoverHistory"));
			const game = history[index];

			// Set the player count based on the saved game
			const playerCount = game.players.length;

			// Update the player count selection
			document.querySelector(`.count-btn[data-count="${playerCount}"]`).click();

			// Set the player names
			const nameInputs = document.querySelectorAll("#name-inputs input");
			game.players.forEach((name, index) => {
				if (nameInputs[index]) {
					nameInputs[index].value = name;
				}
			});

			// Start the game with the saved players
			document.getElementById("start-game").click();

			// Update the history display
			displayHistory(history);
		});
	});
}

// Function to save game history
function saveGameHistory(players) {
	const history = localStorage.getItem("undercoverHistory")
		? JSON.parse(localStorage.getItem("undercoverHistory"))
		: [];

	const game = {
		players: players,
		date: new Date().toISOString(),
	};

	history.unshift(game);

	localStorage.setItem("undercoverHistory", JSON.stringify(history));

	// Update the displayed history
	displayHistory(history);
}

// Enregistrer le service worker
if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register("/service-worker.js")
			.then((registration) => {
				console.log("Service Worker enregistré avec succès :", registration);
			})
			.catch((error) => {
				console.error("Échec de l'enregistrement du Service Worker :", error);
			});
	});
}
