'use strict';

var Grid = require('./grid');
var Player = require('./player');
var Chip = require('./chip');

// An AI player that can think for itself; every AI player inherits from the
// base Player model
function AIPlayer(args) {
  Player.call(this, args);
}
AIPlayer.prototype = Object.create(Player.prototype);
AIPlayer.prototype.type = 'ai';
// The duration to wait (in ms) for the user to process the AI player's actions
AIPlayer.waitDelay = 150;
// The maximum number of grid moves to look ahead; for reasons unknown,
// increasing this to a value greater than 3 will actually cripple the AI's
// ability to handle connect-three trap scenarios
AIPlayer.maxComputeDepth = 3;

// Wait for a short moment to give the user time to see and process the AI
// player's actions
AIPlayer.prototype.wait = function (callback) {
  setTimeout(callback, AIPlayer.waitDelay);
};

// Compute the column where the AI player should place its next chip
AIPlayer.prototype.computeNextMove = function (game) {
  var bestMove = this.maximizeMove(
    game.grid, game.getOtherPlayer(this), AIPlayer.maxComputeDepth,
    Grid.minScore, Grid.maxScore);
  return bestMove;
};

// Choose a column that will maximize the AI player's chances of winning
AIPlayer.prototype.maximizeMove = function (grid, minPlayer, depth, alpha, beta) {
  var gridScore = grid.getScore({
    currentPlayer: this,
    currentPlayerIsMaxPlayer: true
  });
  // If max search depth was reached or if winning grid was found
  if (depth === 0 || Math.abs(gridScore) === Grid.maxScore) {
    return {column: null, score: gridScore};
  }
  var maxMove = {column: null, score: Grid.minScore};
  for (var c = 0; c < grid.columnCount; c += 1) {
    // Continue to next possible move if this column is full
    if (grid.columns[c].length === grid.rowCount) {
      continue;
    }
    // Clone the current grid and place a chip to generate a new permutation
    var nextGrid = new Grid(grid);
    nextGrid.placeChip({
        column: c,
        chip: new Chip({player: this})
    });
    // Minimize the opponent human player's chances of winning
    var minMove = this.minimizeMove(nextGrid, minPlayer, depth - 1, alpha, beta);
    // If a move yields a lower opponent score, make it the tentative max move
    if (minMove.score > maxMove.score) {
      maxMove.column = c;
      maxMove.score = minMove.score;
      alpha = minMove.score;
    } else if (maxMove.score === Grid.minScore) {
      // Ensure that the AI always blocks an opponent win even if the opponent
      // is guaranteed to win on its next turn
      maxMove.column = minMove.column;
      maxMove.score = minMove.score;
      alpha = minMove.score;
    }
    // Stop if there are no moves better than the current max move
    if (alpha >= beta) {
      break;
    }
  }
  return maxMove;
};


// Choose a column that will minimize the human player's chances of winning
AIPlayer.prototype.minimizeMove = function (grid, minPlayer, depth, alpha, beta) {
  var gridScore = grid.getScore({
    currentPlayer: minPlayer,
    currentPlayerIsMaxPlayer: false
  });
  // If max search depth was reached or if winning grid was found
  if (depth === 0 || Math.abs(gridScore) === Grid.maxScore) {
    return {column: null, score: gridScore};
  }
  var minMove = {column: null, score: Grid.maxScore};
  for (var c = 0; c < grid.columnCount; c += 1) {
    // Continue to next possible move if this column is full
    if (grid.columns[c].length === grid.rowCount) {
      continue;
    }
    var nextGrid = new Grid(grid);
    // The human playing against the AI is always the first player
    nextGrid.placeChip({
        column: c,
        chip: new Chip({player: minPlayer})
    });
    // Maximize the AI player's chances of winning
    var maxMove = this.maximizeMove(nextGrid, minPlayer, depth - 1, alpha, beta);
    // If a move yields a higher AI score, make it the tentative max move
    if (maxMove.score < minMove.score) {
      minMove.column = c;
      minMove.score = maxMove.score;
      beta = maxMove.score;
    }
    // Stop if there are no moves better than the current min move
    if (alpha >= beta) {
      break;
    }
  }
  return minMove;
};

module.exports = AIPlayer;
