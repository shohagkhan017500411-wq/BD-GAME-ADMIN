
import React, { useState } from "react";
import {
  LayoutDashboard, Route, MousePointer2, Palette,
  Gamepad2, Sparkles, Save, Eye, Plus, Trash2,
  ShieldCheck, Bot, Bell, History, Users,
  MessageCircle, Shield, WandSparkles, Settings,
  ChevronRight
} from "lucide-react";

const tools = [
  { name: "Entry Control", icon: LayoutDashboard },
  { name: "Routing Control", icon: Route },
  { name: "Button & UI Builder", icon: MousePointer2 },
  { name: "Visual Editor", icon: Palette },
  { name: "Game Mode Control", icon: Gamepad2 },
  { name: "AI System", icon: Sparkles }
];

const modes = [
  "Solo", "Duo", "Squad", "Battle Royale",
  "Clash Squad", "Ranked", "Classic",
  "Custom Room", "Training", "Tournament"
];

const aiServices = [
  { name: "AI Game Assistant", detail: "গেম পরিচালনা ও সাধারণ সহায়তা" },
  { name: "AI Player Support", detail: "Player-এর প্রশ্ন ও সহায়তা" },
  { name: "AI Report Analysis", detail: "Player report বিশ্লেষণ" },
  { name: "AI Security Monitor", detail: "নিরাপত্তা সংক্রান্ত সতর্কতা" },
  { name: "AI Game Suggestions", detail: "গেম উন্নয়নের পরামর্শ" },
  { name: "AI Event Creator", detail: "নতুন Event-এর খসড়া তৈরি" },
  { name: "AI Notification Writer", detail: "Notification-এর লেখা তৈরি" },
  { name: "AI Admin Assistant", detail: "Admin কাজের সহায়তা" },
  { name: "AI Activity History", detail: "AI কার্যক্রমের খসড়া ইতিহাস" }
];

const defaultDraft = {
  startPage: "Splash",
  loginDestination: "Lobby",
  enabledModes: ["Solo", "Duo", "Squad"],
  buttons: [
    { id: 1, text: "Play", page: "Lobby" },
    { id: 2, text: "Character", page: "Character" },
    { id: 3, text: "Shop", page: "Shop" }
  ],
  aiEnabled: false,
  aiApproval: true,
  services: aiServices.map(item => ({
    name: item.name,
    enabled: false
  }))
};

