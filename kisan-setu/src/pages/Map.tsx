import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Clock3, Gauge, MapPin, Navigation, Phone } from "lucide-react";
import { useApp } from "../context/AppContext";
import { pickLang } from "../i18n/translations";
import { centers } from "../data/mockData";
import "leaflet/dist/leaflet.css";
import "./Map.css";

const markerIcon = (load: number) =>
  L.divIcon({
    className: "",
    html: `<div class="map__pin ${load > 70 ? "hot" : load > 50 ? "med" : "cool"}">
      <svg viewBox="0 0 24 32" width="32" height="42" fill="none">
        <path d="M12 2C7 2 3 6.5 3 11.5C3 19 12 32 12 32S21 19 21 11.5C21 6.5 17 2 12 2Z" fill="${load > 70 ? "#D64933" : load > 50 ? "#D98A2B" : "#46A758"}"/>
        <circle cx="12" cy="11.5" r="4" fill="white"/>
        <text x="12" y="13" text-anchor="middle" fill="${load > 70 ? "#D64933" : load > 50 ? "#D98A2B" : "#46A758"}" font-size="6" font-weight="800" font-family="sans-serif">${load}%</text>
      </svg>
    </div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -44],
  });

export default function MapPage() {
  const { t, lang } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = centers.find((c) => c.id === selectedId);
  const centerCoords: [number, number] = [16.29, 80.55];

  return (
    <div className="mappage page-enter">
      <div className="container">
        <div className="mappage__head">
          <span className="eyebrow">📍 <strong>{centers.length}</strong> mandis</span>
          <h1>{t("map.title")}</h1>
          <p className="mappage__sub">{t("map.intro")}</p>
          <div className="mappage__legend">
            <span className="mappage__leg"><span className="mappage__dot cool" />{t("map.legendLow")}</span>
            <span className="mappage__leg"><span className="mappage__dot med" />{t("map.legendMed")}</span>
            <span className="mappage__leg"><span className="mappage__dot hot" />{t("map.legendHigh")}</span>
          </div>
        </div>
      </div>

      <div className="mappage__wrap">
        <MapContainer
          center={centerCoords}
          zoom={9}
          scrollWheelZoom
          className="mappage__map"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com">Carto</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {centers.map((c) => (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={markerIcon(c.currentLoad)}
              eventHandlers={{ click: () => setSelectedId(c.id) }}
            >
              <Popup className="mappage__popup" maxWidth={280}>
                <div className="map__popup">
                  <h4>{pickLang(lang, c.name, c.nameHi, c.nameTe)}</h4>
                  <p className="map__popup-addr">{c.address}</p>
                  <div className="map__popup-grid">
                    <span className="badge badge-gold"><Gauge size={12} /> {c.currentLoad}% load</span>
                    <span className="badge badge-ink"><Clock3 size={12} /> {c.avgWaitMins} min wait</span>
                  </div>
                  <p className="map__popup-hours">🕐 {c.opensAt} – {c.closesAt}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {selected && (
          <div className="mappage__detail card card-static">
            <h3>{pickLang(lang, selected.name, selected.nameHi, selected.nameTe)}</h3>
            <p><MapPin size={13} /> {selected.address}</p>
            <div className="mappage__detail-stats">
              <div className="mappage__dstat">
                <b>{selected.currentLoad}%</b>
                <small>Capacity</small>
              </div>
              <div className="mappage__dstat">
                <b>{selected.queueLength}</b>
                <small>In queue</small>
              </div>
              <div className="mappage__dstat">
                <b>{selected.avgWaitMins}m</b>
                <small>Wait</small>
              </div>
            </div>
            <p className="mappage__detail-hours">
              <Clock3 size={14} /> {t("dash.open")} {selected.opensAt} {t("dash.to")} {selected.closesAt}
            </p>
            <p className="mappage__detail-crops">{selected.crops.join(" · ")}</p>
            <div className="mappage__detail-actions">
              <a href="#" className="btn btn-sm btn-outline"><Phone size={15} /> {selected.phone}</a>
              <a href="#" className="btn btn-sm btn-primary"><Navigation size={15} /> {t("dash.arrive")}</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}