
import React, { useEffect, useState } from "react";
import {
  Map, Plus, Save, RefreshCw, Trash2,
  Edit3, Upload, ArrowLeft, MapPin
} from "lucide-react";

const OWNER_ID = "abae9dc5-08d4-4f34-8cbb-c350f9e5736f";

const emptyMap = {
  map_name: "",
  map_description: "",
  map_type: "Island",
  map_size: "Large",
  status: "draft",
  map_config: {
    terrain: "Island",
    spawn_points: [],
    loot_areas: [],
    safe_zone: { x: 50, y: 50, size: 30 },
    airdrop_points: []
  }
};

export default function MapManagement({ db, onBack }) {
  const [maps, setMaps] = useState([]);
  const [draft, setDraft] = useState(emptyMap);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [spawnText, setSpawnText] = useState("");
  const [lootText, setLootText] = useState("");
  const [airdropText, setAirdropText] = useState("");

  const notify = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3500);
  };

  async function loadMaps() {
    if (!db) return;

    setLoading(true);

    try {
      const { data: sessionData } = await db.auth.getSession();

      if (sessionData?.session?.user?.id !== OWNER_ID) {
        throw new Error("Owner Admin permission নেই।");
      }

      const { data, error } = await db
        .from("game_map_configs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMaps(data || []);
    } catch (error) {
      notify(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMaps();
  }, []);

  function updateField(key, value) {
    setDraft(previous => ({
      ...previous,
      [key]: value
    }));
  }

  function updateConfig(key, value) {
    setDraft(previous => ({
      ...previous,
      map_config: {
        ...previous.map_config,
        [key]: value
      }
    }));
  }

  function resetForm() {
    setDraft({
      ...emptyMap,
      map_config: {
        ...emptyMap.map_config,
        safe_zone: { ...emptyMap.map_config.safe_zone }
      }
    });
    setEditingId(null);
    setSpawnText("");
    setLootText("");
    setAirdropText("");
  }

  async function saveMap(event) {
    event.preventDefault();

    if (!draft.map_name.trim()) {
      notify("Map Name লিখুন।");
      return;
    }

    setSaving(true);

    try {
      const { data: sessionData } = await db.auth.getSession();

      if (sessionData?.session?.user?.id !== OWNER_ID) {
        throw new Error("Owner Admin permission নেই।");
      }

      const finalData = {
        ...draft,
        map_config: {
          ...draft.map_config,
          spawn_points: spawnText.split("\n").map(x => x.trim()).filter(Boolean),
          loot_areas: lootText.split("\n").map(x => x.trim()).filter(Boolean),
          airdrop_points: airdropText.split("\n").map(x => x.trim()).filter(Boolean)
        },
        updated_at: new Date().toISOString()
      };

      let result;

      if (editingId) {
        result = await db
          .from("game_map_configs")
          .update(finalData)
          .eq("id", editingId);
      } else {
        result = await db
          .from("game_map_configs")
          .insert([finalData]);
      }

      if (result.error) throw result.error;

      notify(editingId ? "Map Updated!" : "New Map Saved!");
      resetForm();
      await loadMaps();
    } catch (error) {
      notify(error.message);
    } finally {
      setSaving(false);
    }
  }

  function editMap(item) {
    setEditingId(item.id);

    setDraft({
      ...emptyMap,
      ...item,
      map_config: {
        ...emptyMap.map_config,
        ...(item.map_config || {})
      }
    });

    setSpawnText((item.map_config?.spawn_points || []).join("\n"));
    setLootText((item.map_config?.loot_areas || []).join("\n"));
    setAirdropText((item.map_config?.airdrop_points || []).join("\n"));

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function publishMap(item) {
    if (!window.confirm("এই Map Publish করতে চান?")) return;

    try {
      const { data: sessionData } = await db.auth.getSession();

      if (sessionData?.session?.user?.id !== OWNER_ID) {
        throw new Error("Owner Admin permission নেই।");
      }

      const { error } = await db
        .from("game_map_configs")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (error) throw error;

      notify("Map Published!");
      await loadMaps();
    } catch (error) {
      notify(error.message);
    }
  }

  async function deleteMap(id) {
    if (!window.confirm("এই Map মুছে ফেলতে চান?")) return;

    try {
      const { error } = await db
        .from("game_map_configs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      notify("Map Deleted!");
      await loadMaps();
    } catch (error) {
      notify(error.message);
    }
  }

  const config = draft.map_config;

  return (
    <div className="page-content map-manager">
      <div className="map-manager-heading">
        <button onClick={onBack}>
          <ArrowLeft size={17} /> Back
        </button>

        <div>
          <h1><Map size={25} /> Map Management</h1>
          <p>Create, edit, save and publish game maps</p>
        </div>

        <button onClick={loadMaps}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {message && <div className="map-message">{message}</div>}

      <form className="panel" onSubmit={saveMap}>
        <h2>{editingId ? "Edit Map" : "Create New Map"}</h2>

        <label>Map Name</label>
        <input
          value={draft.map_name}
          onChange={e => updateField("map_name", e.target.value)}
          placeholder="Enter map name"
          required
        />

        <label>Description</label>
        <textarea
          rows={3}
          value={draft.map_description}
          onChange={e => updateField("map_description", e.target.value)}
          placeholder="Map description"
        />

        <div className="map-form-grid">
          <div>
            <label>Map Type</label>
            <select
              value={draft.map_type}
              onChange={e => updateField("map_type", e.target.value)}
            >
              <option>Island</option>
              <option>Forest</option>
              <option>Desert</option>
              <option>City</option>
              <option>Snow</option>
            </select>
          </div>

          <div>
            <label>Map Size</label>
            <select
              value={draft.map_size}
              onChange={e => updateField("map_size", e.target.value)}
            >
              <option>Small</option>
              <option>Medium</option>
              <option>Large</option>
              <option>Extra Large</option>
            </select>
          </div>
        </div>

        <h3>Map Environment</h3>

        <label>Terrain</label>
        <select
          value={config.terrain}
          onChange={e => updateConfig("terrain", e.target.value)}
        >
          <option>Island</option>
          <option>Mountains</option>
          <option>Forest</option>
          <option>River</option>
          <option>Sea</option>
          <option>City</option>
        </select>

        <h3>Spawn Points</h3>
        <textarea
          rows={3}
          value={spawnText}
          onChange={e => setSpawnText(e.target.value)}
          placeholder={"প্রতি লাইনে একটি Spawn Point লিখুন"}
        />

        <h3>Loot Areas</h3>
        <textarea
          rows={3}
          value={lootText}
          onChange={e => setLootText(e.target.value)}
          placeholder={"প্রতি লাইনে একটি Loot Area লিখুন"}
        />

        <h3>Safe Zone</h3>

        <div className="map-form-grid">
          <div>
            <label>X Position</label>
            <input
              type="number"
              min="0"
              max="100"
              value={config.safe_zone.x}
              onChange={e => updateConfig("safe_zone", {
                ...config.safe_zone,
                x: Number(e.target.value)
              })}
            />
          </div>

          <div>
            <label>Y Position</label>
            <input
              type="number"
              min="0"
              max="100"
              value={config.safe_zone.y}
              onChange={e => updateConfig("safe_zone", {
                ...config.safe_zone,
                y: Number(e.target.value)
              })}
            />
          </div>
        </div>

        <label>Safe Zone Size</label>
        <input
          type="range"
          min="5"
          max="100"
          value={config.safe_zone.size}
          onChange={e => updateConfig("safe_zone", {
            ...config.safe_zone,
            size: Number(e.target.value)
          })}
        />
        <p>{config.safe_zone.size}%</p>

        <h3>Airdrop Points</h3>
        <textarea
          rows={3}
          value={airdropText}
          onChange={e => setAirdropText(e.target.value)}
          placeholder={"প্রতি লাইনে একটি Airdrop Point লিখুন"}
        />

        <h3>Map Preview</h3>

        <div className="map-preview">
          <div className="map-preview-land">
            <div
              className="map-safe-zone"
              style={{
                left: `${config.safe_zone.x}%`,
                top: `${config.safe_zone.y}%`,
                width: `${config.safe_zone.size}%`,
                height: `${config.safe_zone.size}%`
              }}
            />
            <div className="map-preview-label">
              {draft.map_name || "Your Map"}
            </div>
            <span className="map-preview-terrain">
              {config.terrain}
            </span>
          </div>
        </div>

        <div className="map-form-actions">
          <button type="submit" disabled={saving}>
            <Save size={17} />
            {saving ? "Saving..." : editingId ? "Update Map" : "Save Map"}
          </button>

          <button type="button" onClick={resetForm}>
            Cancel / Reset
          </button>
        </div>
      </form>

      <div className="panel">
        <h2>Saved Maps ({maps.length})</h2>

        {loading ? (
          <p>Loading Maps...</p>
        ) : maps.length === 0 ? (
          <p>No maps created yet.</p>
        ) : (
          <div className="map-record-grid">
            {maps.map(item => (
              <div className="map-record" key={item.id}>
                <MapPin size={25} />
                <h3>{item.map_name}</h3>
                <p>{item.map_description}</p>
                <small>
                  {item.map_type} · {item.map_size}
                </small>
                <p>Status: {item.status}</p>

                <div className="map-form-actions">
                  <button onClick={() => editMap(item)}>
                    <Edit3 size={15} /> Edit
                  </button>

                  <button onClick={() => publishMap(item)}>
                    <Upload size={15} /> Publish
                  </button>

                  <button onClick={() => deleteMap(item.id)}>
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
