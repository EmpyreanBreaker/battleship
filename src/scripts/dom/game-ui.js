import battleshipSprite from "../../images/ships/battleship.png";
import carrierSprite from "../../images/ships/carrier.png";
import cruiserSprite from "../../images/ships/cruiser.png";
import destroyerSprite from "../../images/ships/destroyer.png";
import submarineSprite from "../../images/ships/submarine.png";

const COLUMNS = "ABCDEFGHIJ";
const SHIPS = [
  { label: "Carrier", length: 5, sprite: carrierSprite, type: "carrier" },
  {
    label: "Battleship",
    length: 4,
    sprite: battleshipSprite,
    type: "battleship",
  },
  { label: "Cruiser", length: 3, sprite: cruiserSprite, type: "cruiser" },
  {
    label: "Submarine",
    length: 3,
    sprite: submarineSprite,
    type: "submarine",
  },
  {
    label: "Destroyer",
    length: 2,
    sprite: destroyerSprite,
    type: "destroyer",
  },
];

const createElement = (tagName, className, text) => {
  const element = document.createElement(tagName);

  if (className) element.className = className;
  if (text) element.textContent = text;

  return element;
};

const createButton = (className, text) => {
  const button = createElement("button", className, text);
  button.type = "button";
  return button;
};

const createBoardShell = (title, boardName) => {
  const section = createElement("section", "board-panel");
  const heading = createElement("h2", "board-title", title);
  const grid = createElement("div", "board-grid");

  grid.dataset.board = boardName;
  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-label", title);
  section.append(heading, grid);

  return { grid, heading, section };
};

const createModeControl = () => {
  const control = createElement("div", "mode-control");
  const computerButton = createButton("mode-option is-active", "Vs computer");
  const localButton = createButton("mode-option", "Two players");

  control.setAttribute("aria-label", "Game mode");
  computerButton.dataset.mode = "computer";
  localButton.dataset.mode = "local";
  control.append(computerButton, localButton);

  return { buttons: [computerButton, localButton], control };
};

const createPlacementControls = () => {
  const panel = createElement("section", "placement-panel");
  const shipSelector = createElement("div", "ship-selector");
  const orientation = createElement("div", "orientation-control");
  const actions = createElement("div", "placement-actions");
  const shipButtons = SHIPS.map(({ label, length, sprite, type }) => {
    const button = createButton("ship-option");
    const image = createElement("img", "ship-option-sprite");
    const copy = createElement(
      "span",
      "ship-option-label",
      `${label} · ${length}`,
    );

    image.src = sprite;
    image.alt = "";
    image.draggable = false;
    button.dataset.ship = type;
    button.draggable = true;
    button.append(image, copy);
    shipSelector.append(button);
    return button;
  });
  const horizontalButton = createButton(
    "orientation-option is-active",
    "Horizontal",
  );
  const verticalButton = createButton("orientation-option", "Vertical");
  const randomizeButton = createButton("secondary-action", "Randomize");
  const clearButton = createButton("secondary-action", "Clear");
  const confirmButton = createButton("confirm-action", "Confirm fleet");

  shipSelector.setAttribute("aria-label", "Ships");
  orientation.setAttribute("aria-label", "Ship orientation");
  horizontalButton.dataset.orientation = "horizontal";
  verticalButton.dataset.orientation = "vertical";

  orientation.append(horizontalButton, verticalButton);
  actions.append(randomizeButton, clearButton, confirmButton);
  panel.append(shipSelector, orientation, actions);

  return {
    actions,
    clearButton,
    confirmButton,
    horizontalButton,
    panel,
    randomizeButton,
    shipButtons,
    verticalButton,
  };
};

const createHandoffPanel = () => {
  const panel = createElement("section", "handoff-panel");
  const title = createElement("h2", "handoff-title");
  const detail = createElement(
    "p",
    "handoff-detail",
    "Keep each fleet private before continuing.",
  );
  const button = createButton("confirm-action handoff-action", "Continue");

  panel.append(title, detail, button);

  return { button, panel, title };
};

