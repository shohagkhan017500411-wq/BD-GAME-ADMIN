
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kvloogdidadztnpgcvqu.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const OWNER_ID = "abae9dc5-08d4-4f34-8cbb-c350f9e5736f";

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

const defaultSettings = {
  entry: {
    startPage: "Login",
    splash: true,
    login: true,
    afterLogin: "Lobby"
  },
  routing: {
    home: "Lobby",
    shop: "Shop",
    profile: "Profile"
  },
  buttons: [],
  visual: {
    theme: "Blue Yellow",
    background: "Island",
    animations: true
  },
  gameMode: {
    solo: true,
    duo: true,
    squad: true,
    custom: true
  },
  ai: {
    enabled: true,
    assistant: false
  }
};

const modules = [
  { id: "entry", name: "Entry Control" },
  { id: "routing", name: "Routing Control" },
  { id: "buttons", name: "Button & UI Builder" },
  { id: "visual", name: "Visual Editor" },
  { id: "gameMode", name: "Game Mode Control" },
  { id: "ai", name: "AI System" }
];

export default function MasterControl() {
  const [draft, setDraft] = useState(defaultSettings);
  const [active, setActive] = useState("entry");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cloudStatus, setCloudStatus] = useState(
    "Checking cloud connection..."
  );
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        if (!SUPABASE_ANON_KEY) {
          throw new Error("Supabase environment key পাওয়া যায়নি।");
        }

        const { data: sessionData, error: sessionError } =
          await db.auth.getSession();

        if (sessionError) throw sessionError;

        const session = sessionData?.session;

        if (!session || session.user.id !== OWNER_ID) {
          throw new Error("Owner Admin session পাওয়া যায়নি।");
        }

        const { data: adminCheck, error: adminError } =
          await db.rpc("is_admin");

        if (adminError) throw adminError;

        if (adminCheck !== true) {
          throw new Error("Admin permission যাচাই করা যায়নি।");
        }

        const { data, error: readError } = await db
          .from("game_admin_settings")
          .select("settings")
          .eq("id", "global")
          .maybeSingle();

        if (readError) throw readError;

        if (!mounted) return;

        if (data?.settings) {
          const saved = data.settings;

          setDraft({
            ...defaultSettings,
            ...saved,
            entry: {
              ...defaultSettings.entry,
              ...saved.entry
            },
            routing: {
              ...defaultSettings.routing,
              ...saved.routing
            },
            visual: {
              ...defaultSettings.visual,
              ...saved.visual
            },
            gameMode: {
              ...defaultSettings.gameMode,
              ...saved.gameMode
            },
            ai: {
              ...defaultSettings.ai,
              ...saved.ai
            },
            buttons: Array.isArray(saved.buttons)
              ? saved.buttons
              : []
          });
        }

        setCloudStatus("Cloud Connected");
      } catch (err) {
        if (mounted) {
          setCloudStatus("Cloud Not Connected");
          setError(err.message || "Settings load failed");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  function updateSection(section, key, value) {
    setDraft(previous => ({
      ...previous,
      [section]: {
        ...previous[section],
        [key]: value
      }
    }));
  }

  async function verifyOwner() {
    const { data: sessionData, error: sessionError } =
      await db.auth.getSession();

    if (sessionError) throw sessionError;

    const session = sessionData?.session;

    if (!session || session.user.id !== OWNER_ID) {
      throw new Error("Owner Admin session পাওয়া যায়নি।");
    }

    const { data: adminCheck, error: adminError } =
      await db.rpc("is_admin");

    if (adminError) throw adminError;

    if (adminCheck !== true) {
      throw new Error("Admin permission নেই।");
    }

    return session;
  }

  // একই বাটনে Admin Save এবং Player Game Update
  async function saveDraft() {
    setSaving(true);
    setError("");
    setCloudStatus("Saving Admin and Player settings...");

    try {
      const session = await verifyOwner();

      // Private Admin settings
      const { error: adminSaveError } = await db
        .from("game_admin_settings")
        .upsert(
          {
            id: "global",
            settings: draft,
            updated_by: session.user.id,
            updated_at: new Date().toISOString()
          },
          { onConflict: "id" }
        );

      if (adminSaveError) throw adminSaveError;

      // Public Player Game settings
      // AI-এর ব্যক্তিগত Admin settings প্রকাশ করা হবে না।
      const publicSettings = {
        entry: draft.entry,
        routing: draft.routing,
        buttons: draft.buttons,
        visual: draft.visual,
        gameMode: draft.gameMode
      };

      const { error: liveSaveError } = await db
        .from("game_live_settings")
        .upsert(
          {
            id: "global",
            settings: publicSettings,
            published_by: session.user.id,
            published_at: new Date().toISOString()
          },
          { onConflict: "id" }
        );

      if (liveSaveError) throw liveSaveError;

      try {
        localStorage.setItem(
          "bd_game_master_draft",
          JSON.stringify(draft)
        );
      } catch (storageError) {
        console.warn("Local save unavailable:", storageError);
      }

      setCloudStatus("Admin Saved · Player Settings Published");

      alert(
        "সফল হয়েছে! Admin ও Player Game settings Cloud-এ সেভ হয়েছে।"
      );

    } catch (err) {
      setCloudStatus("Cloud Save Failed");
      setError(err.message || "Save failed");

      alert("Save হয়নি: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  function renderModule() {
    switch (active) {
      case "entry":
        return (
          <>
            <h2>Entry Control System</h2>
            <p>Game start page control</p>

            <label>Game Start Page</label>
            <select
              value={draft.entry.startPage}
              onChange={e =>
                updateSection("entry", "startPage", e.target.value)
              }
            >
              {[
                "Splash",
                "Entry",
                "Login",
                "After Login",
                "Lobby",
                "Character",
                "Maps",
                "Profile"
              ].map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <label>After Login Page</label>
            <select
              value={draft.entry.afterLogin}
              onChange={e =>
                updateSection("entry", "afterLogin", e.target.value)
              }
            >
              {["Lobby", "Character", "Maps", "Profile"].map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <label>
              <input
                type="checkbox"
                checked={draft.entry.splash}
                onChange={e =>
                  updateSection("entry", "splash", e.target.checked)
                }
              />
              Enable Splash Screen
            </label>

            <label>
              <input
                type="checkbox"
                checked={draft.entry.login}
                onChange={e =>
                  updateSection("entry", "login", e.target.checked)
                }
              />
              Enable Login
            </label>

            <p>
              Preview: Entry → {draft.entry.startPage} →{" "}
              {draft.entry.afterLogin}
            </p>
          </>
        );

      case "routing":
        return (
          <>
            <h2>Routing Control</h2>

            {Object.entries(draft.routing).map(([key, value]) => (
              <label key={key}>
                {key.toUpperCase()}
                <input
                  value={value}
                  onChange={e =>
                    updateSection("routing", key, e.target.value)
                  }
                />
              </label>
            ))}
          </>
        );

      case "buttons":
        return (
          <>
            <h2>Button & UI Builder</h2>
            <p>প্রতি লাইনে একটি Button Label লিখবে।</p>

            <textarea
              rows="7"
              value={draft.buttons.join("\n")}
              onChange={e =>
                setDraft(previous => ({
                  ...previous,
                  buttons: e.target.value
                    .split("\n")
                    .map(item => item.trim())
                    .filter(Boolean)
                }))
              }
              placeholder={"Shop\nCharacter\nProfile\nSettings"}
            />
          </>
        );

      case "visual":
        return (
          <>
            <h2>Visual Editor</h2>

            <label>Theme</label>
            <select
              value={draft.visual.theme}
              onChange={e =>
                updateSection("visual", "theme", e.target.value)
              }
            >
              <option>Blue Yellow</option>
              <option>Dark</option>
              <option>Light</option>
            </select>

            <label>Background</label>
            <select
              value={draft.visual.background}
              onChange={e =>
                updateSection("visual", "background", e.target.value)
              }
            >
              <option>Island</option>
              <option>Forest</option>
              <option>City</option>
            </select>

            <label>
              <input
                type="checkbox"
                checked={draft.visual.animations}
                onChange={e =>
                  updateSection(
                    "visual",
                    "animations",
                    e.target.checked
                  )
                }
              />
              Enable Animations
            </label>
          </>
        );

      case "gameMode":
        return (
          <>
            <h2>Game Mode Control</h2>

            {Object.entries(draft.gameMode).map(([key, value]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={e =>
                    updateSection("gameMode", key, e.target.checked)
                  }
                />
                {key.toUpperCase()}
              </label>
            ))}
          </>
        );

      case "ai":
        return (
          <>
            <h2>AI System</h2>

            <label>
              <input
                type="checkbox"
                checked={draft.ai.enabled}
                onChange={e =>
                  updateSection("ai", "enabled", e.target.checked)
                }
              />
              Enable AI System
            </label>

            <label>
              <input
                type="checkbox"
                checked={draft.ai.assistant}
                onChange={e =>
                  updateSection("ai", "assistant", e.target.checked)
                }
              />
              Enable AI Assistant
            </label>
          </>
        );

      default:
        return <p>Select a control module.</p>;
    }
  }

  return (
    <div className="master-control">
      <style>{`
        .master-control {
          color: #eaf1ff;
          background: #101a30;
          padding: 18px;
          border-radius: 14px;
          font-family: Arial, sans-serif;
        }

        .master-control h1 {
          color: #ffd447;
        }

        .master-control h2 {
          color: #70b9ff;
        }

        .master-control button,
        .master-control select,
        .master-control input:not([type="checkbox"]),
        .master-control textarea {
          padding: 11px;
          margin: 7px 0;
          border-radius: 8px;
          border: 1px solid #496080;
          background: #172844;
          color: white;
          max-width: 100%;
        }

        .master-control label {
          display: block;
          margin: 12px 0;
        }

        .master-control button {
          cursor: pointer;
          background: #1766c2;
          border: 0;
          font-weight: bold;
        }

        .master-control button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .master-control .tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin: 16px 0;
        }

        .master-control .tabs button {
          background: #263b5d;
        }

        .master-control .tabs button.active {
          background: #d7a900;
          color: #101a30;
        }

        .master-control .status {
          padding: 10px;
          background: #1d304c;
          border-radius: 8px;
          margin: 12px 0;
        }

        .master-control .error {
          color: #ffaaaa;
        }
      `}</style>

      <h1>MASTER CONTROL</h1>
      <p>Game configuration workspace</p>

      <div className="status">
        <strong>{cloudStatus}</strong>
        {loading && <p>Loading cloud settings...</p>}
      </div>

      {error && <p className="error">{error}</p>}

      <div className="tabs">
        {modules.map(module => (
          <button
            key={module.id}
            className={active === module.id ? "active" : ""}
            onClick={() => setActive(module.id)}
          >
            {module.name}
          </button>
        ))}
      </div>

      <div className="control-content">
        {renderModule()}
      </div>

      <div className="action-buttons">
        <button
          onClick={saveDraft}
          disabled={loading || saving}
        >
          {saving ? "Saving..." : "Save to Cloud"}
        </button>
      </div>

      <p>
        Admin settings are stored privately.
        Public gameplay settings are saved automatically
        when Save to Cloud is pressed.
      </p>
    </div>
  );
}
