import MapManagement from "./MapManagement"; import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  Activity, Bell, Check, Crown, Gamepad2, Gem,
  LayoutDashboard, LogOut, Menu, MessageCircle,
  Search, Send, Settings, Shield, ShieldCheck,
  Sparkles, Sword, Trophy, UserCog, Users, X,
  Map, ShoppingBag, Palette, LoaderCircle,
  Plus, RefreshCw, Ban, History
} from "lucide-react";
import MasterControl from "./MasterControl";
import "./style.css";

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const db = URL && KEY
  ? createClient(URL, KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: "pkce"
      }
    })
  : null;

const OWNER_ID = "abae9dc5-08d4-4f34-8cbb-c350f9e5736f";

const PLAYER_API =
  "https://bd-game.shohagkhan017500411.workers.dev/api/admin/players";

const MODULES = [
  ["Game Dashboard", LayoutDashboard],
  ["Player Management", Users],
  ["Character Management", UserCog],
  ["Outfit & Skin Management", Palette],
  ["Weapon Control", Sword],
  ["Map Management", Map],
  ["Game Mode Management", Gamepad2],
  ["Room & Match Management", Activity],
  ["Diamond & Coin Management", Gem],
  ["Game Shop Management", ShoppingBag],
  ["Event & Mission Management", Sparkles],
  ["Rank & Leaderboard Management", Trophy],
  ["Chat & Support Management", MessageCircle],
  ["Notification Management", Bell],
  ["Intro & Lobby Management", Gamepad2],
  ["Game Update Management", Activity],
  ["Security & Reports Management", ShieldCheck],
  ["Game Settings Management", Settings],
  ["Emote Management", Sparkles],
  ["Animation Management", Activity],
  ["Diamond Send Management", Send],
  ["AI System", Sparkles]
];

const MODULE_TABLES = {
  "Character Management": "game_characters",
  "Outfit & Skin Management": "game_outfits",
  "Weapon Control": "game_weapons",
  "Map Management": "game_maps",
  "Game Mode Management": "game_modes",
  "Room & Match Management": "game_rooms",
  "Game Shop Management": "game_shop_items",
  "Event & Mission Management": "game_events",
  "Rank & Leaderboard Management": "game_rank_settings",
  "Chat & Support Management": "game_support_tickets",
  "Notification Management": "game_notifications",
  "Intro & Lobby Management": "game_lobby_settings",
  "Game Update Management": "game_updates",
  "Security & Reports Management": "game_security_reports",
  "Emote Management": "game_emotes",
  "Animation Management": "game_animations",
  "Diamond Send Management": "game_diamond_transfers"
};

const PLANS = [
  {
    id: "weekly",
    label: "Weekly",
    total: 500,
    instant: 250,
    deferred: 250,
    days: 7
  },
  {
    id: "weekly_lite",
    label: "Weekly Lite",
    total: 300,
    instant: 150,
    deferred: 150,
    days: 7
  },
  {
    id: "monthly",
    label: "Monthly",
    total: 3000,
    instant: 1500,
    deferred: 1500,
    days: 30,
    daily: 50
  }
];

