'use strict';

var Grid = require('./grid');
var HumanPlayer = require('./human-player');
var AIPlayer = require('./ai-player');
var Chip = require('./chip');

function Game(args) {
  if (args && args.grid) {
    this.grid = args.grid;
  } else {
    this.grid = new Grid({
      columnCount: 7,
      rowCount: 6
    });
  }
  if (args && args.players) {
    this.players = args.players;
  } else {
    this.players = [];
  }
  // The number of human players (if 1, assume the other player is an AI)
  this.humanPlayerCount = null;
  // The current player is null when a game is not in progress
  this.currentPlayer = null;
  // Whether or not the game is in progress
  this.inProgress = false;
  // The chip above the grid that is about to be placed
  this.pendingChip = null;
  // The chip that was most recently placed on the grid
  this.lastPlacedChip = null;
  // The winning player of the game
  this.winner = null;
}

Game.prototype.startGame = function (args) {
  this.currentPlayer = args.startingPlayer;
  this.inProgress = true;
  this.startTurn();
};

// End the game without resetting the grid
Game.prototype.endGame = function () {
  if (this.winner) {
    this.winner.score += 1;
  }
  this.inProgress = false;
  this.currentPlayer = null;
  this.pendingChip = null;
  this.humanPlayerCount = null;
};

// Reset the game and grid completely without starting a new game (endGame
// should be called somewhere before this method is called)
Game.prototype.resetGame = function () {
  this.lastPlacedChip = null;
  this.winner = null;
  this.grid.resetGrid();
};

// Initialize or change the current set of players
Game.prototype.setPlayers = function (newHumanPlayerCount) {
  // If this is the very first game, initialize a set of players
  if (this.players.length === 0) {
    // At least one player will always be human
    this.players.push(new HumanPlayer({name: 'Player 1', color: 'red'}));
    if (newHumanPlayerCount === 1) {
      // If user chose 1-Player mode, the user will play against the AI
      this.players.push(new AIPlayer({name: 'Mr. AI', color: 'black'}));
    } else {
      // Otherwise, the user will play against another human
      this.players.push(new HumanPlayer({name: 'Player 2', color: 'blue'}));
    }
    this.humanPlayerCount = newHumanPlayerCount;
  } else {
    // TODO: Otherwise, if user changes from 1-Player game to 2-Player game (or
    // vice versa), swap out the AI Player for a human player (or vice versa)
  }
};

// Start the turn of the current player
Game.prototype.startTurn = function () {
  this.pendingChip = new Chip({player: this.currentPlayer});
};

// End the turn of the current player and switch to the next player
Game.prototype.endTurn = function () {
  if (this.inProgress) {
    // Switch to next player's turn
    if (this.currentPlayer === this.players[0]) {
      this.currentPlayer = this.players[1];
    } else {
      this.currentPlayer = this.players[0];
    }
    this.startTurn();
  }
};

// Insert the current pending chip into the columns array at the given index
Game.prototype.placePendingChip = function (args) {
  if (this.pendingChip) {
    this.grid.placeChip({
      chip: this.pendingChip,
      column: args.column
    });
    this.lastPlacedChip = this.pendingChip;
    this.pendingChip = null;
    // Check for winning connections (i.e. four in a row)
    this.checkForWin();
    // Check if the grid is completely full
    this.checkForFullGrid();
    // If the above checks have not ended the game, continue to next player's
    // turn
    this.endTurn();
  }
};

// Check if the grid is completely full of chips, and end the game if it is
Game.prototype.checkForFullGrid = function () {
  if (this.grid.checkIfFull()) {
    this.endGame();
  }
};

// Determine if a player won the game with four chips in a row (horizontally,
// vertically, or diagonally)
Game.prototype.checkForWin = function () {
  var connections = this.grid.getConnections({
    baseChip: this.lastPlacedChip,
    connectionSize: 4
  });
  if (connections.length > 0) {
    // Highlight chips to indicate that they're part of a winning connection
    connections.forEach(function (connection) {
      // Only highlight some group of exactly four chips within the connection
      connection.length = 4;
      connection.forEach(function (chip) {
        chip.highlighted = true;
      });
    });
    this.winner = this.lastPlacedChip.player;
    this.endGame();
  }
};

module.exports = Game;
