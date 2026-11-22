
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Farm3D from "./Farm3D";

import {
  Leaf, Droplets, Thermometer, Wind, CloudRain, Activity,
  Sprout, RefreshCw, MapPin, Gauge, AlertCircle, CheckCircle2,
  LayoutDashboard, Mountain, BarChart3, Bell, Clock, Database,
  ChevronRight,
} from "lucide-react";

import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";

const API = "http://127.0.0.1:8013";

const theme = {
  bg: "#07130f",
  sidebar: "#0b1b14",
  panel: "#10221a",
  panel2: "#142a20",
  border: "#234333",
  green: "#43d98b",
  muted: "#91a99a",
  text: "#e8f5ed",
  red: "#ff7777",
  orange: "#ffbd69",
};

const zones = [
  { id: 1, name: "North Plantation" },
  { id: 2, name: "South Plantation" },
  { id: 3, name: "East Plantation" },
  { id: 4, name: "West Plantation" },
];

const cardStyle = {
  background: theme.panel,
  border: `1px solid ${theme.border}`,
  borderRadius: 15,
  padding: 18,
};

const formatNumber = (value) =>
  Number.isFinite(Number(value)) ? Number(value).toFixed(1) : "--";

async function fetchJSON(path) {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${path} (${response.status})`);
  }
  return response.json();
}

function SectionTitle({ icon: Icon, children, right }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "center", gap: 12, flexWrap: "wrap",
      marginBottom: 16,
    }}>
      <h2 style={{
        fontSize: 19, color: theme.text, margin: 0,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        {Icon && <Icon size={20} color={theme.green} />}
        {children}
      </h2>
      {right}
    </div>
  );
}

function MetricCard({ title, value, unit, icon: Icon, description }) {
  return (
    <div style={cardStyle}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ color: theme.muted, fontSize: 13 }}>{title}</span>
        <Icon size={21} color={theme.green} />
      </div>
      <div style={{
        fontSize: 29, fontWeight: 750,
        marginTop: 14, color: theme.text,
      }}>
        {value}
        <span style={{
          fontSize: 14, color: theme.muted, marginLeft: 4,
        }}>{unit}</span>
      </div>
      <div style={{
        color: theme.muted, fontSize: 11, marginTop: 8,
      }}>{description}</div>
    </div>
  );
}

function HistoryChart({ title, data, dataKey, color, area = false, height = 240 }) {
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{
        color: theme.text, fontSize: 14, fontWeight: 700,
        marginBottom: 12,
      }}>{title}</div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          {area ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="moistureFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#294638" />
              <XAxis dataKey="time" stroke={theme.muted} tick={{ fontSize: 10 }} minTickGap={25} />
              <YAxis stroke={theme.muted} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{
                background: "#10221a", border: `1px solid ${theme.border}`,
                borderRadius: 8, color: theme.text,
              }} />
              <Area
                type="monotone" dataKey={dataKey} stroke={color}
                strokeWidth={2} fill="url(#moistureFill)" name={title}
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#294638" />
              <XAxis dataKey="time" stroke={theme.muted} tick={{ fontSize: 10 }} minTickGap={25} />
              <YAxis stroke={theme.muted} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{
                background: "#10221a", border: `1px solid ${theme.border}`,
                borderRadius: 8, color: theme.text,
              }} />
              <Line
                type="monotone" dataKey={dataKey} stroke={color}
                strokeWidth={2} dot={false} name={title}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function App() {
  const [farm, setFarm] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [alertHistoryLoading, setAlertHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [selectedZone, setSelectedZone] = useState(1);

  const loadFarmData = useCallback(async () => {
    try {
      const [farmData, sensorData, alertsData] = await Promise.all([
        fetchJSON("/api/farm/overview"),
        fetchJSON("/api/sensors"),
        fetchJSON("/api/alerts"),
      ]);

      setFarm(farmData);
      setSensors(Array.isArray(sensorData.sensor_readings) ? sensorData.sensor_readings : []);
      setAlerts(Array.isArray(alertsData.alerts) ? alertsData.alerts : []);
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      console.error("Farm data error:", err);
      setError("Unable to connect to the backend. Check FastAPI on port 8013.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      const data = await fetchJSON(`/api/history/${selectedZone}`);
      const records = Array.isArray(data.history) ? data.history : [];

      setHistory(records);
      setHistoryCount(data.total_records ?? records.length);
    } catch (err) {
      console.error("History error:", err);
      setHistory([]);
      setHistoryCount(0);
      setHistoryError("Could not load historical records. Check the history API.");
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedZone]);

  const loadAlertHistory = useCallback(async () => {
    try {
      setAlertHistoryLoading(true);
      const data = await fetchJSON("/api/alert-history?limit=100");
      setAlertHistory(Array.isArray(data.history) ? data.history : []);
    } catch (err) {
      console.error("Alert history error:", err);
    } finally {
      setAlertHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFarmData();
    loadAlertHistory();

    const timer = setInterval(() => {
      loadFarmData();
      loadAlertHistory();
    }, 10000);

    return () => clearInterval(timer);
  }, [loadFarmData, loadAlertHistory]);

  useEffect(() => {
    loadHistory();
    const timer = setInterval(loadHistory, 30000);
    return () => clearInterval(timer);
  }, [loadHistory]);

  const selected = sensors.find(
    (item) => Number(item.zone_id) === Number(selectedZone)
  );

  const average = (key) => {
    if (!sensors.length) return 0;
    return sensors.reduce((sum, item) => sum + Number(item[key] || 0), 0) / sensors.length;
  };

  const moisture = average("soil_moisture");
  const temperature = average("temperature");
  const humidity = average("humidity");
  const rainfall = average("rainfall");
  const soilPH = average("soil_ph");

  const chartData = useMemo(() => sensors.map((zone) => ({
    name: String(zone.zone_name || `Zone ${zone.zone_id}`).replace(" Plantation", ""),
    moisture: Number(zone.soil_moisture),
  })), [sensors]);

  const historyChartData = useMemo(() => history.map((record) => ({
    time: new Date(record.timestamp).toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }),
    moisture: Number(record.soil_moisture),
    temperature: Number(record.temperature),
    humidity: Number(record.humidity),
    ph: Number(record.soil_ph),
    rainfall: Number(record.rainfall),
  })), [history]);

  const criticalAlerts = alerts.filter((alert) => alert.severity === "critical").length;
  const warningAlerts = alerts.filter((alert) => alert.severity === "warning").length;

  const selectedZoneName =
    selected?.zone_name ||
    zones.find((zone) => zone.id === selectedZone)?.name ||
    `Zone ${selectedZone}`;

  const lastUpdatedText = lastUpdated
    ? lastUpdated.toLocaleTimeString()
    : "Waiting for data";

  const refreshAll = () => {
    loadFarmData();
    loadHistory();
    loadAlertHistory();
  };

  return (
    <div style={{
      minHeight: "100vh", background: theme.bg, color: theme.text,
      fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
    }}>
      <aside style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 245,
        background: theme.sidebar, borderRight: `1px solid ${theme.border}`,
        padding: 22, display: "flex", flexDirection: "column",
        zIndex: 10, boxSizing: "border-box",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 11, marginBottom: 35,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "#183b29", display: "grid", placeItems: "center",
          }}>
            <Leaf color={theme.green} size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 19 }}>AgriTwin AI</div>
            <div style={{
              color: theme.muted, fontSize: 10, letterSpacing: 1,
            }}>FARM INTELLIGENCE</div>
          </div>
        </div>

        <div style={{
          color: theme.muted, fontSize: 10, fontWeight: 700,
          letterSpacing: 1.4, marginBottom: 12,
        }}>WORKSPACE</div>

        {[
          { label: "Overview", icon: LayoutDashboard },
          { label: "Farm Digital Twin", icon: Mountain },
          { label: "Plantation Zones", icon: Sprout },
          { label: "Sensor Analytics", icon: BarChart3 },
          { label: "Farm Alerts", icon: Bell },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 13px", marginBottom: 6, borderRadius: 10,
              background: index === 0 ? "#173c29" : "transparent",
              color: index === 0 ? theme.green : theme.muted, fontSize: 13,
            }}>
              <Icon size={18} /> {item.label}
            </div>
          );
        })}

        <div style={{ flex: 1 }} />

        <div style={{
          background: "#10271b", border: `1px solid ${theme.border}`,
          padding: 14, borderRadius: 12,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 12, color: error ? theme.red : theme.green,
          }}>
            {error ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            {error ? "Backend disconnected" : "System operational"}
          </div>
          <div style={{ color: theme.muted, fontSize: 10, marginTop: 7 }}>
            API: localhost:8013
          </div>
        </div>
      </aside>

      <main style={{
        marginLeft: 245, padding: "28px 30px",
        maxWidth: 1700, boxSizing: "border-box",
      }}>
        <header style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 28,
        }}>
          <div>
            <div style={{
              color: theme.muted, fontSize: 12, marginBottom: 7,
            }}>AGRICULTURE INTELLIGENCE PLATFORM / OVERVIEW</div>
            <h1 style={{ fontSize: 27, margin: 0, fontWeight: 800 }}>
              Farm Command Center
            </h1>
            <p style={{ color: theme.muted, fontSize: 13, marginTop: 8 }}>
              Monitor plantation conditions and sensor activity.
            </p>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          }}>
            <div style={{
              background: theme.panel, border: `1px solid ${theme.border}`,
              borderRadius: 10, padding: "10px 13px",
              display: "flex", alignItems: "center", gap: 8, fontSize: 12,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: error ? theme.red : theme.green,
              }} />
              {error ? "Offline" : "Online"}
            </div>
            <button onClick={refreshAll} style={{
              background: "#173b29", border: `1px solid ${theme.green}`,
              color: theme.green, borderRadius: 10, padding: "11px 15px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            }}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </header>

        {error && <div style={{
          background: "#3a1d1d", border: "1px solid #8d4141",
          color: "#ffaaaa", borderRadius: 10, padding: 14,
          marginBottom: 20, fontSize: 13,
        }}>{error}</div>}

        <section style={{
          ...cardStyle, marginBottom: 22, display: "flex",
          justifyContent: "space-between", gap: 15, flexWrap: "wrap",
        }}>
          <div>
            <div style={{
              color: theme.muted, fontSize: 11, letterSpacing: 1, marginBottom: 8,
            }}>CURRENT FARM</div>
            <h2 style={{ fontSize: 21, margin: 0 }}>
              {farm?.farm_name || "AgriTwin Demonstration Farm"}
            </h2>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              color: theme.muted, fontSize: 12, marginTop: 9,
            }}>
              <MapPin size={14} /> Idukki, Kerala
            </div>
          </div>

          <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: theme.muted, fontSize: 11 }}>CROP</div>
              <div style={{ fontWeight: 700, marginTop: 7 }}>
                {farm?.crop || "Small Cardamom"}
              </div>
            </div>
            <div>
              <div style={{ color: theme.muted, fontSize: 11 }}>ZONES</div>
              <div style={{ fontWeight: 700, marginTop: 7 }}>
                {farm?.total_zones || 4}
              </div>
            </div>
            <div>
              <div style={{ color: theme.muted, fontSize: 11 }}>DATA MODE</div>
              <div style={{
                fontWeight: 700, marginTop: 7, color: theme.orange,
              }}>Simulated</div>
            </div>
          </div>
        </section>

        <SectionTitle icon={Activity}>Farm Environmental Overview</SectionTitle>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))",
          gap: 14, marginBottom: 27,
        }}>
          <MetricCard title="Average Soil Moisture" value={sensors.length ? formatNumber(moisture) : "--"} unit="%" icon={Droplets} description="Across all plantation zones" />
          <MetricCard title="Average Temperature" value={sensors.length ? formatNumber(temperature) : "--"} unit="°C" icon={Thermometer} description="Current zone average" />
          <MetricCard title="Average Humidity" value={sensors.length ? formatNumber(humidity) : "--"} unit="%" icon={Wind} description="Atmospheric humidity" />
          <MetricCard title="Average Rainfall" value={sensors.length ? formatNumber(rainfall) : "--"} unit="mm" icon={CloudRain} description="Simulated sensor reading" />
          <MetricCard title="Average Soil pH" value={sensors.length ? formatNumber(soilPH) : "--"} unit="" icon={Gauge} description="Soil acidity indicator" />
        </div>

        <SectionTitle icon={Sprout} right={
          <span style={{ color: theme.muted, fontSize: 11, fontWeight: 400 }}>
            Select a zone to inspect its readings
          </span>
        }>Plantation Zones</SectionTitle>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 13, marginBottom: 28,
        }}>
          {zones.map((zone) => {
            const reading = sensors.find((item) => Number(item.zone_id) === zone.id);
            const active = selectedZone === zone.id;
            return (
              <button key={zone.id} onClick={() => setSelectedZone(zone.id)} style={{
                textAlign: "left", background: active ? "#173c29" : theme.panel,
                border: `1px solid ${active ? theme.green : theme.border}`,
                borderRadius: 13, padding: 16, color: theme.text, cursor: "pointer",
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <Sprout size={20} color={active ? theme.green : theme.muted} />
                  {active && <CheckCircle2 size={17} color={theme.green} />}
                </div>
                <div style={{ fontWeight: 700, marginTop: 13, fontSize: 14 }}>
                  {zone.name}
                </div>
                <div style={{ color: theme.muted, fontSize: 11, marginTop: 8 }}>
                  {reading ? `Moisture: ${formatNumber(reading.soil_moisture)}%` : "Waiting for readings"}
                </div>
                <div style={{ color: theme.muted, fontSize: 11, marginTop: 4 }}>
                  {reading ? `Temperature: ${formatNumber(reading.temperature)}°C` : "No sensor data"}
                </div>
              </button>
            );
          })}
        </div>

        <section style={{ ...cardStyle, marginBottom: 25 }}>
          <SectionTitle icon={Mountain} right={
            <span style={{ fontSize: 11, color: theme.green, fontWeight: 400 }}>
              Selected: {selectedZoneName}
            </span>
          }>3D Farm Digital Twin</SectionTitle>
          <div style={{
            background: "#091710", borderRadius: 12, overflow: "hidden",
            minHeight: 350,
          }}>
            <Farm3D selectedZone={selectedZone} onZoneSelect={setSelectedZone} />
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: 25 }}>
          <SectionTitle icon={Activity} right={
            <span style={{ fontSize: 11, color: theme.green, fontWeight: 400 }}>
              Zone {selectedZone}
            </span>
          }>Selected Zone Intelligence</SectionTitle>

          <div style={{
            color: theme.green, fontWeight: 700, fontSize: 19, marginBottom: 18,
          }}>{selectedZoneName}</div>

          {!selected ? (
            <p style={{ color: theme.muted }}>Waiting for sensor data...</p>
          ) : (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12,
            }}>
              {[
                { label: "Soil Moisture", value: selected.soil_moisture, unit: "%", icon: Droplets },
                { label: "Temperature", value: selected.temperature, unit: "°C", icon: Thermometer },
                { label: "Humidity", value: selected.humidity, unit: "%", icon: Wind },
                { label: "Soil pH", value: selected.soil_ph, unit: "", icon: Gauge },
                { label: "Rainfall", value: selected.rainfall, unit: " mm", icon: CloudRain },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} style={{
                    background: theme.panel2, border: `1px solid ${theme.border}`,
                    borderRadius: 12, padding: 16,
                  }}>
                    <Icon size={21} color={theme.green} />
                    <div style={{ color: theme.muted, fontSize: 12, marginTop: 12 }}>
                      {item.label}
                    </div>
                    <div style={{
                      color: theme.text, fontSize: 23, fontWeight: 750, marginTop: 5,
                    }}>
                      {formatNumber(item.value)}
                      <span style={{ fontSize: 13, color: theme.muted }}>{item.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p style={{ color: theme.muted, fontSize: 11, marginTop: 17 }}>
            Demonstration readings are simulated, not real farm measurements.
          </p>
        </section>

        <section style={{ ...cardStyle, marginBottom: 25 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 10,
          }}>
            <SectionTitle icon={Database}>Sensor History & Analytics</SectionTitle>
            <button onClick={loadHistory} disabled={historyLoading} style={{
              background: "#173b29", border: `1px solid ${theme.green}`,
              color: theme.green, borderRadius: 9, padding: "9px 13px",
              cursor: "pointer",
            }}>
              <RefreshCw size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
              {historyLoading ? "Loading..." : "Refresh History"}
            </button>
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18,
          }}>
            <div style={{ color: theme.muted, fontSize: 12 }}>
              Historical records for <strong style={{ color: theme.green }}>{selectedZoneName}</strong>
            </div>
            <div style={{ color: theme.muted, fontSize: 12 }}>
              Records returned: <strong style={{ color: theme.text }}>{historyCount}</strong>
            </div>
          </div>

          {historyError && <div style={{
            background: "#3a1d1d", border: "1px solid #8d4141",
            color: "#ffaaaa", padding: 12, borderRadius: 9,
            marginBottom: 15, fontSize: 12,
          }}>{historyError}</div>}

          {historyLoading && history.length === 0 ? (
            <div style={{ color: theme.muted, textAlign: "center", padding: 35 }}>
              Loading historical sensor records...
            </div>
          ) : historyChartData.length === 0 ? (
            <div style={{ color: theme.muted, textAlign: "center", padding: 35 }}>
              No historical records available for this zone.
            </div>
          ) : (
            <>
              <HistoryChart title="Soil Moisture History (%)" data={historyChartData} dataKey="moisture" color={theme.green} area height={270} />
              <HistoryChart title="Temperature History (°C)" data={historyChartData} dataKey="temperature" color="#ffbd69" />
              <HistoryChart title="Humidity History (%)" data={historyChartData} dataKey="humidity" color="#70b7ff" />
              <HistoryChart title="Soil pH History" data={historyChartData} dataKey="ph" color="#c084fc" />
              <HistoryChart title="Rainfall History (mm)" data={historyChartData} dataKey="rainfall" color="#70b7ff" />

              <div style={{
                color: theme.text, fontSize: 14, fontWeight: 700,
                margin: "25px 0 12px",
              }}>Recent Historical Records</div>

              <div style={{
                overflowX: "auto", border: `1px solid ${theme.border}`, borderRadius: 10,
              }}>
                <table style={{
                  width: "100%", borderCollapse: "collapse",
                  minWidth: 650, fontSize: 12,
                }}>
                  <thead>
                    <tr style={{ background: theme.panel2, color: theme.muted }}>
                      {["Time", "Moisture", "Temperature", "Humidity", "pH", "Rainfall"].map((heading) => (
                        <th key={heading} style={{ padding: 12, textAlign: "left" }}>{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...history].reverse().slice(0, 10).map((record, index) => (
                      <tr key={record.id ?? `${record.timestamp}-${index}`} style={{
                        borderTop: `1px solid ${theme.border}`,
                      }}>
                        <td style={{ padding: 12 }}>{new Date(record.timestamp).toLocaleString()}</td>
                        <td style={{ padding: 12 }}>{formatNumber(record.soil_moisture)}%</td>
                        <td style={{ padding: 12 }}>{formatNumber(record.temperature)}°C</td>
                        <td style={{ padding: 12 }}>{formatNumber(record.humidity)}%</td>
                        <td style={{ padding: 12 }}>{formatNumber(record.soil_ph)}</td>
                        <td style={{ padding: 12 }}>{formatNumber(record.rainfall)} mm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ color: theme.muted, fontSize: 11, marginTop: 12 }}>
                Historical data is retrieved from the AgriTwin SQLite database. Demonstration readings are simulated.
              </p>
            </>
          )}
        </section>

        <section style={{ ...cardStyle, marginBottom: 25 }}>
          <SectionTitle icon={BarChart3}>Live Plantation Comparison</SectionTitle>
          {!sensors.length ? (
            <p style={{ color: theme.muted }}>Waiting for sensor readings...</p>
          ) : (
            <>
              <div style={{ color: theme.text, fontSize: 13, marginBottom: 12 }}>
                Soil moisture by plantation zone
              </div>
              <div style={{ width: "100%", height: 270 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#294638" />
                    <XAxis dataKey="name" stroke={theme.muted} />
                    <YAxis stroke={theme.muted} />
                    <Tooltip contentStyle={{
                      background: "#10221a", border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                    }} />
                    <Bar dataKey="moisture" fill={theme.green} radius={[5, 5, 0, 0]} name="Soil Moisture (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </section>

        <section style={{ ...cardStyle, marginBottom: 25 }}>
          <SectionTitle icon={Bell} right={
            <span style={{
              background: alerts.length ? "#633b1e" : "#183a29",
              color: alerts.length ? theme.orange : theme.green,
              borderRadius: 20, padding: "6px 12px", fontSize: 11,
            }}>{alerts.length} Active Alerts</span>
          }>Farm Intelligence Alerts</SectionTitle>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12, marginBottom: 18,
          }}>
            <div style={{
              background: "rgba(239, 68, 68, 0.10)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: 12, padding: 16,
            }}>
              <div style={{ color: "#f87171", fontSize: 12 }}>Critical Alerts</div>
              <div style={{ color: "#f87171", fontSize: 28, fontWeight: 800 }}>
                {criticalAlerts}
              </div>
            </div>
            <div style={{
              background: "rgba(245, 158, 11, 0.10)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              borderRadius: 12, padding: 16,
            }}>
              <div style={{ color: "#fbbf24", fontSize: 12 }}>Warning Alerts</div>
              <div style={{ color: "#fbbf24", fontSize: 28, fontWeight: 800 }}>
                {warningAlerts}
              </div>
            </div>
          </div>

          {alerts.length === 0 ? (
            <div style={{ color: theme.green, padding: 15, textAlign: "center" }}>
              <CheckCircle2 size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />
              No demonstration alerts detected.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {alerts.map((alert, index) => (
                <button key={`${alert.zone_id}-${alert.type || "alert"}-${index}`}
                  onClick={() => setSelectedZone(Number(alert.zone_id))}
                  style={{
                    background: "#251d13", border: "1px solid #624321",
                    color: theme.text, borderRadius: 10, padding: 14,
                    textAlign: "left", cursor: "pointer",
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", gap: 10,
                  }}>
                  <div>
                    <div style={{
                      display: "inline-block", padding: "4px 8px",
                      borderRadius: 5, marginBottom: 8, fontSize: 10,
                      fontWeight: 800, letterSpacing: 0.5,
                      color: alert.severity === "critical" ? "#f87171" : "#fbbf24",
                      background: alert.severity === "critical"
                        ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    }}>{(alert.severity || "warning").toUpperCase()}</div>
                    <div style={{ color: theme.orange, fontWeight: 700, fontSize: 13 }}>
                      {alert.title || alert.type || "Farm Alert"}
                    </div>
                    <div style={{ color: theme.muted, fontSize: 12, marginTop: 5 }}>
                      {alert.message || alert.description || "Demonstration alert"}
                    </div>
                    <div style={{ color: theme.muted, fontSize: 10, marginTop: 6 }}>
                      {alert.zone_name || `Zone ${alert.zone_id}`}
                    </div>
                  </div>
                  <ChevronRight size={17} color={theme.orange} />
                </button>
              ))}
            </div>
          )}

          <div style={{ marginTop: 28 }}>
            <SectionTitle icon={Clock} right={
              <span style={{ color: theme.muted, fontSize: 11 }}>
                {alertHistory.length} Records
              </span>
            }>Alert History</SectionTitle>

            <div style={{
              border: `1px solid ${theme.border}`, borderRadius: 12,
              padding: 16, overflowX: "auto",
            }}>
              {alertHistoryLoading ? (
                <div style={{ color: theme.muted }}>Loading alert history...</div>
              ) : alertHistory.length === 0 ? (
                <div style={{ color: theme.muted }}>No historical alerts available.</div>
              ) : (
                <table style={{
                  width: "100%", borderCollapse: "collapse",
                  textAlign: "left", fontSize: 12, minWidth: 550,
                }}>
                  <thead>
                    <tr style={{ color: theme.muted }}>
                      <th style={{ padding: 10 }}>Zone</th>
                      <th style={{ padding: 10 }}>Alert</th>
                      <th style={{ padding: 10 }}>Severity</th>
                      <th style={{ padding: 10 }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertHistory.map((alert, index) => (
                      <tr key={alert.id ?? `${alert.timestamp}-${index}`} style={{
                        borderTop: `1px solid ${theme.border}`, color: theme.text,
                      }}>
                        <td style={{ padding: 10 }}>{alert.zone_name}</td>
                        <td style={{ padding: 10 }}>{alert.title}</td>
                        <td style={{
                          padding: 10, fontWeight: 700,
                          color: alert.severity === "critical" ? "#f87171" : "#fbbf24",
                        }}>{(alert.severity || "warning").toUpperCase()}</td>
                        <td style={{ padding: 10, color: theme.muted }}>
                          {new Date(alert.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>

        <footer style={{
          borderTop: `1px solid ${theme.border}`, padding: "20px 0",
          display: "flex", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12, color: theme.muted, fontSize: 11,
        }}>
          <span>AgriTwin AI · Smart Cardamom Farming Digital Twin</span>
          <span>
            <Clock size={12} style={{ verticalAlign: "middle", marginRight: 5 }} />
            Last updated: {lastUpdatedText}
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;
