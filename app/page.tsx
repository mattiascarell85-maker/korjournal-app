"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Entry = {
  date: string;
  from: string;
  to: string;
  startKm: number;
  endKm: number;
  distance: number;
};

export default function Page() {
  const [regNr, setRegNr] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);

  const [date, setDate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [startKm, setStartKm] = useState("");
  const [endKm, setEndKm] = useState("");

  /* ================= LOAD / SAVE ================= */
  useEffect(() => {
    const saved = localStorage.getItem("korjournal");
    if (saved) {
      const data = JSON.parse(saved);
      setRegNr(data.regNr || "");
      setEntries(data.entries || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("korjournal", JSON.stringify({ regNr, entries }));
  }, [regNr, entries]);

  /* ================= ADD / DELETE ================= */
  const addEntry = () => {
    if (!date || !from || !to || !startKm || !endKm) return;

    setEntries([
      {
        date,
        from,
        to,
        startKm: Number(startKm),
        endKm: Number(endKm),
        distance: Number(endKm) - Number(startKm),
      },
      ...entries,
    ]);

    setDate("");
    setFrom("");
    setTo("");
    setStartKm("");
    setEndKm("");
  };

  const deleteEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  /* ================= PDF + EMAIL ================= */
  const sendSummaryByEmail = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Körjournal", 14, 15);
    doc.setFontSize(11);
    doc.text(`Registreringsnummer: ${regNr}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [["Datum", "Från", "Till", "Start km", "Slut km", "Km"]],
      body: entries.map(e => [
        e.date,
        e.from,
        e.to,
        e.startKm,
        e.endKm,
        e.distance,
      ]),
    });

    doc.save("korjournal.pdf");

    window.location.href =
      "mailto:?subject=Körjournal&body=Hej,%0D%0AHär kommer min körjournal.%0D%0APDF bifogad.";
  };

  /* ================= SUMMARY ================= */
  const monthly: Record<string, number> = {};
  entries.forEach(e => {
    const m = e.date.slice(0, 7);
    monthly[m] = (monthly[m] || 0) + e.distance;
  });

  return (
    <div style={page}>
      <div style={container}>
        <h1 style={{ textAlign: "center", marginBottom: 20 }}>🚗 Körjournal</h1>

        {/* REG + DATE */}
        <Card>
          <div style={row}>
            <FloatingInput
              label="Registreringsnummer"
              value={regNr}
              onChange={setRegNr}
            />
            <FloatingInput
              label="Datum"
              type="date"
              value={date}
              onChange={setDate}
            />
          </div>
        </Card>

        {/* NEW TRIP */}
        <Card>
          <div style={row}>
            <FloatingInput label="Från" value={from} onChange={setFrom} />
            <FloatingInput label="Till" value={to} onChange={setTo} />
          </div>

          <div style={row}>
            <FloatingInput label="Start km" value={startKm} onChange={setStartKm} />
            <FloatingInput label="Slut km" value={endKm} onChange={setEndKm} />
          </div>

          <button style={primaryBtn} onClick={addEntry}>
            ➕ Lägg till resa
          </button>
        </Card>

        {/* TRIPS */}
        {entries.map((e, i) => (
          <Card key={i}>
            <strong>{e.date}</strong>
            <div>{e.from} → {e.to}</div>
            <div>{e.distance} km</div>
            <button style={deleteBtn} onClick={() => deleteEntry(i)}>
              Radera
            </button>
          </Card>
        ))}

        {/* SUMMARY */}
        <Card>
          <strong>Summering</strong>
          {Object.entries(monthly).map(([m, km]) => (
            <div key={m}>{m}: {km} km</div>
          ))}

          <button style={emailBtn} onClick={sendSummaryByEmail}>
            📧 Skicka summering till e-post
          </button>
        </Card>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function Card({ children }: { children: React.ReactNode }) {
  return <div style={card}>{children}</div>;
}

function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div style={floatWrap}>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={floatInput}
      />
      <label
        style={{
          ...floatLabel,
          transform: value ? "translateY(-14px) scale(0.85)" : "translateY(0)",
        }}
      >
        {label}
      </label>
    </div>
  );
}

/* ================= STYLES ================= */

const page = {
  background: "linear-gradient(180deg,#f8fafc,#eef2ff)",
  minHeight: "100vh",
  padding: 16,
};

const container = {
  maxWidth: 420,
  margin: "auto",
};

const card = {
  background: "white",
  borderRadius: 22,
  padding: 16,
  marginBottom: 16,
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
};

const row = {
  display: "flex",
  gap: 10,
};

const floatWrap = {
  position: "relative" as const,
  flex: 1,
};

const floatInput = {
  width: "100%",
  height: 46,
  padding: "16px 14px 6px",
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  fontSize: 15,
  outline: "none",
};

const floatLabel = {
  position: "absolute" as const,
  left: 16,
  top: 14,
  fontSize: 14,
  pointerEvents: "none" as const,
  transition: "all 0.2s ease",
};

const primaryBtn = {
  width: "100%",
  background: "linear-gradient(135deg,#2563eb,#4f46e5)",
  color: "white",
  border: "none",
  padding: 14,
  borderRadius: 18,
  fontWeight: 600,
  marginTop: 10,
};

const deleteBtn = {
  marginTop: 10,
  background: "#fee2e2",
  color: "#b91c1c",
  border: "none",
  padding: "6px 12px",
  borderRadius: 14,
};

const emailBtn = {
  marginTop: 16,
  width: "100%",
  background: "linear-gradient(135deg,#16a34a,#22c55e)",
  color: "white",
  border: "none",
  padding: 14,
  borderRadius: 18,
  fontWeight: 600,
};