const createGameOverPanel = () => {
  const panel = createElement("section", "game-over");
  const eyebrow = createElement("p", "game-over-eyebrow", "Battle complete");
  const title = createElement("h2", "game-over-title");
  const detail = createElement("p", "game-over-detail");
  const button = createButton("confirm-action game-over-action", "Play again");

  panel.append(eyebrow, title, detail, button);

  return { button, detail, panel, title };
};

const getCellLabel = (cell, token, hideShips) => {
  const { row, column } = cell.getIndices();
  const visibleToken = hideShips && token === "S" ? "O" : token;
  const states = {
    M: "miss",
    O: "open water",
    S: "your ship",
    X: "hit",
  };

  return `${column}${row}: ${states[visibleToken]}`;
};

const createShipSprite = (placement) => {
  const ship = SHIPS.find(({ type }) => type === placement.type);

  if (!ship) return null;

  const sprite = createElement(
    "span",
    `ship-sprite ship-${placement.type} is-${placement.orientation}`,
  );
  const image = createElement("img", "ship-sprite-image");
  const start = placement.cells[0];
  const column = COLUMNS.indexOf(start.column) + 1;
  const row = start.row;

  sprite.style.setProperty("--ship-length", String(placement.length));
  sprite.style.gridColumn = `${column} / span ${
    placement.orientation === "horizontal" ? placement.length : 1
  }`;
  sprite.style.gridRow = `${row} / span ${
    placement.orientation === "vertical" ? placement.length : 1
  }`;
  sprite.classList.toggle("is-sunk", placement.sunk);
  sprite.setAttribute("aria-hidden", "true");
  image.src = ship.sprite;
  image.alt = "";
  image.draggable = false;
  sprite.append(image);

  return sprite;
};

const renderBoard = (grid, gameboard, options = {}) => {
  const { disabled = false, hideShips = false, interactive = false } = options;
  const board = gameboard.getBoard();
  const fragment = document.createDocumentFragment();

  const corner = createElement("span", "board-label board-corner");
  corner.setAttribute("aria-hidden", "true");
  fragment.append(corner);

  for (const column of COLUMNS) {
    const label = createElement("span", "board-label", column);
    label.setAttribute("aria-hidden", "true");
    fragment.append(label);
  }

  board.forEach((row, rowIndex) => {
    const rowLabel = createElement("span", "board-label", String(rowIndex + 1));
    rowLabel.setAttribute("aria-hidden", "true");
    fragment.append(rowLabel);

    row.forEach((cell, columnIndex) => {
      const token = cell.getToken();
      const visibleToken = hideShips && token === "S" ? "O" : token;
      const element = createElement(
        interactive ? "button" : "div",
        `board-cell token-${visibleToken.toLowerCase()}`,
      );

      element.dataset.x = String(columnIndex + 1);
      element.dataset.y = String(rowIndex + 1);
      element.dataset.token = visibleToken;
      element.setAttribute("role", "gridcell");
      element.setAttribute("aria-label", getCellLabel(cell, token, hideShips));

      if (interactive) {
        element.type = "button";
        element.disabled = disabled || token === "X" || token === "M";
      }

      if (visibleToken === "X") element.textContent = "×";

      fragment.append(element);
    });
  });

  if (!hideShips) {
    const shipLayer = createElement("div", "ship-layer");

    gameboard.getShipPlacements().forEach((placement) => {
      const sprite = createShipSprite(placement);
      if (sprite) shipLayer.append(sprite);
    });

    fragment.append(shipLayer);
  }

  grid.replaceChildren(fragment);
  grid.classList.toggle("is-disabled", disabled);
  grid.classList.toggle("is-interactive", interactive && !disabled);
};

