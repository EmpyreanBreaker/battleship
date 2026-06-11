import "../../css/index.css";
import { GameUI } from "../dom/game-ui.js";
import { Game } from "../services/game.js";

const game = Game();
const ui = GameUI(document.body);
let computerTurnTimer;

const render = () => {
  ui.render(game.getState());
};

const clearComputerTurn = () => {
  if (!computerTurnTimer) return;

  window.clearTimeout(computerTurnTimer);
  computerTurnTimer = null;
};

const runComputerTurn = () => {
  computerTurnTimer = window.setTimeout(() => {
    game.computerAttack();
    computerTurnTimer = null;
    render();
  }, 450);
};

ui.onPlayerPlacement(({ orientation, shipType, x, y }) => {
  const placed = game.placePlayerShip(shipType, x, y, orientation);

  ui.setPlacementFeedback(placed ? "" : "Position blocked or outside the grid");
  render();
});

ui.onPlacementActions({
  clear: () => {
    game.clearPlayerFleet();
    ui.resetPlacementControls();
    render();
  },
  confirm: () => {
    const confirmed = game.confirmPlacement();

    ui.setPlacementFeedback(confirmed ? "" : "Deploy every ship first");
    if (confirmed) ui.resetPlacementControls();
    render();
  },
  randomize: () => {
    game.randomizePlayerFleet();
    ui.setPlacementFeedback("");
    render();
  },
});

ui.onEnemyAttack((x, y) => {
  const result = game.attackOpponent(x, y);

  if (result === null) return;

  render();

  if (
    game.getState().mode === "computer" &&
    game.getState().activePlayerType === "computer"
  ) {
    runComputerTurn();
  }
});

ui.onEndTurn(() => {
  game.endTurn();
  render();
});

ui.onHandoffContinue(() => {
  game.continueHandoff();

  if (game.getState().phase === "placement") {
    ui.resetPlacementControls();
  }

  render();
});

ui.onModeChange((mode) => {
  if (mode === game.getState().mode) return;

  clearComputerTurn();
  game.start(mode);
  ui.resetPlacementControls();
  render();
});

ui.onRestart(() => {
  clearComputerTurn();
  game.start();
  ui.resetPlacementControls();
  render();
});

render();
