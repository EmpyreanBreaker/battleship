const COLUMNS = "ABCDEFGHIJ";
const SHIPS = [
  { label: "Carrier", length: 5, type: "carrier" },
  { label: "Battleship", length: 4, type: "battleship" },
  { label: "Cruiser", length: 3, type: "cruiser" },
  { label: "Submarine", length: 3, type: "submarine" },
  { label: "Destroyer", length: 2, type: "destroyer" },
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

const createPlacementControls = () => {
  const panel = createElement("section", "placement-panel");
  const shipSelector = createElement("div", "ship-selector");
  const orientation = createElement("div", "orientation-control");
  const actions = createElement("div", "placement-actions");
  const shipButtons = SHIPS.map(({ label, length, type }) => {
    const button = createButton("ship-option", `${label} · ${length}`);
    button.dataset.ship = type;
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
      title: "Fleet deployment",
    };
  }

  if (state.winner === "real") {
    return { detail: "Enemy fleet destroyed", title: "Victory" };
  }

  if (state.winner === "computer") {
    return { detail: "Your fleet has been destroyed", title: "Defeat" };
  }

  if (state.turn === "computer") {
    return { detail: "Enemy targeting in progress", title: "Computer turn" };
  }

  return { detail: "Targeting systems ready", title: "Your turn" };
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
  const restartButton = createButton("restart-button", "New game");
  const statusBar = createElement("section", "status-bar");
  const statusCopy = createElement("div", "status-copy");
  const statusTitle = createElement("p", "status-title");
  const statusDetail = createElement("p", "status-detail");
  const turnLight = createElement("span", "turn-light");
  const placementControls = createPlacementControls();
  const boards = createElement("div", "boards");
  const playerBoard = createBoardShell("Your fleet", "player");
  const enemyBoard = createBoardShell("Enemy waters", "enemy");
  let latestState;
  let selectedShip = "carrier";
  let selectedOrientation = "horizontal";
  let placementFeedback = "";

  statusBar.setAttribute("aria-live", "polite");
  turnLight.setAttribute("aria-hidden", "true");

  brand.append(brandMark, brandName);
  header.append(brand, restartButton);
  statusCopy.append(statusTitle, statusDetail);
  statusBar.append(turnLight, statusCopy);
  boards.append(playerBoard.section, enemyBoard.section);
  app.append(header, statusBar, placementControls.panel, boards);
  root.replaceChildren(app);

  const render = (state) => {
    latestState = state;

    if (!state.remainingShips.includes(selectedShip)) {
      selectedShip = state.remainingShips[0] ?? null;
    }

    const isPlacement = state.phase === "placement";
    const isEnemyBoardDisabled =
      isPlacement || state.turn !== "real" || Boolean(state.winner);
    const status = getStatus(state, selectedShip, placementFeedback);
    const turnState = isPlacement ? "placement" : state.winner || state.turn;

    statusTitle.textContent = status.title;
    statusDetail.textContent = status.detail;
    turnLight.className = `turn-light turn-${turnState}`;
    placementControls.panel.hidden = !isPlacement;
    enemyBoard.section.hidden = isPlacement;
    playerBoard.heading.textContent = isPlacement
      ? "Deploy your fleet"
      : "Your fleet";
    boards.classList.toggle("is-placement", isPlacement);

    if (isPlacement) {
      renderPlacementControls(
        placementControls,
        state.remainingShips,
        selectedShip,
        selectedOrientation,
      );
    }

    renderBoard(playerBoard.grid, state.realPlayer.getGameboard(), {
      interactive: isPlacement && Boolean(selectedShip),
    });
    renderBoard(enemyBoard.grid, state.computerPlayer.getGameboard(), {
      disabled: isEnemyBoardDisabled,
      hideShips: !state.winner,
      interactive: true,
    });
  };

  const setPlacementFeedback = (message = "") => {
    placementFeedback = message;
  };

  const resetPlacementControls = () => {
    selectedShip = "carrier";
    selectedOrientation = "horizontal";
    placementFeedback = "";
  };

  placementControls.shipButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedShip = button.dataset.ship;
      placementFeedback = "";
      render(latestState);
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

  const onRestart = (handler) => {
    restartButton.addEventListener("click", handler);
  };

  return {
    onEnemyAttack,
    onPlacementActions,
    onPlayerPlacement,
    onRestart,
    render,
    resetPlacementControls,
    setPlacementFeedback,
  };
};

export { GameUI };
