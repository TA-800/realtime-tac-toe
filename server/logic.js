// Game Instance
class TicTacToe {
    constructor() {
        this.currentPlayer = "X";
        this.board = [
            [null, null, null],
            [null, null, null],
            [null, null, null],
        ];
        this.winner = null;
        // We can know if the game is a draw if 9 moves have been made
        this.moves = 0;
    }

    // Return 0 if no move was made, 1 if move was made, 2 if move was made and game is over, 3 if move was made and game is over with draw
    makeMove(row, col) {
        if (!isValidMove(row, col)) return 0;

        if (this.board[row][col] == null) {
            this.board[row][col] = this.currentPlayer;
            this.moves++;
            if (this.checkWinner() === true) {
                this.winner = this.currentPlayer;
                return 2;
            }
            if (this.moves === 9) {
                return 3;
            }
            this.currentPlayer = this.currentPlayer == "X" ? "O" : "X";
            return 1;
        }
    }

    // Return true if there is a winner, false otherwise
    checkWinner() {
        // If there are less than 5 moves, there is no way to win
        if (this.moves < 5) return false;

        // Check rows
        for (let i = 0; i < 3; i++) {
            for (let j = 1; j < 3; j++) {
                // Check and break if current cell is not equal to the previous cell, or if current cell is null
                if (this.board[i][j] !== this.board[i][j - 1] || this.board[i][j] === null) break;
                // If we reach the end of the row, then there is a winner
                if (j === 2) return true;
            }
        }

        // Check columns
        for (let j = 0; j < 3; j++) {
            for (let i = 1; i < 3; i++) {
                if (this.board[i][j] !== this.board[i - 1][j] || this.board[i][j] === null) break;
                if (i === 2) return true;
            }
        }

        // Check diagonals
        if (
            (this.board[0][0] !== null && this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2]) ||
            (this.board[0][2] !== null && this.board[0][2] === this.board[1][1] && this.board[1][1] === this.board[2][1])
        ) {
            return true;
        }

        return false;
    }

    // Return true if move is valid, false otherwise
    isValidMove(row, col) {
        if (row < 0 || row > 2 || col < 0 || col > 2) return false;
        return true;
    }

    reset() {
        this.currentPlayer = "X";
        this.board = [
            [null, null, null],
            [null, null, null],
            [null, null, null],
        ];
        this.winner = null;
        this.moves = 0;
    }

    // Return game information like board (populated cells), current player, and winner in object form
    getGameInformation() {
        return {
            board: this.board,
            currentPlayer: this.currentPlayer,
            winner: this.winner,
        };
    }
}

// export default TicTacToe;
module.exports = TicTacToe;