const getStatus = (state, selectedShip, placementFeedback) => {
  if (state.phase === "placement") {
    if (placementFeedback) {
      return { detail: placementFeedback, title: "Fleet deployment" };
    }

    if (state.remainingShips.length === 0) {
      return {
        detail: "Fleet ready for confirmation",
        title: "Fleet deployed",
      };
    }

    const ship = SHIPS.find(({ type }) => type === selectedShip);
    return {
      detail: `${ship.label} · ${ship.length} cells`,
      title: `${state.currentPlayerLabel} deployment`,
    };
  }

  if (state.phase === "handoff") {
    return {
      detail: "Both fleets are hidden",
      title: `Pass to ${state.handoffPlayerLabel}`,
    };
  }

  if (state.phase === "finished") {
    if (state.mode === "computer") {
      return state.winnerIndex === 0
        ? { detail: "Enemy fleet destroyed", title: "Victory" }
        : { detail: "Your fleet has been destroyed", title: "Defeat" };
    }

    return { detail: "Enemy fleet destroyed", title: `${state.winner} wins` };
  }

  if (state.phase === "turn-result") {
    return {
      detail: "End the turn to continue",
      title: state.lastAttackResult ? "Direct hit" : "Shot missed",
    };
  }

  if (state.activePlayerType === "computer") {
    return { detail: "Enemy targeting in progress", title: "Computer turn" };
  }

  return {
    detail: "Targeting systems ready",
    title:
      state.mode === "local"
        ? `${state.activePlayerLabel}'s turn`
        : "Your turn",
  };
};

