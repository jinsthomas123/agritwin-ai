
import React, { useEffect, useState } from "react";
import Farm3D from "./Farm3D";
import {
  Leaf,
  Droplets,
  Thermometer,
  Wind,
  CloudRain,
  Activity,
  Sprout,
  RefreshCw,
  MapPin,
  Gauge,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const API = "http://127.0.0.1:8012";

const theme = {
  bg: "#07130f",
  panel: "#10221a",
  panel2: "#142a20",
  border: "#234333",
  green: "#43d98b",
  muted: "#91a99a",
  text: "#e8f5ed",
};

function App() {
  const [farm, setFarm] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedZone, setSelectedZone] = useState(1);

  async function loadFarmData() {
    try {
      setError("");

    const [farmResponse, sensorResponse, alertsResponse] = await Promise.all([
  fetch(`${API}/api/farm/overview`),
  fetch(`${API}/api/sensors`),
  fetch(`${API}/api/alerts`),
]);  

      if (!farmResponse.ok || !sensorResponse.ok || !alertsResponse.ok) {
        throw new Error("Backend returned an error.");
      }

const farmData = await farmResponse.json();
const sensorData = await sensorResponse.json();
const alertsData = await alertsResponse.json();

setFarm(farmData);
setSensors(sensorData.sensor_readings || []);
setAlerts(alertsData.alerts || []);
setLastUpdated(new Date()); 
    } catch (err) {
      setError(
        "Unable to connect to the backend. Check that FastAPI is running on port 8012."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFarmData();

    const interval = setInterval(loadFarmData, 10000);

    return () => clearInterval(interval);
  }, []);

  const selected = sensors.find(
    (item) => item.zone_id === selectedZone
  );

  const average = (key) => {
    if (!sensors.length) return 0;

    return (
      sensors.reduce((sum, item) => sum + Number(item[key] || 0), 0) /
      sensors.length
    );
  };

  const moisture = average("soil_moisture");
  const temperature = average("temperature");
  const humidity = average("humidity");
  const rainfall = average("rainfall");

  const chartData = sensors.map((zone) => ({
    name: zone.zone_name.replace(" Plantation", ""),
    moisture: zone.soil_moisture,
    temperature: zone.temperature,
    humidity: zone.humidity,
  }));

  const cardStyle = {
    background: theme.panel,
    border: `1px solid ${theme.border}`,
    borderRadius: 15,
    padding: 19,
  };

  const labelStyle = {
    color: theme.muted,
    fontSize: 12,
  };

  function MetricCard({ icon: Icon, title, value, unit, color, subtitle }) {
    return (
      <div style={cardStyle}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={labelStyle}>{title}</span>
          <Icon size={20} color={color} />
        </div>

        <div style={{
          fontSize: 29,
          fontWeight: 700,
          marginTop: 18,
          color: theme.text,
        }}>
          {loading ? "--" : value}
          <span style={{ fontSize: 14, color: theme.muted }}>
            {unit}
          </span>
        </div>

        <div style={{
          color: theme.muted,
          fontSize: 11,
          marginTop: 8,
        }}>
          {subtitle}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.bg,
      color: theme.text,
      fontFamily: "Inter, Segoe UI, sans-serif",
      padding: "25px",
      boxSizing: "border-box",
    }}>

      {/* HEADER */}

      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 15,
        marginBottom: 28,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{
            background: "#174c32",
            padding: 12,
            borderRadius: 13,
          }}>
            <Leaf color={theme.green} size={29} />
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: 25 }}>
              AgriTwin <span style={{ color: theme.green }}>AI</span>
            </h1>
            <div style={{ color: theme.muted, fontSize: 12 }}>
              Smart Cardamom Plantation Intelligence
            </div>
          </div>
        </div>

        <button
          onClick={loadFarmData}
          style={{
            background: theme.panel2,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 9,
            padding: "11px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <RefreshCw size={15} />
          Refresh Data
        </button>
      </header>

      {/* FARM INFORMATION */}

      <section style={{
        ...cardStyle,
        marginBottom: 22,
        background: "linear-gradient(110deg,#123b29,#10221a)",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20,
        }}>
          <div>
            <div style={{
              color: theme.green,
              fontSize: 11,
              letterSpacing: 2,
              fontWeight: 700,
            }}>
              FARM OVERVIEW
            </div>

            <h2 style={{ margin: "10px 0", fontSize: 23 }}>
              {farm?.farm_name || "AgriTwin Demonstration Farm"}
            </h2>

            <div style={{
              display: "flex",
              gap: 7,
              alignItems: "center",
              color: theme.muted,
              fontSize: 13,
            }}>
              <MapPin size={15} />
              {farm?.location || "Idukki, Kerala"}
            </div>

            <p style={{
              color: theme.muted,
              fontSize: 13,
              marginTop: 12,
            }}>
              Crop: Small Cardamom (Elettaria cardamomum)
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{
              color: theme.green,
              fontWeight: 700,
              fontSize: 13,
            }}>
              <Activity size={15} style={{
                verticalAlign: "middle",
                marginRight: 6,
              }} />
              BACKEND CONNECTIVITY
            </div>

            <div style={{
              marginTop: 12,
              fontSize: 17,
              fontWeight: 700,
            }}>
              {error ? "Disconnected" : loading ? "Connecting..." : "Online"}
            </div>

            <div style={{ color: theme.muted, fontSize: 11 }}>
              {sensors.length} of 4 zones reporting
            </div>
          </div>
        </div>
      </section>

      {/* ERROR MESSAGE */}

      {error && (
        <div style={{
          ...cardStyle,
          borderColor: "#a84c4c",
          color: "#ffaaaa",
          marginBottom: 20,
        }}>
          <AlertCircle size={18} style={{
            verticalAlign: "middle",
            marginRight: 8,
          }} />
          {error}
        </div>
      )}

      {/* METRIC CARDS */}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
        gap: 15,
        marginBottom: 23,
      }}>
        <MetricCard
          icon={Droplets}
          title="Average Soil Moisture"
          value={moisture.toFixed(1)}
          unit="%"
          color="#49bfff"
          subtitle="Across four plantation zones"
        />

        <MetricCard
          icon={Thermometer}
          title="Average Temperature"
          value={temperature.toFixed(1)}
          unit="°C"
          color="#ffad65"
          subtitle="Farm temperature"
        />

        <MetricCard
          icon={Wind}
          title="Average Humidity"
          value={humidity.toFixed(1)}
          unit="%"
          color="#9eafff"
          subtitle="Atmospheric humidity"
        />

        <MetricCard
          icon={CloudRain}
          title="Average Rainfall"
          value={rainfall.toFixed(1)}
          unit=" mm"
          color="#49bfff"
          subtitle="Simulated zone readings"
        />
      </div>

      {/* ZONE MONITORING */}

      <section style={{ marginBottom: 23 }}>
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>
          <Sprout size={19} color={theme.green}
            style={{ verticalAlign: "middle", marginRight: 8 }} />
          Plantation Zone Monitoring
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 14,
        }}>
          {sensors.map((zone) => (
            <div
              key={zone.zone_id}
              onClick={() => setSelectedZone(zone.zone_id)}
              style={{
                ...cardStyle,
                cursor: "pointer",
                background: selectedZone === zone.zone_id
                  ? "#183a29"
                  : theme.panel,
                borderColor: selectedZone === zone.zone_id
                  ? theme.green
                  : theme.border,
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
              }}>
                <strong>{zone.zone_name}</strong>
                <Sprout color={theme.green} size={19} />
              </div>

              <div style={{
                fontSize: 12,
                color: theme.muted,
                marginTop: 7,
              }}>
                Zone {zone.zone_id}
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={labelStyle}>Soil moisture</div>
                <div style={{
                  fontSize: 23,
                  fontWeight: 700,
                  marginTop: 5,
                }}>
                  {zone.soil_moisture}%
                </div>

                <div style={{
                  height: 6,
                  background: "#263c30",
                  borderRadius: 8,
                  marginTop: 9,
                  overflow: "hidden",
                }}>
                  <div style={{
                    width: `${Math.min(100, Math.max(0, zone.soil_moisture))}%`,
                    height: "100%",
                    background: "#43d98b",
                  }} />
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 17,
              }}>
                <div>
                  <div style={labelStyle}>Temperature</div>
                  <strong>{zone.temperature}°C</strong>
                </div>
                <div>
                  <div style={labelStyle}>Humidity</div>
                  <strong>{zone.humidity}%</strong>
                </div>
                <div>
                  <div style={labelStyle}>Soil pH</div>
                  <strong>{zone.soil_ph}</strong>
                </div>
                <div>
                  <div style={labelStyle}>Rainfall</div>
                  <strong>{zone.rainfall} mm</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
{/* 3D CARDAMOM FARM DIGITAL TWIN */}

<section style={{ marginBottom: 25 }}>
  <h2 style={{ fontSize: 19, marginBottom: 15 }}>
    🌱 3D Cardamom Plantation Digital Twin
  </h2>

  <div style={{
    background: "#10221a",
    padding: 15,
    borderRadius: 15,
    border: "1px solid #234333"
  }}>
    <Farm3D
  selectedZone={selectedZone}
  onZoneSelect={setSelectedZone}
/>
    <p style={{
      color: "#91a99a",
      fontSize: 12,
      marginTop: 12
    }}>
      Explore the virtual plantation using your mouse.
      Drag to rotate and scroll to zoom.
    </p>
  </div>
</section>

{/* SELECTED ZONE INTELLIGENCE PANEL */}
<section style={{ marginBottom: 25 }}>
  <h2 style={{
    fontSize: 19,
    marginBottom: 15,
    color: theme.text
  }}>
    🌱 Selected Zone Intelligence
  </h2>

  <div style={{
    background: theme.panel,
    border: `1px solid ${theme.green}`,
    borderRadius: 15,
    padding: 20
  }}>
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18,
      flexWrap: "wrap",
      gap: 10
    }}>
      <div>
        <div style={{
          color: theme.muted,
          fontSize: 12
        }}>
          CURRENTLY SELECTED
        </div>

        <h3 style={{
          margin: "5px 0",
          color: theme.green,
          fontSize: 22
        }}>
          {selected?.zone_name || `Zone ${selectedZone}`}
        </h3>
      </div>

      <div style={{
        background: "#183a29",
        color: "#75e5a4",
        padding: "8px 13px",
        borderRadius: 20,
        fontSize: 12
      }}>
        Zone {selectedZone}
      </div>
    </div>

    {!selected ? (
      <p style={{ color: theme.muted }}>
        Waiting for sensor data...
      </p>
    ) : (
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
        gap: 12
      }}>
        {[
          {
            label: "Soil Moisture",
            value: selected.soil_moisture,
            unit: "%",
            icon: "💧"
          },
          {
            label: "Temperature",
            value: selected.temperature,
            unit: "°C",
            icon: "🌡️"
          },
          {
            label: "Humidity",
            value: selected.humidity,
            unit: "%",
            icon: "☁️"
          },
          {
            label: "Soil pH",
            value: selected.soil_ph,
            unit: "",
            icon: "🧪"
          },
          {
            label: "Rainfall",
            value: selected.rainfall,
            unit: " mm",
            icon: "🌧️"
          }
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: theme.background,
              border: `1px solid ${theme.border}`,
              padding: 15,
              borderRadius: 12
            }}
          >
            <div style={{
              fontSize: 20,
              marginBottom: 8
            }}>
              {item.icon}
            </div>

            <div style={{
              color: theme.muted,
              fontSize: 12
            }}>
              {item.label}
            </div>

            <div style={{
              color: theme.text,
              fontSize: 23,
              fontWeight: 700,
              marginTop: 5
            }}>
              {Number(item.value).toFixed(1)}
              {item.unit}
            </div>
          </div>
        ))}
      </div>
    )}

    <p style={{
      color: theme.muted,
      fontSize: 11,
      marginTop: 15
    }}>
      Demonstration sensor values are simulated, not real farm measurements.
    </p>
  </div>
