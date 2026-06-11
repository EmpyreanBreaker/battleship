import { Gameboard } from "../../scripts/models/gameboard";

describe("Gameboard", () => {
  let gameboard;

  beforeEach(() => {
    gameboard = Gameboard();
  });

  test("starts with an empty board", () => {
    expect(gameboard.getBoard()).toEqual([]);
  });

  test("creates a 10 by 10 board", () => {
    const board = gameboard.create();

    expect(board).toHaveLength(10);
    board.forEach((row) => expect(row).toHaveLength(10));
    expect(gameboard.getBoard()).toBe(board);
  });

  test("assigns row and column coordinates to every cell", () => {
    const board = gameboard.create();
    const columns = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

    const coordinates = board.map((row) =>
      row.map((cell) => cell.getIndices()),
    );
    const expectedCoordinates = Array.from({ length: 10 }, (_, row) =>
      columns.map((column) => ({ row: row + 1, column })),
    );

    expect(coordinates).toEqual(expectedCoordinates);
  });

  test("creates cells containing ocean tokens", () => {
    const board = gameboard.create();

    expect(board.flat().every((cell) => cell.getToken() === "O")).toBe(true);
  });

  test("places a ship horizontally", () => {
    const board = gameboard.create();

    const placedShip = gameboard.placeShip("destroyer", 2, 3, "horizontal");

    expect(placedShip.getData()).toEqual({ length: 2, hits: 0 });
    expect(board[2].map((cell) => cell.getToken())).toEqual([
      "O",
      "S",
      "S",
      "O",
      "O",
      "O",
      "O",
      "O",
      "O",
      "O",
    ]);
  });

  test("places a ship vertically using a letter x coordinate", () => {
    const board = gameboard.create();

    const placedShip = gameboard.placeShip("battleship", "J", 7, "vertical");

    expect(placedShip.getData()).toEqual({ length: 4, hits: 0 });
    expect(board.slice(6).map((row) => row[9].getToken())).toEqual([
      "S",
      "S",
      "S",
      "S",
    ]);
  });

  test.each([
    ["carrier", 7, 1, "horizontal"],
    ["carrier", 1, 7, "vertical"],
  ])(
    "rejects a %s placement that extends beyond the board",
    (shipType, x, y, orientation) => {
      const board = gameboard.create();

      expect(gameboard.placeShip(shipType, x, y, orientation)).toBeNull();
      expect(board.flat().every((cell) => cell.getToken() === "O")).toBe(true);
    },
  );

  test("rejects a placement that overlaps another ship", () => {
    const board = gameboard.create();
    gameboard.placeShip("cruiser", 3, 3, "horizontal");

    const overlappingShip = gameboard.placeShip("submarine", 4, 2, "vertical");

    expect(overlappingShip).toBeNull();
    expect(board[1][3].getToken()).toBe("O");
    expect(board[2][2].getToken()).toBe("S");
    expect(board[2][3].getToken()).toBe("S");
    expect(board[2][4].getToken()).toBe("S");
    expect(board[3][3].getToken()).toBe("O");
  });

  test("rejects a placement over a recorded miss", () => {
    const board = gameboard.create();
    board[0][1].setToken("M");

    expect(gameboard.placeShip("destroyer", 1, 1, "horizontal")).toBeNull();
    expect(board[0][0].getToken()).toBe("O");
    expect(board[0][1].getToken()).toBe("M");
  });

  test.each([
    ["unknown ship", 1, 1, "horizontal"],
    ["destroyer", 0, 1, "horizontal"],
    ["destroyer", 1, 11, "horizontal"],
    ["destroyer", 1, 1, "diagonal"],
  ])("rejects invalid placement arguments", (shipType, x, y, orientation) => {
    const board = gameboard.create();

    expect(gameboard.placeShip(shipType, x, y, orientation)).toBeNull();
    expect(board.flat().every((cell) => cell.getToken() === "O")).toBe(true);
  });

  test("resets the board with fresh cells", () => {
    const originalBoard = gameboard.create();
    originalBoard[0][0].setToken("S");

    const resetBoard = gameboard.reset();

    expect(resetBoard).not.toBe(originalBoard);
    expect(gameboard.getBoard()).toBe(resetBoard);
    expect(resetBoard).toHaveLength(10);
    expect(resetBoard.flat().every((cell) => cell.getToken() === "O")).toBe(
      true,
    );
  });
});
