import React, { useState } from "react";
import {
  LayoutDashboard, Route, MousePointer2, Palette,
  Gamepad2, Sparkles, Save, Eye, Send, Plus,
  Trash2, ShieldCheck, Bot, Bell, History
} from "lucide-react";

const modules = [
  "Game Dashboard",
  "Player Management",
  "Character Management",
  "Outfit & Skin Management",
  "Weapon Control",
  "Map Management",
  "Game Mode Management",
  "Room & Match Management",
  "Diamond & Coin Management",
  "Game Shop Management",
  "Event & Mission Management",
  "Rank & Leaderboard Management",
  "Chat & Support Management",
  "Notification Management",
  "Intro & Lobby Management",
  "Game Update Management",
  "Security & Reports Management",
  "Game Settings Management",
  "Emote Management",
  "Animation Management",
  "Diamond Send Management",
  "AI System"
];

const tools = [
  { name: "Entry Control", icon: LayoutDashboard },
  { name: "Routing Control", icon: Route },
  { name: "Button & UI Builder", icon: MousePointer2 },
  { name: "Live Visual Editor", icon: Palette },
  { name: "Game Mode Control", icon: Gamepad2 },
  { name: "AI System", icon: Sparkles }
];

export default function MasterControl() {
  const [active, setActive] = useState("Entry Control");
  const [draft, setDraft] = useState({
    startPage: "Splash",
    loginDestination: "Lobby",
    enabledModes: ["Solo", "Duo", "Squad"],
    buttons: [
      { id: 1, text: "Play", page: "Lobby" },
      { id: 2, text: "Character", page: "Character" }
    ],
    aiEnabled: false,
    aiApproval: true
  });
  const [saved, setSaved] = useState(false);

  function update(key, value) {
    setDraft(old => ({ ...old, [key]: value }));
    setSaved(false);
  }

  function saveDraft() {
    try {
      localStorage.setItem(
        "bd_game_master_draft",
        JSON.stringify(draft)
      );
      setSaved(true);
    } catch {
      alert("Settings could not be saved.");
    }
  }

  function addButton() {
    update("buttons", [
      ...draft.buttons,
      {
        id: Date.now(),
        text: "New Button",
        page: "Lobby"
      }
    ]);
  }

  function updateButton(id, key, value) {
    update("buttons", draft.buttons.map(button =>
      button.id === id
        ? { ...button, [key]: value }
        : button
    ));
  }

  function removeButton(id) {
    update("buttons", draft.buttons.filter(
      button => button.id !== id
    ));
  }

  function toggleMode(mode) {
    const enabled = draft.enabledModes.includes(mode);
    update(
      "enabledModes",
      enabled
        ? draft.enabledModes.filter(item => item !== mode)
        : [...draft.enabledModes, mode]
    );
  }

  return (
    <div className="master-control">
      <header className="master-header">
        <div>
          <h1>BD GAME MASTER CONTROL</h1>
          <p>Admin Control Center</p>
        </div>
        <ShieldCheck size={32} />
      </header>

      <div className="master-layout">
        <aside className="master-sidebar">
          <h3>22 MODULES</h3>
          {modules.map((name, index) => (
            <div className="master-module" key={name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {name}
            </div>
          ))}
        </aside>

        <main className="master-main">
          <h2>Master Control Dashboard</h2>
          <p>Draft settings — these do not change the live game yet.</p>

          <div className="master-tools">
            {tools.map(({ name, icon: Icon }) => (
              <button
                key={name}
                className={active === name ? "selected" : ""}
                onClick={() => setActive(name)}
              >
                <Icon size={19} />
                {name}
              </button>
            ))}
          </div>

          {active === "Entry Control" && (
            <section className="master-panel">
              <h2>Entry Control System</h2>
              <label>Game Start Page</label>
              <select
                value={draft.startPage}
                onChange={e => update("startPage", e.target.value)}
              >
                {["Splash", "Entry", "Login"].map(page =>
                  <option key={page}>{page}</option>
                )}
              </select>

              <label>After Login</label>
              <select
                value={draft.loginDestination}
                onChange={e =>
                  update("loginDestination", e.target.value)
                }
              >
                {["Lobby", "Character", "Maps"].map(page =>
                  <option key={page}>{page}</option>
                )}
              </select>
            </section>
          )}

          {active === "Routing Control" && (
            <section className="master-panel">
              <h2>Routing Control</h2>
              <p>Login Destination: {draft.loginDestination}</p>
              <p>Start Page: {draft.startPage}</p>
              <p>These are draft routes, not live game routes.</p>
            </section>
          )}

          {active === "Button & UI Builder" && (
            <section className="master-panel">
              <h2>Button & UI Builder</h2>
              {draft.buttons.map(button => (
                <div className="master-button-row" key={button.id}>
                  <input
                    value={button.text}
                    onChange={e =>
                      updateButton(button.id, "text", e.target.value)
                    }
                    aria-label="Button text"
                  />
                  <select
                    value={button.page}
                    onChange={e =>
                      updateButton(button.id, "page", e.target.value)
                    }
                  >
                    {["Lobby", "Character", "Maps", "Profile", "Shop"].map(page =>
                      <option key={page}>{page}</option>
                    )}
                  </select>
                  <button onClick={() => removeButton(button.id)}>
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
              <button className="master-action" onClick={addButton}>
                <Plus size={17} /> Add Button
              </button>
            </section>
          )}

          {active === "Live Visual Editor" && (
            <section className="master-panel">
              <h2>Visual Editor Preview</h2>
              <div className="game-preview">
                <h3>BD GAME</h3>
                {draft.buttons.map(button => (
                  <button key={button.id}>{button.text}</button>
                ))}
                <p>Preview only — live game unchanged.</p>
              </div>
            </section>
          )}

          {active === "Game Mode Control" && (
            <section className="master-panel">
              <h2>Game Mode Control</h2>
              {[
                "Solo", "Duo", "Squad", "Battle Royale",
                "Clash Squad", "Ranked", "Classic",
                "Custom Room", "Training", "Tournament"
              ].map(mode => (
                <label className="master-check" key={mode}>
                  <input
                    type="checkbox"
                    checked={draft.enabledModes.includes(mode)}
                    onChange={() => toggleMode(mode)}
                  />
                  {mode}
                </label>
              ))}
            </section>
          )}

          {active === "AI System" && (
            <section className="master-panel">
              <h2><Bot size={23} /> AI System</h2>
              <label className="master-check">
                <input
                  type="checkbox"
                  checked={draft.aiEnabled}
                  onChange={e => update("aiEnabled", e.target.checked)}
                />
                Enable AI System
              </label>
              <label className="master-check">
                <input
                  type="checkbox"
                  checked={draft.aiApproval}
                  onChange={e => update("aiApproval", e.target.checked)}
                />
                Require Admin Approval
              </label>
              <ul>
                <li>AI Game Assistant</li>
                <li>AI Player Support</li>
                <li>AI Report Analysis</li>
                <li>AI Security Monitor</li>
                <li>AI Game Suggestions</li>
                <li>AI Event Creator</li>
                <li>AI Notification Writer</li>
                <li>AI Admin Assistant</li>
                <li>AI Activity History</li>
              </ul>
              <p>AI services require a secure server connection.</p>
            </section>
          )}

          <div className="master-footer">
            <button className="master-action" onClick={saveDraft}>
              <Save size={18} /> Save Draft
            </button>
            <span>{saved ? "Draft saved on this device." : "Unsaved changes"}</span>
          </div>
        </main>
      </div>
    </div>
  );
  }
