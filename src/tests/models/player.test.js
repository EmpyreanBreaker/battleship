import { Player } from "../../scripts/models/player";

describe("Player", () => {
  test.each(["real", "computer"])("creates a %s player", (type) => {
    const player = Player(type);

    expect(player.getType()).toBe(type);
  });

  test("normalizes the player type", () => {
    const player = Player("COMPUTER");

    expect(player.getType()).toBe("computer");
  });

  test.each(["human", "", null, undefined])(
    "rejects an invalid player type",
    (type) => {
      expect(Player(type)).toBeNull();
    },
  );

  test("creates a gameboard for the player", () => {
    const player = Player("real");
    const board = player.getGameboard().getBoard();

    expect(board).toHaveLength(10);
    board.forEach((row) => expect(row).toHaveLength(10));
  });

  test("gives each player an independent gameboard", () => {
    const realPlayer = Player("real");
    const computerPlayer = Player("computer");
    const realBoard = realPlayer.getGameboard();
    const computerBoard = computerPlayer.getGameboard();

    realBoard.placeShip("destroyer", 1, 1, "horizontal");

    expect(realBoard).not.toBe(computerBoard);
    expect(realBoard.getBoard()[0][0].getToken()).toBe("S");
    expect(computerBoard.getBoard()[0][0].getToken()).toBe("O");
  });
});
