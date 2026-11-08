import React, { useEffect, useMemo, useState } from "react";
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
import "./style.css";

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const db = URL && KEY ? createClient(URL, KEY) : null;

const OWNER_ID = "3fcee17a-fd33-4d0e-97cf-7ae35c9eb820";

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
  ["Diamond Send Management", Send]
];

const PLANS = [
  { id: "weekly", label: "Weekly", total: 500, instant: 250, deferred: 250, days: 7 },
  { id: "weekly_lite", label: "Weekly Lite", total: 300, instant: 150, deferred: 150, days: 7 },
  { id: "monthly", label: "Monthly", total: 3000, instant: 1500, deferred: 1500, days: 30, daily: 50 }
];

function App() {
  const [session, setSession] = useState(null);
  const [busy, setBusy] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState("Game Dashboard");
  const [mobile, setMobile] = useState(false);

  const [players, setPlayers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [diamondHistory, setDiamondHistory] = useState([]);
  const [roleHistory, setRoleHistory] = useState([]);

  const [query, setQuery] = useState("");
  const [newPlayerId, setNewPlayerId] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [roleName, setRoleName] = useState("moderator");
  const [planId, setPlanId] = useState("weekly");
  const [orderPlayer, setOrderPlayer] = useState("");
  const [notice, setNotice] = useState("");

  function notify(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  async function verifyAdmin(userSession) {
    if (!userSession || userSession.user.id !== OWNER_ID) {
      await db?.auth.signOut();
      setSession(null);
      setError("এই অ্যাকাউন্টটি নির্ধারিত Admin ID নয়।");
      setBusy(false);
      return;
    }

    const { data, error: rpcError } = await db.rpc("is_admin");

    if (rpcError || data !== true) {
      await db.auth.signOut();
      setSession(null);
      setError("Admin অনুমতি যাচাই করা যায়নি।");
    } else {
      setSession(userSession);
      setError("");
    }

    setBusy(false);
  }

  useEffect(() => {
    if (!db) {
      setBusy(false);
      return;
    }

    let mounted = true;

    db.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      if (data.session) {
        verifyAdmin(data.session);
      } else {
        setBusy(false);
      }
    });

    const { data: listener } = db.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        setBusy(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    if (!db) {
      setError("Supabase configuration পাওয়া যায়নি।");
      setBusy(false);
      return;
    }

    const { data, error: loginError } =
      await db.auth.signInWithPassword({
        email: email.trim(),
        password
      });

    if (loginError) {
      setError("Login ব্যর্থ। ইমেইল ও পাসওয়ার্ড যাচাই করুন।");
      setBusy(false);
      return;
    }

    await verifyAdmin(data.session);
  }

  async function loadData() {
    if (!db || !session) return;

    const [p, r, o, dh, rh] = await Promise.all([
      db.from("game_players")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300),

      db.from("player_roles")
        .select("*, game_players(player_id,player_name,avatar_url,v_badge)")
        .order("created_at", { ascending: false }),

      db.from("reward_orders")
        .select("*, game_players(player_id,player_name), reward_plans(reward_name,total_diamonds,instant_diamonds,deferred_diamonds,duration_days,daily_diamonds)")
        .order("created_at", { ascending: false })
        .limit(300),

      db.from("diamond_distributions")
        .select("*")
        .order("distributed_at", { ascending: false })
        .limit(300),

      db.from("player_role_history")
        .select("*, game_players(player_id,player_name)")
        .order("created_at", { ascending: false })
        .limit(300)
    ]);

    if (p.error) notify("Player: " + p.error.message);
    else setPlayers(p.data || []);

    if (r.error) notify("Role: " + r.error.message);
    else setRoles(r.data || []);

    if (o.error) notify("Order: " + o.error.message);
    else setOrders(o.data || []);

    if (dh.error) notify("Diamond History: " + dh.error.message);
    else setDiamondHistory(dh.data || []);

    if (rh.error) notify("Role History: " + rh.error.message);
    else setRoleHistory(rh.data || []);
  }

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  async function addPlayer(e) {
    e.preventDefault();

    const { error: insertError } = await db
      .from("game_players")
      .insert({
        player_id: newPlayerId.trim(),
        player_name: newPlayerName.trim()
      });

    if (insertError) return notify(insertError.message);

    setNewPlayerId("");
    setNewPlayerName("");
    notify("Player যোগ হয়েছে।");
    loadData();
  }

  // নিরাপদ SQL Function দিয়ে Moderator / Vice দেওয়া
  async function assignRole(e) {
    e.preventDefault();

    if (!selectedPlayer) {
      return notify("Player নির্বাচন করুন।");
    }

    const { error: roleError } = await db.rpc(
      "admin_assign_player_role",
      {
        p_player_uuid: selectedPlayer,
        p_role_name: roleName
      }
    );

    if (roleError) return notify(roleError.message);

    notify("Role দেওয়া হয়েছে।");
    loadData();
  }

  // সাধারণ Player-সহ যেকোনো Player-এর V Badge চালু / বন্ধ
  async function togglePlayerBadge(player) {
    const { error: badgeError } = await db.rpc(
      "admin_set_player_v_badge",
      {
        p_player_uuid: player.id,
        p_enabled: !player.v_badge
      }
    );

    if (badgeError) return notify(badgeError.message);

    notify(
      !player.v_badge
        ? "V Badge চালু হয়েছে।"
        : "V Badge বন্ধ হয়েছে।"
    );

    loadData();
  }

  // নিরাপদ SQL Function দিয়ে Role সরানো
  async function removeRole(role) {
    const { error: deleteError } = await db.rpc(
      "admin_remove_player_role",
      {
        p_player_uuid: role.player_id,
        p_role_name: role.role_name
      }
    );

    if (deleteError) return notify(deleteError.message);

    notify("Role সরানো হয়েছে।");
    loadData();
  }

  async function createOrder(e) {
    e.preventDefault();

    if (!orderPlayer) return notify("Player নির্বাচন করুন।");

    const { error: orderError } = await db
      .from("reward_orders")
      .insert({
        player_id: orderPlayer,
        plan_id: planId
      });

    if (orderError) return notify(orderError.message);

    notify("Reward order তৈরি হয়েছে।");
    loadData();
  }

  async function reviewOrder(order, status) {
    const { error: updateError } = await db
      .from("reward_orders")
      .update({
        status,
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", order.id)
      .eq("status", "pending");

    if (updateError) return notify(updateError.message);

    if (status === "approved") {
      const amount = order.reward_plans?.instant_diamonds || 0;

      if (amount > 0) {
        const { error: distributionError } = await db
          .from("diamond_distributions")
          .insert({
            order_id: order.id,
            player_id: order.player_id,
            diamonds: amount,
            distribution_type: "instant"
          });

        if (distributionError) {
          notify("Distribution record হয়নি: " + distributionError.message);
          loadData();
          return;
        }
      }
    }

    notify(
      status === "approved"
        ? "Order approve হয়েছে।"
        : "Order reject হয়েছে।"
    );

    loadData();
  }

  async function logout() {
    await db.auth.signOut();
    setSession(null);
  }

  const filteredPlayers = useMemo(() => {
    const term = query.toLowerCase();

    return players.filter(p =>
      `${p.player_id} ${p.player_name}`
        .toLowerCase()
        .includes(term)
    );
  }, [players, query]);

  if (busy) {
    return (
      <div className="center">
        <LoaderCircle className="spin" />
        যাচাই হচ্ছে...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="login-wrap">
        <form className="login-card" onSubmit={login}>
          <div className="logo"><Gamepad2 size={42} /></div>
          <h1>BD GAME ADMIN</h1>
          <p>Secure Owner Login</p>

          {!db && (
            <div className="alert">
              Supabase configuration অনুপস্থিত।
            </div>
          )}

          <label>Admin Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {error && <div className="alert">{error}</div>}

          <button className="primary" disabled={!db}>
            Login
          </button>

          <small>শুধু নির্ধারিত Admin প্রবেশ করতে পারবে।</small>
        </form>
      </div>
    );
  }

  function dashboard() {
    return (
      <>
        <div className="welcome">
          <div>
            <h1>Welcome to BD GAME ADMIN</h1>
            <p>Game Management Control Center</p>
          </div>
          <Crown size={48} />
        </div>

        <div className="stats">
          <Stat icon={<Users />} label="Total Players" value={players.length} />
          <Stat icon={<Shield />} label="Assigned Roles" value={roles.length} />
          <Stat icon={<Gem />} label="Pending Orders" value={orders.filter(o => o.status === "pending").length} />
          <Stat icon={<History />} label="Role History" value={roleHistory.length} />
        </div>

        <div className="panel">
          <h3>২১টি Management Section</h3>
          <div className="tiles">
            {MODULES.map(([name, Icon]) => (
              <button
                className="tile"
                key={name}
                onClick={() => setPage(name)}
              >
                <Icon />
                <span>{name}</span>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  function playerPage() {
    return (
      <>
        <div className="panel">
          <h3>Player Management</h3>

          <div className="search">
            <Search />
            <input
              placeholder="Player ID বা নাম দিয়ে খুঁজুন"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          <form className="inline-form" onSubmit={addPlayer}>
            <input
              placeholder="Player ID"
              value={newPlayerId}
              onChange={e => setNewPlayerId(e.target.value)}
              required
            />
            <input
              placeholder="Player Name"
              value={newPlayerName}
              onChange={e => setNewPlayerName(e.target.value)}
              required
            />
            <button className="primary">
              <Plus /> Add Player
            </button>
          </form>

          <h3>Player List ও V Badge</h3>

          <div className="order-list">
            {filteredPlayers.length ? filteredPlayers.map(p => (
              <div className="order" key={p.id}>
                <div>
                  <b>
                    {p.player_name}
                    {p.v_badge && <span className="v-badge">V</span>}
                  </b>
                  <p>Player ID: {p.player_id}</p>
                  <span className={`status ${p.status || "active"}`}>
                    {p.status || "active"}
                  </span>
                </div>

                <div className="actions">
                  <button
                    className={p.v_badge ? "reject" : "approve"}
                    onClick={() => togglePlayerBadge(p)}
                  >
                    {p.v_badge ? "V Badge Off" : "V Badge On"}
                  </button>
                </div>
              </div>
            )) : (
              <p>কোনো Player পাওয়া যায়নি।</p>
            )}
          </div>
        </div>

        <div className="panel">
          <h3>Moderator / Vice Management</h3>

          <form className="inline-form" onSubmit={assignRole}>
            <select
              value={selectedPlayer}
              onChange={e => setSelectedPlayer(e.target.value)}
              required
            >
              <option value="">Player নির্বাচন করুন</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.player_name} · {p.player_id}
                </option>
              ))}
            </select>

            <select
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
            >
              <option value="moderator">Moderator</option>
              <option value="vice">Vice</option>
            </select>

            <button className="primary">
              <Plus /> Assign Role
            </button>
          </form>

          <div className="order-list">
            {roles.length ? roles.map(r => (
              <div className="order" key={r.id}>
                <div>
                  <b>
                    {r.game_players?.player_name || "Player"}
                    {" · "}
                    {r.game_players?.player_id || ""}
                    {r.game_players?.v_badge && (
                      <span className="v-badge">V</span>
                    )}
                  </b>

                  <p>
                    <span className={`role ${r.role_name}`}>
                      {r.role_name === "vice" ? "VICE" : "MODERATOR"}
                    </span>
                  </p>
                </div>

                <div className="actions">
                  <button
                    className="reject"
                    onClick={() => removeRole(r)}
                  >
                    <Ban /> Remove Role
                  </button>
                </div>
              </div>
            )) : (
              <p>এখনো কোনো Moderator বা Vice নেই।</p>
            )}
          </div>
        </div>

        <div className="panel">
          <h3>Player Role History</h3>
          <DataTable
            headers={["Player", "Player ID", "Action", "Role", "Date"]}
            rows={roleHistory.map(h => [
              h.game_players?.player_name || "Player",
              h.game_players?.player_id || h.player_id,
              h.action || "-",
              h.role_name || "V Badge",
              new Date(h.created_at).toLocaleString()
            ])}
          />
        </div>
      </>
    );
  }

  function rewardPage() {
    return (
      <>
        <div className="panel">
          <h3>Diamond Reward Management</h3>

          <p className="muted">
            Reward order তৈরি ও পর্যালোচনা করুন। বাস্তব গেমে Diamond পাঠাতে
            অনুমোদিত server API সংযোগ লাগবে।
          </p>

          <form className="inline-form" onSubmit={createOrder}>
            <select
              value={orderPlayer}
              onChange={e => setOrderPlayer(e.target.value)}
              required
            >
              <option value="">Player নির্বাচন করুন</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.player_name} · {p.player_id}
                </option>
              ))}
            </select>

            <select
              value={planId}
              onChange={e => setPlanId(e.target.value)}
            >
              {PLANS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.label} · {p.total} Diamond
                </option>
              ))}
            </select>

            <button className="primary">
              <Plus /> Create Order
            </button>
          </form>

          <div className="plan-grid">
            {PLANS.map(p => (
              <div className="plan" key={p.id}>
                <b>{p.label}</b>
                <strong>{p.total} 💎</strong>
                <span>সঙ্গে সঙ্গে: {p.instant}</span>
                <span>বাকি: {p.deferred}</span>
                <span>
                  সময়: {p.days} দিন
                  {p.daily ? ` · প্রতিদিন ${p.daily}` : ""}
                </span>
              </div>
            ))}
          </div>

          <h3>Reward Orders</h3>

          <div className="order-list">
            {orders.map(o => (
              <div className="order" key={o.id}>
                <div>
                  <b>
                    {o.game_players?.player_name}
                    {" · "}
                    {o.game_players?.player_id}
                  </b>
                  <p>
                    {o.reward_plans?.reward_name} ·
                    {o.reward_plans?.total_diamonds} Diamond
                  </p>
                  <span className={`status ${o.status}`}>
                    {o.status}
                  </span>
                </div>

                {o.status === "pending" && (
                  <div className="actions">
                    <button
                      className="approve"
                      onClick={() => reviewOrder(o, "approved")}
                    >
                      <Check /> Approve
                    </button>
                    <button
                      className="reject"
                      onClick={() => reviewOrder(o, "rejected")}
                    >
                      <X /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>Diamond Distribution History</h3>
          <DataTable
            headers={["Player ID", "Diamonds", "Type", "Date"]}
            rows={diamondHistory.map(h => [
              h.player_id,
              h.diamonds,
              h.distribution_type,
              new Date(h.distributed_at).toLocaleString()
            ])}
          />
        </div>
      </>
    );
  }

  function otherPage() {
    if (page === "Security & Reports Management") {
      return (
        <div className="panel">
          <h3>Security & Reports Management</h3>
          <p>Owner ID: <code>{OWNER_ID}</code></p>
          <p>Admin verification: Supabase Auth + is_admin() + RLS</p>
          <p>Moderator ও Vice-কে Admin access দেওয়া হয়নি।</p>
        </div>
      );
    }

    if (
      page === "Chat & Support Management" ||
      page === "Notification Management"
    ) {
      return (
        <div className="panel">
          <h3>{page}</h3>
          <p>এখানে Chat ও Notification-এর প্রাথমিক পেজ রাখা হয়েছে।</p>
          <p className="muted">
            Player App এবং message delivery backend সংযোগ না হওয়া পর্যন্ত
            মেসেজ পাঠানো বা Notification পৌঁছানো চালু হবে না।
          </p>
        </div>
      );
    }

    return (
      <div className="panel">
        <h3>{page}</h3>
        <p>এই বিভাগের প্রাথমিক পেজ তৈরি হয়েছে।</p>
        <p className="muted">
          বাস্তব গেমের তথ্য ও API সংযোগের পর এই মডিউলের কাজ চালু হবে।
        </p>
      </div>
    );
  }

  let content;

  if (page === "Game Dashboard") {
    content = dashboard();
  } else if (page === "Player Management") {
    content = playerPage();
  } else if (
    page === "Diamond & Coin Management" ||
    page === "Diamond Send Management"
  ) {
    content = rewardPage();
  } else {
    content = otherPage();
  }

  return (
    <div className="layout">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <div className="brand">
          <Gamepad2 />
          <div>
            <b>BD GAME</b>
            <small>ADMIN PANEL</small>
          </div>
          <button
            className="icon-btn mobile-close"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>

        <div className="nav-caption">MANAGEMENT</div>

        <nav>
          {MODULES.map(([name, Icon], i) => (
            <button
              key={name}
              className={`nav-item ${page === name ? "selected" : ""}`}
              onClick={() => {
                setPage(name);
                setMobile(false);
              }}
            >
              <Icon size={17} />
              <span>{name}</span>
              <small>{String(i + 1).padStart(2, "0")}</small>
            </button>
          ))}
        </nav>

        <button className="logout" onClick={logout}>
          <LogOut size={17} /> Logout
        </button>
      </aside>

      <main className="main">
        <header className="top">
          <button
            className="icon-btn mobile-open"
            onClick={() => setMobile(true)}
          >
            <Menu />
          </button>

          <div>
            <h2>{page}</h2>
            <small>BD GAME ADMIN / {page}</small>
          </div>

          <div className="owner">
            <Crown size={17} /> OWNER ADMIN
          </div>

          <button
            className="icon-btn"
            onClick={loadData}
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>
        </header>

        {content}

        <footer>
          BD GAME ADMIN © 2026 · Private Admin Console
        </footer>
      </main>

      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      <div>{icon}</div>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function DataTable({ headers, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map(h => <th key={h}>{h}</th>)}
          </tr>
        </thead>

        <tbody>
          {rows.length ? rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => <td key={j}>{c}</td>)}
            </tr>
          )) : (
            <tr>
              <td colSpan={headers.length}>
                কোনো তথ্য পাওয়া যায়নি
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
