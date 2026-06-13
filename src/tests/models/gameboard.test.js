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

  test.each([
    [3, 2, "horizontal"],
    [2, 2, "horizontal"],
    [6, 2, "vertical"],
  ])(
    "rejects ships placed directly or diagonally beside another ship",
    (x, y, orientation) => {
      const board = gameboard.create();
      gameboard.placeShip("cruiser", 3, 3, "horizontal");

      expect(gameboard.placeShip("destroyer", x, y, orientation)).toBeNull();
      expect(
        board.flat().filter((cell) => cell.getToken() === "S"),
      ).toHaveLength(3);
    },
  );

  test("allows placement when ships have one full cell of separation", () => {
    gameboard.create();
    gameboard.placeShip("cruiser", 3, 3, "horizontal");

    expect(gameboard.canPlaceShip("destroyer", 3, 5, "horizontal")).toBe(true);
    expect(gameboard.placeShip("destroyer", 3, 5, "horizontal")).not.toBeNull();
  });

  test("reports ship placement details without exposing mutable coordinates", () => {
    gameboard.create();
    gameboard.placeShip("battleship", 2, 3, "vertical");

    const placements = gameboard.getShipPlacements();
    placements[0].cells[0].row = 10;

    expect(gameboard.getShipPlacements()).toEqual([
      {
        cells: [
          { column: "B", row: 3 },
          { column: "B", row: 4 },
          { column: "B", row: 5 },
          { column: "B", row: 6 },
        ],
        length: 4,
        orientation: "vertical",
        sunk: false,
        type: "battleship",
      },
    ]);
  });

  test("rotates a placed ship around its starting cell", () => {
    const board = gameboard.create();
    const destroyer = gameboard.placeShip("destroyer", 2, 3, "horizontal");

    expect(gameboard.rotateShip("destroyer")).toBe(true);
    expect(gameboard.getShipPlacements()[0]).toEqual({
      cells: [
        { column: "B", row: 3 },
        { column: "B", row: 4 },
      ],
      length: 2,
      orientation: "vertical",
      sunk: false,
      type: "destroyer",
    });
    expect(board[2][1].getToken()).toBe("S");
    expect(board[2][2].getToken()).toBe("O");
    expect(board[3][1].getToken()).toBe("S");

    gameboard.receiveAttack(2, 4);
    expect(destroyer.getData().hits).toBe(1);
  });

  test("toggles a ship between vertical and horizontal orientations", () => {
    gameboard.create();
    gameboard.placeShip("destroyer", 2, 3, "horizontal");

    expect(gameboard.rotateShip("destroyer")).toBe(true);
    expect(gameboard.rotateShip("destroyer")).toBe(true);
    expect(gameboard.getShipPlacements()[0]).toEqual(
      expect.objectContaining({
        cells: [
          { column: "B", row: 3 },
          { column: "C", row: 3 },
        ],
        orientation: "horizontal",
      }),
    );
  });

  test("restores a ship when rotation would extend beyond the board", () => {
    const board = gameboard.create();
    gameboard.placeShip("destroyer", 1, 10, "horizontal");

    expect(gameboard.rotateShip("destroyer")).toBe(false);
    expect(gameboard.getShipPlacements()[0].orientation).toBe("horizontal");
    expect(board[9][0].getToken()).toBe("S");
    expect(board[9][1].getToken()).toBe("S");
  });

  test("restores a ship when rotation violates fleet spacing", () => {
    const board = gameboard.create();
    gameboard.placeShip("cruiser", 3, 3, "horizontal");
    gameboard.placeShip("destroyer", 1, 5, "horizontal");

    expect(gameboard.rotateShip("cruiser")).toBe(false);
    expect(gameboard.getShipPlacements()[0].orientation).toBe("horizontal");
    expect(board[2].slice(2, 5).every((cell) => cell.getToken() === "S")).toBe(
      true,
    );
    expect(board[3][2].getToken()).toBe("O");
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

  test("sends a hit to the ship occupying the attacked coordinates", () => {
    const board = gameboard.create();
    const destroyer = gameboard.placeShip("destroyer", 2, 3, "horizontal");

    expect(gameboard.receiveAttack(2, 3)).toBe(true);
    expect(destroyer.getData().hits).toBe(1);
    expect(board[2][1].getToken()).toBe("X");
  });

  test("sends hits to the correct ship", () => {
    gameboard.create();
    const destroyer = gameboard.placeShip("destroyer", 1, 1, "horizontal");
    const submarine = gameboard.placeShip("submarine", 5, 5, "vertical");

    gameboard.receiveAttack(5, 6);

    expect(destroyer.getData().hits).toBe(0);
    expect(submarine.getData().hits).toBe(1);
  });

  test("records a missed attack and marks its cell", () => {
    const board = gameboard.create();

    expect(gameboard.receiveAttack("C", 4)).toBe(false);
    expect(board[3][2].getToken()).toBe("M");
    expect(gameboard.getMissedAttacks()).toEqual([{ row: 4, column: "C" }]);
  });

  test("does not expose the mutable missed attacks array", () => {
    gameboard.create();
    gameboard.receiveAttack(1, 1);

    gameboard.getMissedAttacks().push({ row: 2, column: "B" });

    expect(gameboard.getMissedAttacks()).toEqual([{ row: 1, column: "A" }]);
  });

  test("rejects repeated attacks without hitting a ship twice", () => {
    const board = gameboard.create();
    const destroyer = gameboard.placeShip("destroyer", 1, 1, "horizontal");
    gameboard.receiveAttack(1, 1);

    expect(gameboard.receiveAttack(1, 1)).toBeNull();
    expect(destroyer.getData().hits).toBe(1);
    expect(board[0][0].getToken()).toBe("X");
  });

  test.each([
    [0, 1],
    [1, 0],
    [11, 1],
    [1, 11],
    ["Z", 1],
  ])("rejects an attack outside the board", (x, y) => {
    const board = gameboard.create();

    expect(gameboard.receiveAttack(x, y)).toBeNull();
    expect(board.flat().every((cell) => cell.getToken() === "O")).toBe(true);
    expect(gameboard.getMissedAttacks()).toEqual([]);
  });

  test("reports false when no ships are placed", () => {
    gameboard.create();

    expect(gameboard.allShipsSunk()).toBe(false);
  });

  test("reports whether all placed ships have sunk", () => {
    gameboard.create();
    gameboard.placeShip("destroyer", 1, 1, "horizontal");
    gameboard.placeShip("submarine", 5, 5, "vertical");

    gameboard.receiveAttack(1, 1);
    gameboard.receiveAttack(2, 1);
    expect(gameboard.allShipsSunk()).toBe(false);

    gameboard.receiveAttack(5, 5);
    gameboard.receiveAttack(5, 6);
    gameboard.receiveAttack(5, 7);
    expect(gameboard.allShipsSunk()).toBe(true);
    expect(gameboard.getShipPlacements().map(({ sunk }) => sunk)).toEqual([
      true,
      true,
    ]);
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
    expect(gameboard.getMissedAttacks()).toEqual([]);
    expect(gameboard.getShipPlacements()).toEqual([]);
    expect(gameboard.allShipsSunk()).toBe(false);
  });
});
