"""Rebuild a read-only analysis copy of the JSON archive into a new SQLite file."""
import json, sqlite3, sys
from pathlib import Path
root = Path(__file__).resolve().parent / "data"
def load(p): return json.loads((root / p).read_text(encoding="utf-8"))
def main():
    if len(sys.argv) != 2: raise SystemExit("Usage: export_sqlite.py OUTPUT.sqlite")
    out = Path(sys.argv[1])
    if out.exists(): raise SystemExit("Refusing to overwrite an existing database.")
    c = load("catalog.json")
    db = sqlite3.connect(out)
    try:
        db.execute("PRAGMA foreign_keys = ON")
        db.executescript("""
        CREATE TABLE ensemble(id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL);
        CREATE TABLE concert(id TEXT PRIMARY KEY, date TEXT NOT NULL, title TEXT NOT NULL, venue TEXT, conductor TEXT, soloists_json TEXT);
        CREATE TABLE work(id TEXT PRIMARY KEY, composer TEXT, title TEXT);
        CREATE TABLE concert_ensemble(concert_id TEXT REFERENCES concert(id), ensemble_id TEXT REFERENCES ensemble(id), PRIMARY KEY(concert_id,ensemble_id));
        CREATE TABLE concert_work(concert_id TEXT REFERENCES concert(id), work_id TEXT REFERENCES work(id), PRIMARY KEY(concert_id,work_id));
        CREATE TABLE person(id TEXT PRIMARY KEY, data_json TEXT NOT NULL);
        CREATE TABLE roster(id TEXT PRIMARY KEY, ensemble_id TEXT NOT NULL REFERENCES ensemble(id), concert_id TEXT REFERENCES concert(id), season TEXT, source_json TEXT NOT NULL, transcription_review TEXT NOT NULL, CHECK((concert_id IS NULL) != (season IS NULL)));
        CREATE TABLE appearance(id TEXT PRIMARY KEY, roster_id TEXT NOT NULL REFERENCES roster(id), position INTEGER NOT NULL, name TEXT NOT NULL, part TEXT NOT NULL, role TEXT, printed_mark TEXT, category TEXT NOT NULL, person_id TEXT REFERENCES person(id), attendance TEXT NOT NULL, UNIQUE(roster_id,position));
        CREATE INDEX appearance_name_part ON appearance(name,part);
        CREATE INDEX roster_concert ON roster(concert_id);
        """)
        db.executemany("INSERT INTO ensemble VALUES (?,?,?)",[(x["id"],x["name"],x["type"]) for x in c["ensembles"]])
        db.executemany("INSERT INTO concert VALUES (?,?,?,?,?,?)",[(x["id"],x["date"],x["title"],x.get("venue"),x.get("conductor"),json.dumps(x.get("soloists"),ensure_ascii=False)) for x in c["concerts"]])
        db.executemany("INSERT INTO work VALUES (?,?,?)",[(x["id"],x["composer"],x["title"]) for x in c["works"]])
        db.executemany("INSERT INTO concert_ensemble VALUES (?,?)",[(x["id"],e) for x in c["concerts"] for e in x["ensemble_ids"]])
        db.executemany("INSERT INTO concert_work VALUES (?,?)",[(x["id"],w) for x in c["concerts"] for w in x["work_ids"]])
        db.executemany("INSERT INTO person VALUES (?,?)",[(x["id"],json.dumps(x,ensure_ascii=False)) for x in c["persons"]])
        for rid in c["roster_ids"]:
            r = load("rosters/"+rid+".json")
            db.execute("INSERT INTO roster VALUES (?,?,?,?,?,?)",(rid,r["ensemble_id"],r["concert_id"],r["season"],json.dumps(r["source"],ensure_ascii=False),r["transcription_review"]))
            db.executemany("INSERT INTO appearance VALUES (?,?,?,?,?,?,?,?,?,?)",[(x["id"],rid,i,x["name"],x["part"],x["role"],x["printed_mark"],x["category"],x["person_id"],x["attendance"]) for i,x in enumerate(r["records"],1)])
        db.commit()
        print("appearances:",db.execute("SELECT COUNT(*) FROM appearance").fetchone()[0])
    finally:
        db.close()
if __name__ == "__main__": main()
