import { Cell } from "./cell";
import { Ship } from "./ship";

const BOARD_SIZE = 10;
const COLUMNS = "ABCDEFGHIJ";
const ORIENTATIONS = ["horizontal", "vertical"];
const SHIP_LENGTHS = {
  carrier: 5,
  battleship: 4,
  cruiser: 3,
  submarine: 3,
  destroyer: 2,
  patrolboat: 2,
};

const normalizeShipType = (shipType) => {
  if (typeof shipType !== "string") return "";

  return shipType.toLowerCase().replace(/[\s_-]/g, "");
};

const normalizeOrientation = (orientation) => {
  if (typeof orientation !== "string") return "";

  return orientation.toLowerCase();
};

const getXIndex = (x) => {
  if (typeof x === "string") return COLUMNS.indexOf(x.toUpperCase());
  if (Number.isInteger(x)) return x - 1;

  return -1;
};

const getYIndex = (y) => (Number.isInteger(y) ? y - 1 : -1);

const isIndexOnBoard = (index) => index >= 0 && index < BOARD_SIZE;

const getPlacementCells = (board, length, xIndex, yIndex, orientation) => {
  return Array.from({ length }, (_, index) => {
    const row = orientation === "vertical" ? yIndex + index : yIndex;
    const column = orientation === "horizontal" ? xIndex + index : xIndex;

    return board[row]?.[column];
  });
};

const areCellsAvailable = (cells) => {
  return cells.every((cell) => cell?.getToken() === "O");
};

const Gameboard = () => {
  let gameBoard = [];
  let ships = [];

  const create = () => {
    gameBoard = [];
    ships = [];

    for (let row = 1; row <= BOARD_SIZE; row++) {
      const boardRow = [];

      for (const column of COLUMNS) {
        const cell = Cell();
        cell.setIndices(row, column);
        boardRow.push(cell);
      }

      gameBoard.push(boardRow);
    }

    return gameBoard;
  };

  const getBoard = () => gameBoard;

  const placeShip = (shipType, x, y, orientation) => {
    const shipLength = SHIP_LENGTHS[normalizeShipType(shipType)];
    const direction = normalizeOrientation(orientation);
    const xIndex = getXIndex(x);
    const yIndex = getYIndex(y);

    const isValidStart =
      gameBoard.length === BOARD_SIZE &&
      isIndexOnBoard(xIndex) &&
      isIndexOnBoard(yIndex);

    if (!shipLength || !ORIENTATIONS.includes(direction) || !isValidStart) {
      return null;
    }

    const cells = getPlacementCells(
      gameBoard,
      shipLength,
      xIndex,
      yIndex,
      direction,
    );

    if (!areCellsAvailable(cells)) return null;

    const placedShip = Ship(shipLength);
    cells.forEach((cell) => cell.setToken("S"));
    ships.push(placedShip);

    return placedShip;
  };

  const reset = () => {
    return create();
  };

  return { create, getBoard, placeShip, reset };
};

export { Gameboard };