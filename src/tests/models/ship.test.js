import { Ship } from "../../scripts/models/ship";

describe("ship", () => {
  test("creates a ship with the given length and zero hits", () => {
    const patrolBoat = Ship(2);

    expect(patrolBoat.getData()).toEqual({ length: 2, hits: 0 });
  });

  test("records hits when hit is called", () => {
    const destroyer = Ship(3);

    destroyer.hit();
    destroyer.hit();

    expect(destroyer.getData().hits).toBe(2);
  });

  test("is not sunk before its hits match its length", () => {
    const submarine = Ship(3);

    submarine.hit();
    submarine.hit();

    expect(submarine.isSunk()).toBe(false);
  });

  test("is sunk when its hits match its length", () => {
    const patrolBoat = Ship(2);

    patrolBoat.hit();
    patrolBoat.hit();

    expect(patrolBoat.isSunk()).toBe(true);
  });
});