</section>

{/* FARM ALERTS PANEL */}
<section style={{ marginBottom: 25 }}>
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15
  }}>
    <h2 style={{
      fontSize: 19,
      color: theme.text,
      margin: 0
    }}>
      🚨 Farm Intelligence Alerts
    </h2>

    <span style={{
      background: alerts.length > 0 ? "#633b1e" : "#183a29",
      color: alerts.length > 0 ? "#ffc078" : "#75e5a4",
      padding: "6px 12px",
      borderRadius: 20,
      fontSize: 12
    }}>
      {alerts.length} Active Alerts
    </span>
  </div>

  <div style={{
    background: theme.panel,
    border: `1px solid ${theme.border}`,
    borderRadius: 15,
    padding: 18
  }}>
    {alerts.length === 0 ? (
      <div style={{
        color: theme.green,
        padding: 15,
        textAlign: "center"
      }}>
        ✅ No demonstration alerts detected.
      </div>
    ) : (
      alerts.map((alert, index) => (
        <div
          key={`${alert.zone_id}-${alert.type}-${index}`}
          onClick={() => setSelectedZone(alert.zone_id)}
          style={{
            background: theme.background,
            border: `1px solid ${
              alert.severity === "WARNING"
                ? "#a66b35"
                : theme.border
            }`,
            borderRadius: 12,
            padding: 15,
            marginBottom: index === alerts.length - 1 ? 0 : 12,
            cursor: "pointer"
          }}
        >
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap"
          }}>
            <strong style={{ color: theme.text }}>
              {alert.zone_name}
            </strong>

            <span style={{
              color: alert.severity === "WARNING"
                ? "#ffc078"
                : "#75b9e8",
              fontSize: 11,
              fontWeight: 700
            }}>
              {alert.severity}
            </span>
          </div>

          <div style={{
            color: theme.green,
            fontSize: 13,
            marginTop: 9,
            fontWeight: 600
          }}>
            {alert.type.replaceAll("_", " ")}
          </div>

          <p style={{
            color: theme.muted,
            fontSize: 12,
            marginBottom: 0
          }}>
            {alert.message}
          </p>

          <div style={{
            color: theme.muted,
            fontSize: 10,
            marginTop: 10
          }}>
            Click to inspect this plantation zone →
          </div>
        </div>
      ))
    )}

    <p style={{
      color: theme.muted,
      fontSize: 10,
      marginTop: 14,
      marginBottom: 0
    }}>
      Alerts are generated from simulated sensor readings for demonstration.
      They are not validated agronomic recommendations or disease diagnoses.
    </p>
  </div>
