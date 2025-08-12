from fastapi import FastAPI
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import sqlite3, os

DB_PATH = os.environ.get("DB_PATH", "teams.db")

app = FastAPI(title="Teams Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT UNIQUE NOT NULL,
            score INTEGER NOT NULL DEFAULT 0,
            last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()

@app.on_event("startup")
async def on_startup():
    init_db()

class TeamScore(BaseModel):
    team_name: str
    score: int

@app.get("/")
async def root():
    return RedirectResponse(url="/static/public.html")

@app.get("/admin")
async def admin_page():
    return RedirectResponse(url="/static/admin.html")

@app.get("/api/top-teams")
async def get_top_teams():
    conn = get_db()
    rows = conn.execute(
        "SELECT team_name, score FROM teams ORDER BY score DESC, team_name ASC LIMIT 3"
    ).fetchall()
    conn.close()
    result = []
    for idx, row in enumerate(rows, start=1):
        result.append({
            "rank": idx,
            "team_name": row["team_name"],
            "score": row["score"],
        })
    return JSONResponse(result)

@app.get("/api/teams")
async def get_teams():
    conn = get_db()
    rows = conn.execute(
        "SELECT team_name, score, last_updated FROM teams ORDER BY score DESC, team_name ASC"
    ).fetchall()
    conn.close()
    return JSONResponse([
        {
            "team_name": r["team_name"],
            "score": r["score"],
            "last_updated": r["last_updated"],
        }
        for r in rows
    ])

@app.post("/api/set-score")
async def set_score(payload: TeamScore):
    name = payload.team_name.strip()
    score = int(payload.score)
    if not name:
        return JSONResponse({"error": "team_name required"}, status_code=400)
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO teams (team_name, score, last_updated) VALUES (?, ?, CURRENT_TIMESTAMP)\n"
            "ON CONFLICT(team_name) DO UPDATE SET score = excluded.score, last_updated = CURRENT_TIMESTAMP",
            (name, score),
        )
        conn.commit()
    finally:
        conn.close()
    return JSONResponse({"status": "ok", "team_name": name, "score": score})

@app.post("/api/reset")
async def reset_all():
    conn = get_db()
    try:
        conn.execute("DELETE FROM teams")
        conn.commit()
    finally:
        conn.close()
    return JSONResponse({"status": "ok", "message": "all teams cleared"}) 
