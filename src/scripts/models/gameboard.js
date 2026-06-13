import { Cell } from "./cell.js";
import { Ship } from "./ship.js";

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

const getBoardPosition = (x, y) => {
  const xIndex = getXIndex(x);
  const yIndex = getYIndex(y);

  if (!isIndexOnBoard(xIndex) || !isIndexOnBoard(yIndex)) return null;

  return { xIndex, yIndex };
};

const getPlacementCells = (board, length, xIndex, yIndex, orientation) => {
  return Array.from({ length }, (_, index) => {
    const row = orientation === "vertical" ? yIndex + index : yIndex;
    const column = orientation === "horizontal" ? xIndex + index : xIndex;

    return board[row]?.[column];
  });
};

const hasAdjacentShip = (board, cell) => {
  const { column, row } = cell.getIndices();
  const xIndex = COLUMNS.indexOf(column);
  const yIndex = row - 1;

  for (let y = yIndex - 1; y <= yIndex + 1; y++) {
    for (let x = xIndex - 1; x <= xIndex + 1; x++) {
      if (board[y]?.[x]?.getToken() === "S") return true;
    }
  }

  return false;
};

const areCellsAvailable = (board, cells) => {
  return cells.every(
    (cell) => cell?.getToken() === "O" && !hasAdjacentShip(board, cell),
  );
};

const Gameboard = () => {
  let gameBoard = [];
  let ships = [];
  let shipPlacements = [];
  let shipByCell = new Map();
  let missedAttacks = [];

  const create = () => {
    gameBoard = [];
    ships = [];
    shipPlacements = [];
    shipByCell = new Map();
    missedAttacks = [];

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

  const getValidPlacement = (shipType, x, y, orientation) => {
    const normalizedType = normalizeShipType(shipType);
    const shipLength = SHIP_LENGTHS[normalizedType];
    const direction = normalizeOrientation(orientation);
    const position = getBoardPosition(x, y);
    const isValidStart = gameBoard.length === BOARD_SIZE && position !== null;

    if (!shipLength || !ORIENTATIONS.includes(direction) || !isValidStart) {
      return null;
    }

    const { xIndex, yIndex } = position;
    const cells = getPlacementCells(
      gameBoard,
      shipLength,
      xIndex,
      yIndex,
      direction,
    );

    if (!areCellsAvailable(gameBoard, cells)) return null;

    return { cells, direction, normalizedType, shipLength };
  };

  const canPlaceShip = (shipType, x, y, orientation) => {
    return getValidPlacement(shipType, x, y, orientation) !== null;
  };

  const placeShip = (shipType, x, y, orientation) => {
    const placement = getValidPlacement(shipType, x, y, orientation);

    if (!placement) return null;

    const placedShip = Ship(placement.shipLength);
    placement.cells.forEach((cell) => {
      cell.setToken("S");
      shipByCell.set(cell, placedShip);
    });
    ships.push(placedShip);
    shipPlacements.push({
      cells: placement.cells.map((cell) => cell.getIndices()),
      length: placement.shipLength,
      orientation: placement.direction,
      ship: placedShip,
      type: placement.normalizedType,
    });

    return placedShip;
  };

  const updatePlacementCells = (placement, cells) => {
    cells.forEach((cell) => {
      cell.setToken("S");
      shipByCell.set(cell, placement.ship);
    });
    placement.cells = cells.map((cell) => cell.getIndices());
  };

  const clearPlacementCells = (placement) => {
    placement.cells.forEach(({ column, row }) => {
      const cell = gameBoard[row - 1][COLUMNS.indexOf(column)];
      cell.setToken("O");
      shipByCell.delete(cell);
    });
  };

  const rotateShip = (shipType) => {
    const normalizedType = normalizeShipType(shipType);
    const placement = shipPlacements.find(
      ({ type }) => type === normalizedType,
    );

    if (!placement) return false;

    const originalCells = placement.cells.map(({ column, row }) => {
      return gameBoard[row - 1][COLUMNS.indexOf(column)];
    });

    if (originalCells.some((cell) => cell.getToken() !== "S")) return false;

    const originalOrientation = placement.orientation;
    const nextOrientation =
      originalOrientation === "horizontal" ? "vertical" : "horizontal";
    const start = placement.cells[0];

    clearPlacementCells(placement);
    const rotatedPlacement = getValidPlacement(
      placement.type,
      start.column,
      start.row,
      nextOrientation,
    );

    if (!rotatedPlacement) {
      updatePlacementCells(placement, originalCells);
      return false;
    }

    updatePlacementCells(placement, rotatedPlacement.cells);
    placement.orientation = nextOrientation;
    return true;
  };

  const getShipPlacements = () => {
    return shipPlacements.map(({ cells, length, orientation, ship, type }) => ({
      cells: cells.map((cell) => ({ ...cell })),
      length,
      orientation,
      sunk: ship.isSunk(),
      type,
    }));
  };

  const receiveAttack = (x, y) => {
    const position = getBoardPosition(x, y);

    if (gameBoard.length !== BOARD_SIZE || !position) return null;

    const { xIndex, yIndex } = position;
    const cell = gameBoard[yIndex][xIndex];
    const token = cell.getToken();

    if (token === "X" || token === "M") return null;

    if (token === "S") {
      shipByCell.get(cell).hit();
      cell.setToken("X");
      return true;
    }

    cell.setToken("M");
    missedAttacks.push(cell.getIndices());
    return false;
  };

  const getMissedAttacks = () => [...missedAttacks];

  const allShipsSunk = () => {
    return ships.length > 0 && ships.every((ship) => ship.isSunk());
  };

  const reset = () => {
    return create();
  };

  return {
    allShipsSunk,
    canPlaceShip,
    create,
    getBoard,
    getMissedAttacks,
    getShipPlacements,
    placeShip,
    receiveAttack,
    reset,
    rotateShip,
  };
};

export { Gameboard };