export default function MasterControl() {
  const [active, setActive] = useState("Entry Control");
  const [draft, setDraft] = useState(() => {
    try {
      const saved = localStorage.getItem("bd_game_master_draft");
      return saved ? { ...defaultDraft, ...JSON.parse(saved) } : defaultDraft;
    } catch {
      return defaultDraft;
    }
  });
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);

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
      alert("Settings এই ডিভাইসে সংরক্ষণ করা যায়নি।");
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
    update(
      "buttons",
      draft.buttons.map(button =>
        button.id === id
          ? { ...button, [key]: value }
          : button
      )
    );
  }

  function removeButton(id) {
    update(
      "buttons",
      draft.buttons.filter(button => button.id !== id)
    );
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

  function toggleService(name) {
    update(
      "services",
      draft.services.map(service =>
        service.name === name
          ? { ...service, enabled: !service.enabled }
          : service
      )
    );
  }

  const activeTool = tools.find(tool => tool.name === active);

  return (
    <div className="master-control">
      <header className="master-header">
        <div>
          <span className="master-kicker">BD GAME ADMINISTRATION</span>
          <h1>MASTER CONTROL</h1>
          <p>Game configuration workspace</p>
        </div>
        <div className="master-header-icon">
          <ShieldCheck size={34} />
        </div>
      </header>

      <div className="master-notice">
        <Shield size={19} />
        <div>
          <b>Draft Control Mode</b>
          <p>
            এখানে পরিবর্তনগুলো আগে খসড়া হিসেবে সংরক্ষণ হবে।
            Player Game-এর live settings এখনো এই প্যানেলের সঙ্গে যুক্ত নয়।
          </p>
        </div>
      </div>

      <div className="master-tool-grid">
        {tools.map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={`master-tool ${active === name ? "active" : ""}`}
            onClick={() => setActive(name)}
          >
            <Icon size={21} />
            <span>{name}</span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>

      <main className="master-main">
        <div className="master-section-heading">
          <div>
            <span className="master-kicker">CONTROL MODULE</span>
            <h2>{activeTool?.name || active}</h2>
          </div>
          {activeTool && <activeTool.icon size={28} />}
        </div>

        {active === "Entry Control" && (
          <section className="master-panel">
            <h3>Entry Control System</h3>
            <p>গেম চালু হলে কোন পেজ আগে দেখাবে তা নির্বাচন করুন।</p>

            <label>Game Start Page</label>
            <select
              value={draft.startPage}
              onChange={e => update("startPage", e.target.value)}
            >
              {["Splash", "Entry", "Login"].map(page => (
                <option key={page} value={page}>{page}</option>
              ))}
            </select>

            <label>After Login</label>
            <select
              value={draft.loginDestination}
              onChange={e => update("loginDestination", e.target.value)}
            >
              {["Lobby", "Character", "Maps", "Profile"].map(page => (
                <option key={page} value={page}>{page}</option>
              ))}
            </select>

            <div className="master-info">
              <Eye size={18} />
              <span>
                Preview: {draft.startPage} → Login → {draft.loginDestination}
              </span>
            </div>
          </section>
        )}

        {active === "Routing Control" && (
          <section className="master-panel">
            <h3>Routing Control</h3>
            <p>প্রস্তাবিত navigation route-এর খসড়া।</p>

            <div className="route-row">
              <span>Game Start</span>
              <b>{draft.startPage}</b>
            </div>
            <div className="route-row">
              <span>Login Success</span>
              <b>{draft.loginDestination}</b>
            </div>
            <div className="route-row">
              <span>Available Buttons</span>
              <b>{draft.buttons.length}</b>
            </div>

            <p className="muted">
              Live routing চালু করতে Player Game-এর routing code-এ
              এই settings সংযোগ করতে হবে।
            </p>
          </section>
        )}

        {active === "Button & UI Builder" && (
          <section className="master-panel">
            <h3>Button & UI Builder</h3>
            <p>নিজের পছন্দমতো Button-এর নাম ও destination নির্ধারণ করুন।</p>

            {draft.buttons.map(button => (
              <div className="master-button-row" key={button.id}>
                <input
                  value={button.text}
                  onChange={e =>
                    updateButton(button.id, "text", e.target.value)
                  }
                  placeholder="Button name"
                  aria-label="Button name"
                />

                <select
                  value={button.page}
                  onChange={e =>
                    updateButton(button.id, "page", e.target.value)
                  }
                >
                  {[
                    "Lobby", "Character", "Maps",
                    "Profile", "Shop", "Settings"
                  ].map(page => (
                    <option key={page} value={page}>{page}</option>
                  ))}
                </select>

                <button
                  className="master-delete"
                  onClick={() => removeButton(button.id)}
                  title="Remove button"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}

            <button className="master-action" onClick={addButton}>
              <Plus size={18} /> Add New Button
            </button>
          </section>
        )}

        {active === "Visual Editor" && (
          <section className="master-panel">
            <div className="master-panel-title">
              <div>
                <h3>Visual Editor Preview</h3>
                <p>তোমার Button layout-এর preview দেখো।</p>
              </div>
              <button
                className="master-action secondary"
                onClick={() => setPreview(!preview)}
              >
                <Eye size={17} />
                {preview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>

            {preview && (
              <div className="game-preview">
                <div className="game-preview-logo">BD GAME</div>
                <div className="game-preview-subtitle">BATTLE ARENA</div>
                <div className="game-preview-buttons">
                  {draft.buttons.map(button => (
                    <button key={button.id}>
                      {button.text}
                    </button>
                  ))}
                </div>
                <small>DESIGN PREVIEW ONLY</small>
              </div>
            )}

            {!preview && (
              <div className="master-empty">
                <Palette size={30} />
                <span>Show Preview চাপলে Button Preview দেখা যাবে।</span>
              </div>
            )}
          </section>
        )}

        {active === "Game Mode Control" && (
          <section className="master-panel">
            <h3>Game Mode Control</h3>
            <p>যেসব Game Mode রাখতে চাও সেগুলো নির্বাচন করো।</p>

            <div className="master-mode-grid">
              {modes.map(mode => (
                <label className="master-check" key={mode}>
                  <input
                    type="checkbox"
                    checked={draft.enabledModes.includes(mode)}
                    onChange={() => toggleMode(mode)}
                  />
                  <span>{mode}</span>
                </label>
              ))}
            </div>

            <div className="master-info">
              <Gamepad2 size={18} />
              <span>
                নির্বাচিত Mode: {draft.enabledModes.length}
              </span>
            </div>
          </section>
        )}

        {active === "AI System" && (
          <section className="master-panel">
            <div className="ai-title">
              <div className="ai-icon"><Bot size={28} /></div>
              <div>
                <h3>BD GAME AI SYSTEM</h3>
                <p>AI assistant configuration</p>
              </div>
            </div>

            <label className="master-check master-check-large">
              <input
                type="checkbox"
                checked={draft.aiEnabled}
                onChange={e => update("aiEnabled", e.target.checked)}
              />
              <span>
                <b>Enable AI System</b>
                <small>AI feature configuration চালু রাখুন</small>
              </span>
            </label>

            <label className="master-check master-check-large">
              <input
                type="checkbox"
                checked={draft.aiApproval}
                onChange={e => update("aiApproval", e.target.checked)}
              />
              <span>
                <b>Require Admin Approval</b>
                <small>AI-এর প্রস্তাব কার্যকর করার আগে Admin অনুমোদন লাগবে</small>
              </span>
            </label>

            <h3 className="ai-services-title">AI Services</h3>

            <div className="ai-service-list">
              {aiServices.map(service => {
                const current = draft.services.find(
                  item => item.name === service.name
                );

                return (
                  <div className="ai-service" key={service.name}>
                    <div className="ai-service-icon">
                      {service.name.includes("Player")
                        ? <Users size={19} />
                        : service.name.includes("Report") ||
                          service.name.includes("Security")
                          ? <ShieldCheck size={19} />
                          : service.name.includes("Notification")
                            ? <Bell size={19} />
                            : service.name.includes("Activity")
                              ? <History size={19} />
                              : service.name.includes("Support")
                                ? <MessageCircle size={19} />
                                : <WandSparkles size={19} />}
                    </div>

                    <div className="ai-service-copy">
                      <b>{service.name}</b>
                      <small>{service.detail}</small>
                    </div>

                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(current?.enabled)}
                        onChange={() => toggleService(service.name)}
                      />
                      <span />
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="master-warning">
              AI service চালাতে নিরাপদ server-side AI connection,
              permissions এবং database integration লাগবে।
              এই checkbox-গুলো এখন শুধু draft preference সংরক্ষণ করে।
            </div>
          </section>
        )}

        <div className="master-footer">
          <button className="master-action save-button" onClick={saveDraft}>
            <Save size={18} /> Save Draft
          </button>
          <span className={saved ? "saved-label" : "unsaved-label"}>
            {saved
              ? "Draft এই ডিভাইসে সংরক্ষিত হয়েছে।"
              : "পরিবর্তন এখনো সংরক্ষণ করা হয়নি"}
          </span>
        </div>

        <div className="master-bottom-note">
          <Settings size={16} />
          <span>
            Saved draft এই Admin device-এর browser storage-এ থাকে।
            এটি Player Game-এ live update পাঠায় না।
          </span>
        </div>
      </main>
    </div>
  );
}