</section>


      {/* CHARTS */}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))",
        gap: 18,
        marginBottom: 23,
      }}>
        <section style={cardStyle}>
          <h3 style={{ fontSize: 15, marginTop: 0 }}>
            Soil Moisture by Zone
          </h3>

          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid stroke="#294638" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke={theme.muted} />
                <YAxis stroke={theme.muted} />
                <Tooltip
                  contentStyle={{
                    background: "#10221a",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                  }}
                />
                <Bar
                  dataKey="moisture"
                  name="Soil moisture (%)"
                  fill="#43d98b"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section style={cardStyle}>
          <h3 style={{ fontSize: 15, marginTop: 0 }}>
            Temperature by Zone
          </h3>

          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="temperatureGradient"
                    x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffad65"
                      stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#ffad65"
                      stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="#294638" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke={theme.muted} />
                <YAxis stroke={theme.muted} />
                <Tooltip
                  contentStyle={{
                    background: "#10221a",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature (°C)"
                  stroke="#ffad65"
                  fill="url(#temperatureGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* SELECTED ZONE DETAILS */}

      <section style={{ ...cardStyle, marginBottom: 23 }}>
        <h3 style={{ marginTop: 0, fontSize: 16 }}>
          <Gauge size={18} color={theme.green}
            style={{ verticalAlign: "middle", marginRight: 8 }} />
          Selected Zone Details
        </h3>

        {selected ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
            gap: 15,
          }}>
            {[
              ["Zone", selected.zone_name],
              ["Moisture", `${selected.soil_moisture}%`],
              ["Temperature", `${selected.temperature}°C`],
              ["Humidity", `${selected.humidity}%`],
              ["Soil pH", selected.soil_ph],
              ["Rainfall", `${selected.rainfall} mm`],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={labelStyle}>{label}</div>
                <strong style={{
                  display: "block",
                  marginTop: 7,
                  fontSize: 16,
                }}>
                  {value}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: theme.muted }}>
            {loading ? "Loading zone readings..." : "Select a plantation zone."}
          </p>
        )}
      </section>

      {/* SYSTEM STATUS */}

      <section style={cardStyle}>
        <h3 style={{ fontSize: 16, marginTop: 0 }}>
          System Information
        </h3>

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 25,
          color: theme.muted,
          fontSize: 12,
        }}>
          <span>
            <CheckCircle2 size={14} color={theme.green}
              style={{ verticalAlign: "middle", marginRight: 6 }} />
            FastAPI backend
          </span>

          <span>
            <CheckCircle2 size={14} color={theme.green}
              style={{ verticalAlign: "middle", marginRight: 6 }} />
            React frontend
          </span>

          <span>
            <Activity size={14}
              style={{ verticalAlign: "middle", marginRight: 6 }} />
            Simulated sensor mode
          </span>
        </div>

        <p style={{
          color: theme.muted,
          fontSize: 11,
          marginTop: 17,
        }}>
          Last updated: {lastUpdated
            ? lastUpdated.toLocaleTimeString()
            : "Waiting for data"}
        </p>

        <p style={{
          color: "#d9b875",
          fontSize: 11,
          marginTop: 10,
        }}>
          Demonstration data only. Readings are simulated and are not
          real farm measurements or validated crop recommendations.
        </p>
      </section>

      <footer style={{
        textAlign: "center",
        color: theme.muted,
        fontSize: 11,
        padding: "25px 0 5px",
      }}>
        AgriTwin AI © 2026 | Smart Cardamom Agriculture Intelligence
      </footer>
    </div>
  );
}

export default App;
