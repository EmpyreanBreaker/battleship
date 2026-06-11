/**
 * A Cell represents one 'square' on the board
 * Cell's keep track of their row and column
 * A Cell's token can have four possibilities
 * S: Ship token
 * O: Ocean token
 * X: Ship token hit
 * M: Missed hit
 */
const Cell = () => {
  // Holds token values for the game board
  let token = "O";

  let row = 0;
  let column = 0;

  const getData = () => {
    return { row, column, token };
  };

  // Getter: Return the index values of the cell
  const getIndices = () => ({ row, column });

  //Getter: Return the token value held in the cell
  const getToken = () => token;

  // Setter: Set the index values of the cell in an object
  const setIndices = (gameRow, gameColumn) => {
    row = gameRow;
    column = gameColumn;
  };

  // Setter: Accept's a token to change the value of the cell
  const setToken = (gameToken) => (token = gameToken);

  // Use closure to interact with local variables
  return { getData, getIndices, getToken, setIndices, setToken };
};

export { Cell };