function App() {
  const [session, setSession] = useState(null);
  const [busy, setBusy] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [page, setPage] = useState("Game Dashboard");
  const [mobile, setMobile] = useState(false);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");

  const [dashboardImage, setDashboardImage] = useState(() => {
    try {
      return localStorage.getItem("bd_game_dashboard_image") || "";
    } catch {
      return "";
    }
  });

  const [players, setPlayers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [roleHistory, setRoleHistory] = useState([]);
  const [appwritePlayers, setAppwritePlayers] = useState([]);
  const [playerApiStatus, setPlayerApiStatus] = useState("Checking...");

  const [playerName, setPlayerName] = useState("");
  const [playerUid, setPlayerUid] = useState("");
  const [roleName, setRoleName] = useState("");
  const [planId, setPlanId] = useState("weekly");
  const [orderPlayer, setOrderPlayer] = useState("");
  const [orderAmount, setOrderAmount] = useState("");

  const [moduleRows, setModuleRows] = useState([]);
  const [moduleDraft, setModuleDraft] = useState({
    name: "",
    description: "",
    image_url: "",
    status: "active"
  });
  const [moduleEditingId, setModuleEditingId] = useState(null);
  const [moduleLoading, setModuleLoading] = useState(false);

  const notify = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 3500);
  };

  function handleDashboardImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("Please select an image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notify("Image must be under 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = String(reader.result || "");

      try {
        localStorage.setItem("bd_game_dashboard_image", imageData);
        setDashboardImage(imageData);
        notify("Dashboard photo saved on this device.");
      } catch {
        notify("Could not save image. Try a smaller photo.");
      }
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  useEffect(() => {
    if (!db) {
      setBusy(false);
      return;
    }

    const checkSession = async () => {
      const { data } = await db.auth.getSession();

      if (data?.session) {
        const allowed = await verifyAdmin(data.session);

        if (allowed) {
          setSession(data.session);
          await loadData();
        } else {
          await db.auth.signOut();
        }
      }

      setBusy(false);
    };

    checkSession();

    const { data: listener } = db.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!nextSession) {
          setSession(null);
          return;
        }

        const allowed = await verifyAdmin(nextSession);
        if (allowed) setSession(nextSession);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function verifyAdmin(currentSession) {
    if (!currentSession?.user) return false;

    if (currentSession.user.id === OWNER_ID) return true;

    const { data, error } = await db.rpc("is_admin");

    if (error) {
      console.error("Admin verification:", error);
      return false;
    }

    return data === true;
  }

  async function login(event) {
    event.preventDefault();

    if (!db) {
      notify("Supabase configuration is missing.");
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await db.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword
      });

      if (error) throw error;

      const allowed = await verifyAdmin(data.session);

      if (!allowed) {
        await db.auth.signOut();
        throw new Error("এই অ্যাকাউন্টের Admin অনুমতি নেই।");
      }

      setSession(data.session);
      await loadData();
      notify("Admin login successful.");
    } catch (error) {
      notify(error.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!loginEmail.trim()) {
      notify("আগে Gmail লিখুন।");
      return;
    }

    const { error } = await db.auth.resetPasswordForEmail(
      loginEmail.trim(),
      {
        redirectTo: window.location.origin
      }
    );

    if (error) notify(error.message);
    else notify("Password reset email পাঠানো হয়েছে।");
  }

  async function logout() {
    await db.auth.signOut();
    setSession(null);
    setPage("Game Dashboard");
    notify("Logged out.");
  }

  async function loadData() {
    if (!db) return;

    const requests = await Promise.all([
      db.from("game_players").select("*").order("created_at", {
        ascending: false
      }),
      db.from("player_roles").select("*"),
      db.from("reward_orders").select("*").order("created_at", {
        ascending: false
      }),
      db.from("diamond_distributions").select("*").order("created_at", {
        ascending: false
      }),
      db.from("player_role_history").select("*").order("created_at", {
        ascending: false
      })
    ]);

    setPlayers(requests[0].data || []);
    setRoles(requests[1].data || []);
    setOrders(requests[2].data || []);
    setHistory(requests[3].data || []);
    setRoleHistory(requests[4].data || []);

    await refreshPlayerApp();
  }

  async function refreshPlayerApp() {
    if (!session?.access_token) return;

    try {
      const response = await fetch(PLAYER_API, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        setPlayerApiStatus("API unavailable");
        return;
      }

      const result = await response.json();

      setAppwritePlayers(
        Array.isArray(result) ? result : result.players || []
      );

      setPlayerApiStatus("Connected");
    } catch (error) {
      console.error(error);
      setPlayerApiStatus("Connection failed");
    }
  }

  async function loadModuleRows(moduleName = page) {
    const table = MODULE_TABLES[moduleName];

    if (!table) {
      setModuleRows([]);
      return;
    }

    setModuleLoading(true);

    try {
      const { data, error } = await db
        .from(table)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setModuleRows(data || []);
    } catch (error) {
      notify(error.message);
    } finally {
      setModuleLoading(false);
    }
  }

  async function saveModuleItem(event) {
    event.preventDefault();

    const table = MODULE_TABLES[page];
    if (!table) return;

    setModuleLoading(true);

    try {
      let result;

      if (moduleEditingId) {
        result = await db
          .from(table)
          .update(moduleDraft)
          .eq("id", moduleEditingId);
      } else {
        result = await db
          .from(table)
          .insert([moduleDraft]);
      }

      if (result.error) throw result.error;

      notify(moduleEditingId ? "Updated successfully." : "Added successfully.");

      setModuleDraft({
        name: "",
        description: "",
        image_url: "",
        status: "active"
      });

      setModuleEditingId(null);
      await loadModuleRows(page);
    } catch (error) {
      notify(error.message);
    } finally {
      setModuleLoading(false);
    }
  }

  async function deleteModuleItem(id) {
    if (!window.confirm("এই তথ্যটি মুছে ফেলতে চান?")) return;

    const table = MODULE_TABLES[page];

    try {
      const { error } = await db
        .from(table)
        .delete()
        .eq("id", id);

      if (error) throw error;

      notify("Deleted successfully.");
      await loadModuleRows(page);
    } catch (error) {
      notify(error.message);
    }
  }

  function editModuleItem(item) {
    setModuleEditingId(item.id);
    setModuleDraft({ ...item });
  }

  useEffect(() => {
    if (session && MODULE_TABLES[page]) {
      loadModuleRows(page);
    }
  }, [page, session]);

  async function addPlayer(event) {
    event.preventDefault();

    if (!playerName.trim() || !playerUid.trim()) {
      notify("Player name এবং UID দিন।");
      return;
    }

    const { error } = await db.from("game_players").insert([{
      player_name: playerName.trim(),
      player_uid: playerUid.trim()
    }]);

    if (error) {
      notify(error.message);
      return;
    }

    setPlayerName("");
    setPlayerUid("");
    notify("Player added.");
    await loadData();
  }

  async function assignRole(event) {
    event.preventDefault();

    if (!orderPlayer || !roleName.trim()) {
      notify("Player এবং Role নির্বাচন করুন।");
      return;
    }

    const { error } = await db.from("player_roles").insert([{
      player_id: orderPlayer,
      role_name: roleName.trim()
    }]);

    if (error) {
      notify(error.message);
      return;
    }

    setRoleName("");
    notify("Role assigned.");
    await loadData();
  }

  async function removeRole(id) {
    if (!window.confirm("এই Role সরাতে চান?")) return;

    const { error } = await db
      .from("player_roles")
      .delete()
      .eq("id", id);

    if (error) notify(error.message);
    else {
      notify("Role removed.");
      await loadData();
    }
  }

  async function createOrder(event) {
    event.preventDefault();

    const selectedPlan = PLANS.find((p) => p.id === planId);

    if (!orderPlayer || !selectedPlan) {
      notify("Player এবং Plan নির্বাচন করুন।");
      return;
    }

    const { error } = await db.from("reward_orders").insert([{
      player_id: orderPlayer,
      plan_id: selectedPlan.id,
      amount: selectedPlan.total,
      status: "pending"
    }]);

    if (error) {
      notify(error.message);
      return;
    }

    notify("Reward order created.");
    await loadData();
  }

  async function reviewOrder(order, approved) {
    const status = approved ? "approved" : "rejected";

    const { error } = await db
      .from("reward_orders")
      .update({ status })
      .eq("id", order.id);

    if (error) {
      notify(error.message);
      return;
    }

    if (approved) {
      const { error: distributionError } = await db
        .from("diamond_distributions")
        .insert([{
          player_id: order.player_id,
          amount: order.amount,
          status: "pending"
        }]);

      if (distributionError) {
        notify("Order approved, but distribution failed: " + distributionError.message);
        await loadData();
        return;
      }
    }

    notify(approved ? "Order approved." : "Order rejected.");
    await loadData();
}function dashboard() {
    return (
      <div
        className="page-content dashboard-photo-page"
        style={dashboardImage ? {
          backgroundImage:
            `linear-gradient(#06132699, #061326d9), url("${dashboardImage}")`
        } : undefined}
      >
        <section className="dashboard-partner-hero">
          <label className="dashboard-photo-upload">
            <Plus size={16} />
            {dashboardImage ? "Change Photo" : "Add Photo"}

            <input
              type="file"
              accept="image/*"
              onChange={handleDashboardImage}
            />
          </label>

          {!dashboardImage && (
            <div className="dashboard-photo-placeholder">
              <Users size={42} />
              <strong>Your Photo Will Appear Here</strong>
              <small>Choose a photo from your device</small>
            </div>
          )}

          <h1>My Life Partner</h1>
        </section>

        <div className="welcome">
          <div>
            <h1>Game Dashboard</h1>
            <p>BD GAME Admin Control Center</p>
          </div>
          <Gamepad2 size={38} />
        </div>

        <div className="stats">
          <Stat title="Players" value={players.length} icon={Users} />
          <Stat title="Roles" value={roles.length} icon={Crown} />
          <Stat title="Reward Orders" value={orders.length} icon={Gem} />
          <Stat title="Distributions" value={history.length} icon={Send} />
        </div>

        <div className="tiles">
          {MODULES.map(([name, Icon]) => (
            <button
              key={name}
              className="tile"
              onClick={() => setPage(name)}
            >
              <Icon size={25} />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function playerPage() {
    const filteredPlayers = players.filter((p) =>
      JSON.stringify(p).toLowerCase().includes(query.toLowerCase())
    );

    return (
      <div className="page-content">
        <h1>Player Management</h1>

        <div className="panel">
          <h3>Player App Connection</h3>
          <p>API Status: {playerApiStatus}</p>
          <button onClick={refreshPlayerApp}>
            <RefreshCw size={16} /> Refresh Player List
          </button>
        </div>

        <div className="panel">
          <h3>Add Player</h3>
          <form onSubmit={addPlayer} className="form-grid">
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Player name"
            />
            <input
              value={playerUid}
              onChange={(e) => setPlayerUid(e.target.value)}
              placeholder="Player UID"
            />
            <button type="submit">
              <Plus size={16} /> Add Player
            </button>
          </form>
        </div>

        <div className="panel">
          <h3>Search Players</h3>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search player..."
          />

          <DataTable
            columns={["Player", "UID", "Created"]}
            rows={filteredPlayers.map((p) => [
              p.player_name || p.name || "—",
              p.player_uid || p.uid || "—",
              p.created_at
                ? new Date(p.created_at).toLocaleDateString()
                : "—"
            ])}
          />
        </div>

        <div className="panel">
          <h3>Player App Records</h3>
          <DataTable
            columns={["Player", "UID", "Status"]}
            rows={appwritePlayers.map((p) => [
              p.name || p.player_name || "—",
              p.uid || p.player_uid || "—",
              p.status || "Active"
            ])}
          />
        </div>

        <div className="panel">
          <h3>Assign Player Role</h3>
          <form onSubmit={assignRole} className="form-grid">
            <select
              value={orderPlayer}
              onChange={(e) => setOrderPlayer(e.target.value)}
            >
              <option value="">Select player</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.player_name || p.player_uid}
                </option>
              ))}
            </select>

            <input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Role name"
            />

            <button type="submit">Assign Role</button>
          </form>

          <DataTable
            columns={["Player ID", "Role", "Action"]}
            rows={roles.map((r) => [
              r.player_id,
              r.role_name,
              <button key={r.id} onClick={() => removeRole(r.id)}>
                Remove
              </button>
            ])}
          />
        </div>
      </div>
    );
  }

  function rewardPage() {
    return (
      <div className="page-content">
        <h1>Diamond & Coin Management</h1>

        <div className="stats-grid">
          {PLANS.map((plan) => (
            <div className="panel" key={plan.id}>
              <h3>{plan.label}</h3>
              <h2>{plan.total} Diamonds</h2>
              <p>Instant: {plan.instant}</p>
              <p>Deferred: {plan.deferred}</p>
              <p>Duration: {plan.days} days</p>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3>Create Reward Order</h3>

          <form onSubmit={createOrder} className="form-grid">
            <select
              value={orderPlayer}
              onChange={(e) => setOrderPlayer(e.target.value)}
            >
              <option value="">Select player</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.player_name || p.player_uid}
                </option>
              ))}
            </select>

            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
            >
              {PLANS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} - {p.total} Diamonds
                </option>
              ))}
            </select>

            <button type="submit">Create Order</button>
          </form>
        </div>

        <div className="panel">
          <h3>Reward Orders</h3>

          <DataTable
            columns={["Player", "Amount", "Status", "Actions"]}
            rows={orders.map((o) => [
              o.player_id,
              o.amount,
              o.status,
              o.status === "pending" ? (
                <div className="action-row" key={o.id}>
                  <button onClick={() => reviewOrder(o, true)}>
                    Approve
                  </button>
                  <button onClick={() => reviewOrder(o, false)}>
                    Reject
                  </button>
                </div>
              ) : o.status
            ])}
          />
        </div>

        <div className="panel">
          <h3>Diamond Distribution History</h3>
          <DataTable
            columns={["Player", "Amount", "Status", "Date"]}
            rows={history.map((h) => [
              h.player_id,
              h.amount,
              h.status,
              h.created_at
                ? new Date(h.created_at).toLocaleString()
                : "—"
            ])}
          />
        </div>
      </div>
    );
  }

  function moduleManagerPage() {
    const table = MODULE_TABLES[page];

    if (!table) {
      return (
        <div className="page-content">
          <h1>{page}</h1>
          <div className="panel">
            <p>এই মডিউলের জন্য আলাদা ব্যবস্থাপনা UI এখনো তৈরি করা হয়নি।</p>
          </div>
        </div>
      );
    }

    return (
      <div className="page-content">
        <div className="page-heading">
          <div>
            <h1>{page}</h1>
            <p>Database: {table}</p>
          </div>

          <button onClick={() => loadModuleRows(page)}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div className="panel">
          <h3>{moduleEditingId ? "Edit Record" : "Add New Record"}</h3>

          <form onSubmit={saveModuleItem}>
            <label>Name</label>
            <input
              value={moduleDraft.name || ""}
              onChange={(e) =>
                setModuleDraft({
                  ...moduleDraft,
                  name: e.target.value
                })
              }
              placeholder="Enter name"
            />

            <label>Description</label>
            <textarea
              value={moduleDraft.description || ""}
              onChange={(e) =>
                setModuleDraft({
                  ...moduleDraft,
                  description: e.target.value
                })
              }
              placeholder="Enter description"
              rows={4}
            />

            <label>Image URL</label>
            <input
              value={moduleDraft.image_url || ""}
              onChange={(e) =>
                setModuleDraft({
                  ...moduleDraft,
                  image_url: e.target.value
                })
              }
              placeholder="https://example.com/image.png"
            />

            <label>Status</label>
            <select
              value={moduleDraft.status || "active"}
              onChange={(e) =>
                setModuleDraft({
                  ...moduleDraft,
                  status: e.target.value
                })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <div className="action-row">
              <button type="submit" disabled={moduleLoading}>
                {moduleLoading ? "Saving..." : "Save"}
              </button>

              {moduleEditingId && (
                <button
                  type="button"
                  onClick={() => {
                    setModuleEditingId(null);
                    setModuleDraft({
                      name: "",
                      description: "",
                      image_url: "",
                      status: "active"
                    });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="panel">
          <div className="page-heading">
            <h3>Saved Records ({moduleRows.length})</h3>
            {moduleLoading && <LoaderCircle className="spin" />}
          </div>

          {moduleRows.length === 0 ? (
            <p>No records found.</p>
          ) : (
            <div className="record-grid">
              {moduleRows.map((item) => (
                <div className="record-card" key={item.id}>
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name || "Record"}
                    />
                  )}

                  <h3>{item.name || item.title || item.id}</h3>
                  <p>{item.description || item.details || ""}</p>
                  <small>Status: {item.status || "—"}</small>

                  <div className="action-row">
                    <button onClick={() => editModuleItem(item)}>
                      Edit
                    </button>

                    <button
                      className="danger"
                      onClick={() => deleteModuleItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }function content() {
    if (page === "Game Dashboard") return dashboard();

    if (page === "Player Management") return playerPage();

    if (
      page === "Diamond & Coin Management" ||
      page === "Diamond Send Management"
    ) {
      return rewardPage();
    }

    if (
      page === "AI System" ||
      page === "Game Settings Management"
    ) {
      return (
        <div className="page-content">
          <h1>{page}</h1>
          <MasterControl />
        </div>
      );
    }

    return moduleManagerPage();
  }

  if (busy) {
    return (
      <div className="loading-screen">
        <LoaderCircle className="spin" size={38} />
        <p>Loading BD GAME Admin...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">
            <Gamepad2 size={42} />
          </div>

          <h1>BD GAME ADMIN</h1>
          <p>Admin Control Center</p>

          <form onSubmit={login}>
            <label>Admin Gmail</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Enter admin Gmail"
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Enter password"
              required
            />

            <button type="submit" disabled={busy}>
              Login to Admin
            </button>
          </form>

          <button className="text-button" onClick={resetPassword}>
            Forgot Password?
          </button>

          {notice && <div className="notice">{notice}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className={`sidebar ${mobile ? "show" : ""}`}>
        <div className="sidebar-brand">
          <Gamepad2 size={30} />
          <div>
            <strong>BD GAME</strong>
            <small>ADMIN PANEL</small>
          </div>

          <button
            className="close-sidebar"
            onClick={() => setMobile(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav>
          {MODULES.map(([name, Icon]) => (
            <button
              key={name}
              className={page === name ? "nav-active" : ""}
              onClick={() => {
                setPage(name);
                setMobile(false);
              }}
            >
              <Icon size={19} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <button className="logout-button" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setMobile(!mobile)}
          >
            <Menu size={23} />
          </button>

          <div>
            <strong>{page}</strong>
            <small>BD GAME Administration</small>
          </div>

          <div className="admin-status">
            <span className="online-dot" />
            Admin Online
          </div>
        </header>

        {content()}
      </main>

      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}

function Stat({ title, value, icon: Icon }) {
  return (
    <div className="stat-card">
      <div>
        <small>{title}</small>
        <h2>{value}</h2>
      </div>
      <Icon size={28} />
    </div>
  );
}

function DataTable({ columns = [], rows = [] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>No data available</td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