const renderPlacementControls = (
  controls,
  remainingShips,
  selectedShip,
  selectedOrientation,
) => {
  controls.shipButtons.forEach((button) => {
    const isRemaining = remainingShips.includes(button.dataset.ship);
    const isSelected = button.dataset.ship === selectedShip;

    button.disabled = !isRemaining;
    button.draggable = isRemaining;
    button.classList.toggle("is-active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  const hasSelection = Boolean(selectedShip);
  controls.horizontalButton.disabled = !hasSelection;
  controls.verticalButton.disabled = !hasSelection;
  controls.horizontalButton.classList.toggle(
    "is-active",
    selectedOrientation === "horizontal",
  );
  controls.verticalButton.classList.toggle(
    "is-active",
    selectedOrientation === "vertical",
  );
  controls.confirmButton.disabled = remainingShips.length > 0;
  controls.clearButton.disabled = remainingShips.length === SHIPS.length;
};

const GameUI = (root) => {
  const app = createElement("main", "game");
  const header = createElement("header", "game-header");
  const brand = createElement("div", "brand");
  const brandMark = createElement("span", "brand-mark", "B");
  const brandName = createElement("h1", "brand-name", "Battleship");
  const headerActions = createElement("div", "header-actions");
  const modeControl = createModeControl();
  const restartButton = createButton("restart-button", "New game");
  const statusBar = createElement("section", "status-bar");
  const statusCopy = createElement("div", "status-copy");
  const statusTitle = createElement("p", "status-title");
  const statusDetail = createElement("p", "status-detail");
  const turnLight = createElement("span", "turn-light");
  const endTurnButton = createButton("turn-action", "End turn");
  const placementControls = createPlacementControls();
  const handoff = createHandoffPanel();
  const gameOver = createGameOverPanel();
  const boards = createElement("div", "boards");
  const playerBoard = createBoardShell("Your fleet", "player");
  const enemyBoard = createBoardShell("Enemy waters", "enemy");
  let latestState;
  let selectedShip = "carrier";
  let selectedOrientation = "horizontal";
  let placementFeedback = "";
  let dropTargets = [];
  let placementValidator = () => true;

  statusBar.setAttribute("aria-live", "polite");
  turnLight.setAttribute("aria-hidden", "true");

  brand.append(brandMark, brandName);
  headerActions.append(modeControl.control, restartButton);
  header.append(brand, headerActions);
  statusCopy.append(statusTitle, statusDetail);
  statusBar.append(turnLight, statusCopy, endTurnButton);
  boards.append(playerBoard.section, enemyBoard.section);
  app.append(
    header,
    statusBar,
    placementControls.panel,
    handoff.panel,
    gameOver.panel,
    boards,
  );
  root.replaceChildren(app);

  const render = (state) => {
    latestState = state;

    if (!state.remainingShips.includes(selectedShip)) {
      selectedShip = state.remainingShips[0] ?? null;
    }

    const isPlacement = state.phase === "placement";
    const isHandoff = state.phase === "handoff";
    const isTurnResult = state.phase === "turn-result";
    const isFinished = state.phase === "finished";
    const isEnemyBoardDisabled =
      state.phase !== "battle" || state.activePlayerType !== "real";
    const status = getStatus(state, selectedShip, placementFeedback);
    const turnState = isPlacement
      ? "placement"
      : state.phase === "battle"
        ? state.activePlayerType
        : state.phase;

    statusTitle.textContent = status.title;
    statusDetail.textContent = status.detail;
    turnLight.className = `turn-light turn-${turnState}`;
    statusBar.hidden = isFinished;
    placementControls.panel.hidden = !isPlacement;
    handoff.panel.hidden = !isHandoff;
    gameOver.panel.hidden = !isFinished;
    handoff.title.textContent = state.handoffPlayerLabel
      ? `Pass to ${state.handoffPlayerLabel}`
      : "";
    endTurnButton.hidden = !isTurnResult;
    boards.hidden = isHandoff;
    enemyBoard.section.hidden = isPlacement;
    playerBoard.heading.textContent = isPlacement
      ? `${state.currentPlayerLabel}: deploy your fleet`
      : state.mode === "computer"
        ? "Your fleet"
        : `${state.currentPlayerLabel} fleet`;
    enemyBoard.heading.textContent =
      state.mode === "computer"
        ? "Enemy waters"
        : `${state.opponentPlayerLabel} waters`;
    boards.classList.toggle("is-placement", isPlacement);
    boards.classList.toggle("is-game-over", isFinished);

    if (isFinished) {
      gameOver.title.textContent =
        state.mode === "computer"
          ? state.winnerIndex === 0
            ? "Victory"
            : "Defeat"
          : `${state.winner} wins`;
      gameOver.detail.textContent =
        state.winnerIndex === state.currentPlayerIndex
          ? "The opposing fleet has been destroyed."
          : `${state.winner} destroyed the opposing fleet.`;
    }

    modeControl.buttons.forEach((button) => {
      const isActive = button.dataset.mode === state.mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (isPlacement) {
      renderPlacementControls(
        placementControls,
        state.remainingShips,
        selectedShip,
        selectedOrientation,
      );
    }

    if (isHandoff) {
      playerBoard.grid.replaceChildren();
      enemyBoard.grid.replaceChildren();
    } else {
      renderBoard(playerBoard.grid, state.currentPlayer.getGameboard(), {
        interactive: isPlacement && Boolean(selectedShip),
      });
      renderBoard(enemyBoard.grid, state.opponentPlayer.getGameboard(), {
        disabled: isEnemyBoardDisabled,
        hideShips: state.phase !== "finished",
        interactive: !isPlacement,
      });
    }
  };

  const setPlacementFeedback = (message = "") => {
    placementFeedback = message;
  };

  const resetPlacementControls = () => {
    selectedShip = "carrier";
    selectedOrientation = "horizontal";
    placementFeedback = "";
  };

  const clearDropTarget = () => {
    dropTargets.forEach((cell) => cell.classList.remove("is-drop-target"));
    dropTargets = [];
    playerBoard.grid.classList.remove(
      "is-drop-active",
      "is-drop-invalid",
      "is-drop-valid",
    );
  };

  const showDropTarget = (cell) => {
    clearDropTarget();

    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);
    const ship = SHIPS.find(({ type }) => type === selectedShip);

    if (!ship) return;

    dropTargets = Array.from({ length: ship.length }, (_, index) => {
      const cellX = selectedOrientation === "horizontal" ? x + index : x;
      const cellY = selectedOrientation === "vertical" ? y + index : y;

      return playerBoard.grid.querySelector(
        `.board-cell[data-x="${cellX}"][data-y="${cellY}"]`,
      );
    }).filter(Boolean);

    dropTargets.forEach((target) => target.classList.add("is-drop-target"));
    const isValid = placementValidator({
      orientation: selectedOrientation,
      shipType: selectedShip,
      x,
      y,
    });

    playerBoard.grid.classList.add(
      "is-drop-active",
      isValid ? "is-drop-valid" : "is-drop-invalid",
    );
  };

  placementControls.shipButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedShip = button.dataset.ship;
      placementFeedback = "";
      render(latestState);
    });

    button.addEventListener("dragstart", (event) => {
      if (button.disabled) {
        event.preventDefault();
        return;
      }

      selectedShip = button.dataset.ship;
      placementFeedback = "";
      button.classList.add("is-dragging");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", selectedShip);
      }
      render(latestState);
    });

    button.addEventListener("dragend", () => {
      button.classList.remove("is-dragging");
      clearDropTarget();
    });
  });

  [
    placementControls.horizontalButton,
    placementControls.verticalButton,
  ].forEach((button) => {
    button.addEventListener("click", () => {
      selectedOrientation = button.dataset.orientation;
      placementFeedback = "";
      render(latestState);
    });
  });

  const onPlayerPlacement = (handler) => {
    playerBoard.grid.addEventListener("click", (event) => {
      const cell = event.target.closest(".board-cell");

      if (!cell || cell.disabled || !selectedShip) return;

      handler({
        orientation: selectedOrientation,
        shipType: selectedShip,
        x: Number(cell.dataset.x),
        y: Number(cell.dataset.y),
      });
    });

    playerBoard.grid.addEventListener("dragover", (event) => {
      const cell = event.target.closest(".board-cell");

      if (latestState?.phase !== "placement" || !cell || !selectedShip) {
        return;
      }

      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      showDropTarget(cell);
    });

    playerBoard.grid.addEventListener("dragleave", (event) => {
      if (!playerBoard.grid.contains(event.relatedTarget)) {
        clearDropTarget();
      }
    });

    playerBoard.grid.addEventListener("drop", (event) => {
      const cell = event.target.closest(".board-cell");
      const shipType =
        event.dataTransfer?.getData("text/plain") || selectedShip;

      if (latestState?.phase !== "placement" || !cell || !shipType) return;

      event.preventDefault();
      selectedShip = shipType;
      clearDropTarget();
      handler({
        orientation: selectedOrientation,
        shipType,
        x: Number(cell.dataset.x),
        y: Number(cell.dataset.y),
      });
    });
  };

  const onEnemyAttack = (handler) => {
    enemyBoard.grid.addEventListener("click", (event) => {
      const cell = event.target.closest(".board-cell");

      if (!cell || cell.disabled) return;

      handler(Number(cell.dataset.x), Number(cell.dataset.y));
    });
  };

  const onPlacementActions = ({ clear, confirm, randomize }) => {
    placementControls.clearButton.addEventListener("click", clear);
    placementControls.confirmButton.addEventListener("click", confirm);
    placementControls.randomizeButton.addEventListener("click", randomize);
  };

  const setPlacementValidator = (handler) => {
    placementValidator = handler;
  };

  const onModeChange = (handler) => {
    modeControl.buttons.forEach((button) => {
      button.addEventListener("click", () => handler(button.dataset.mode));
    });
  };

  const onHandoffContinue = (handler) => {
    handoff.button.addEventListener("click", handler);
  };

  const onEndTurn = (handler) => {
    endTurnButton.addEventListener("click", handler);
  };

  const onRestart = (handler) => {
    restartButton.addEventListener("click", handler);
    gameOver.button.addEventListener("click", handler);
  };

  return {
    onEndTurn,
    onEnemyAttack,
    onHandoffContinue,
    onModeChange,
    onPlacementActions,
    onPlayerPlacement,
    onRestart,
    render,
    resetPlacementControls,
    setPlacementFeedback,
    setPlacementValidator,
  };
};

export { GameUI };
