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
        CREATE TABLE concert(id TEXT PRIMARY KEY, date TEXT NOT NULL, title TEXT NOT NULL, venue TEXT, conductor TEXT, soloists_json TEXT, documentation_note TEXT, ensemble_source TEXT, genre TEXT NOT NULL, performance_time TEXT, production_id TEXT, session_number INTEGER);
        CREATE TABLE work(id TEXT PRIMARY KEY, composer TEXT, title TEXT);
        CREATE TABLE concert_ensemble(concert_id TEXT REFERENCES concert(id), ensemble_id TEXT REFERENCES ensemble(id), event_label TEXT, PRIMARY KEY(concert_id,ensemble_id));
        CREATE TABLE concert_work(concert_id TEXT REFERENCES concert(id), work_id TEXT REFERENCES work(id), PRIMARY KEY(concert_id,work_id));
        CREATE TABLE person(id TEXT PRIMARY KEY, data_json TEXT NOT NULL);
        CREATE TABLE roster(id TEXT PRIMARY KEY, ensemble_id TEXT NOT NULL REFERENCES ensemble(id), concert_id TEXT REFERENCES concert(id), season TEXT, source_json TEXT NOT NULL, transcription_review TEXT NOT NULL, CHECK((concert_id IS NULL) != (season IS NULL)));
        CREATE TABLE appearance(id TEXT PRIMARY KEY, roster_id TEXT NOT NULL REFERENCES roster(id), position INTEGER NOT NULL, name TEXT NOT NULL, part TEXT NOT NULL, role TEXT, printed_mark TEXT, category TEXT NOT NULL, person_id TEXT REFERENCES person(id), attendance TEXT NOT NULL, casting_scope TEXT, UNIQUE(roster_id,position));
        CREATE TABLE production_credit_source(id TEXT PRIMARY KEY,title TEXT,source_json TEXT,transcription_review TEXT);
        CREATE TABLE production_credit(id TEXT PRIMARY KEY,production_id TEXT REFERENCES production_credit_source(id),scope TEXT,organization TEXT,department TEXT,role TEXT,name TEXT,entity_type TEXT,person_id TEXT REFERENCES person(id),ensemble_id TEXT REFERENCES ensemble(id),extra_json TEXT);
        CREATE INDEX production_credit_name ON production_credit(name);
        CREATE INDEX appearance_name_part ON appearance(name,part);
        CREATE INDEX roster_concert ON roster(concert_id);
        """)
        db.executemany("INSERT INTO ensemble VALUES (?,?,?)",[(x["id"],x["name"],x["type"]) for x in c["ensembles"]])
        db.executemany("INSERT INTO concert VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",[(x["id"],x["date"],x["title"],x.get("venue"),x.get("conductor"),json.dumps(x.get("soloists"),ensure_ascii=False),x.get("documentation_note"),x.get("ensemble_source"),x.get("genre","music"),x.get("time"),x.get("production_id"),x.get("session_number")) for x in c["concerts"]])
        db.executemany("INSERT INTO work VALUES (?,?,?)",[(x["id"],x["composer"],x["title"]) for x in c["works"]])
        db.executemany("INSERT INTO concert_ensemble VALUES (?,?,?)",[(x["id"],e,x.get("ensemble_labels",{}).get(e)) for x in c["concerts"] for e in x["ensemble_ids"]])
        db.executemany("INSERT INTO concert_work VALUES (?,?)",[(x["id"],w) for x in c["concerts"] for w in x["work_ids"]])
        db.executemany("INSERT INTO person VALUES (?,?)",[(x["id"],json.dumps(x,ensure_ascii=False)) for x in c["persons"]])
        for rid in c["roster_ids"]:
            r = load("rosters/"+rid+".json")
            db.execute("INSERT INTO roster VALUES (?,?,?,?,?,?)",(rid,r["ensemble_id"],r["concert_id"],r["season"],json.dumps(r["source"],ensure_ascii=False),r["transcription_review"]))
            db.executemany("INSERT INTO appearance VALUES (?,?,?,?,?,?,?,?,?,?,?)",[(x["id"],rid,i,x["name"],x["part"],x["role"],x["printed_mark"],x["category"],x["person_id"],x["attendance"],x.get("casting_scope")) for i,x in enumerate(r["records"],1)])
        for pid in c.get("production_credit_ids",[]):
            p = load("productions/"+pid+".json")
            db.execute("INSERT INTO production_credit_source VALUES (?,?,?,?)",(pid,p["title"],json.dumps(p["source"],ensure_ascii=False),p["transcription_review"]))
            db.executemany("INSERT INTO production_credit VALUES (?,?,?,?,?,?,?,?,?,?,?)",[(x["id"],pid,x["scope"],x.get("organization"),x.get("department"),x["role"],x["name"],x["entity_type"],x.get("person_id"),x.get("ensemble_id"),json.dumps(x,ensure_ascii=False)) for x in p["credits"]])
        db.commit()
        print("appearances:",db.execute("SELECT COUNT(*) FROM appearance").fetchone()[0])
    finally:
        db.close()
if __name__ == "__main__": main()
