from __future__ import annotations

import os
import mimetypes
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from src.config import KEEP_TASK_IMAGES, TASK_IMAGE_DIR_PREFIX
from src.infrastructure.persistence.storage_names import DEFAULT_DATABASE_PATH


router = APIRouter(prefix="/api/keeper", tags=["keeper"])


BASE_DIR = Path(__file__).resolve().parents[3]
IMAGES_DIR = (BASE_DIR / "images").resolve()
LOGS_DIR = (BASE_DIR / "logs").resolve()
DB_FILE = (BASE_DIR / DEFAULT_DATABASE_PATH).resolve()


def _safe_child(root: Path, relative_path: str) -> Path:
    raw = str(relative_path or "").strip().lstrip("/").lstrip("\\")
    if not raw:
        raise HTTPException(status_code=400, detail="路径不能为空")
    if raw.startswith("..") or raw.startswith("/") or raw.startswith("\\"):
        raise HTTPException(status_code=400, detail="非法路径")
    candidate = (root / raw).resolve()
    if candidate != root and root not in candidate.parents:
        raise HTTPException(status_code=400, detail="非法路径")
    return candidate


def _stat_file(file_path: Path) -> dict:
    stat = file_path.stat()
    rel = file_path.relative_to(IMAGES_DIR).as_posix() if IMAGES_DIR in file_path.parents else file_path.name
    return {
        "name": file_path.name,
        "rel_path": rel,
        "size": int(stat.st_size),
        "mtime": int(stat.st_mtime),
    }


@router.get("/summary")
async def get_keeper_summary():
    images_task_dirs = []
    images_file_count = 0
    if IMAGES_DIR.exists():
        for child in IMAGES_DIR.iterdir():
            if child.is_dir() and child.name.startswith(TASK_IMAGE_DIR_PREFIX):
                images_task_dirs.append(child.name)
                images_file_count += sum(1 for _ in child.rglob("*") if _.is_file())

    log_files = []
    if LOGS_DIR.exists():
        log_files = [p.name for p in LOGS_DIR.glob("*.log") if p.is_file()]

    return {
        "images": {
            "dir": str(IMAGES_DIR),
            "task_dirs": sorted(images_task_dirs),
            "file_count": images_file_count,
            "keep_task_images": bool(KEEP_TASK_IMAGES),
            "task_dir_prefix": TASK_IMAGE_DIR_PREFIX,
        },
        "logs": {
            "dir": str(LOGS_DIR),
            "files": sorted(log_files),
        },
        "db": {
            "path": str(DB_FILE),
            "exists": DB_FILE.exists(),
            "size": int(DB_FILE.stat().st_size) if DB_FILE.exists() else 0,
        },
    }


@router.get("/images/tasks")
async def list_image_tasks():
    if not IMAGES_DIR.exists():
        return {"tasks": []}
    tasks = []
    for child in IMAGES_DIR.iterdir():
        if not child.is_dir():
            continue
        if not child.name.startswith(TASK_IMAGE_DIR_PREFIX):
            continue
        tasks.append(child.name)
    return {"tasks": sorted(tasks)}


@router.get("/images/tasks/{task_dir}/files")
async def list_task_images(task_dir: str):
    if not IMAGES_DIR.exists():
        return {"files": []}
    base = _safe_child(IMAGES_DIR, task_dir)
    if not base.exists() or not base.is_dir():
        raise HTTPException(status_code=404, detail="任务图片目录不存在")
    files = []
    for file_path in base.rglob("*"):
        if file_path.is_file():
            files.append(_stat_file(file_path))
    files.sort(key=lambda item: (item.get("mtime", 0), item.get("name", "")), reverse=True)
    return {"files": files}


@router.get("/images/raw/{rel_path:path}")
async def get_image_file(rel_path: str):
    file_path = _safe_child(IMAGES_DIR, rel_path)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="图片不存在")
    media_type, _ = mimetypes.guess_type(str(file_path))
    return FileResponse(str(file_path), media_type=media_type or "application/octet-stream")


@router.delete("/images/tasks/{task_dir}")
async def delete_task_image_dir(task_dir: str):
    base = _safe_child(IMAGES_DIR, task_dir)
    if not base.exists() or not base.is_dir():
        raise HTTPException(status_code=404, detail="任务图片目录不存在")
    for file_path in sorted(base.rglob("*"), reverse=True):
        try:
            if file_path.is_file():
                file_path.unlink()
            elif file_path.is_dir():
                file_path.rmdir()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"删除失败: {exc}")
    try:
        base.rmdir()
    except Exception:
        pass
    return {"message": "已删除任务图片目录"}


@router.delete("/images/files/{rel_path:path}")
async def delete_image_file(rel_path: str):
    file_path = _safe_child(IMAGES_DIR, rel_path)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="图片不存在")
    try:
        file_path.unlink()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"删除失败: {exc}")
    return {"message": "已删除图片"}


@router.get("/db/download")
async def download_db_file(export_name: str = Query("app.sqlite3")):
    if not DB_FILE.exists():
        raise HTTPException(status_code=404, detail="数据库文件不存在")
    name = str(export_name or "app.sqlite3").strip() or "app.sqlite3"
    name = name.replace("/", "_").replace("\\", "_")
    headers = {"Content-Disposition": f'attachment; filename="{name}"'}
    return FileResponse(str(DB_FILE), media_type="application/octet-stream", headers=headers)


@router.get("/logs/files")
async def list_log_files():
    if not LOGS_DIR.exists():
        return {"files": []}
    files = []
    for file_path in LOGS_DIR.glob("*.log"):
        if file_path.is_file():
            stat = file_path.stat()
            files.append(
                {
                    "name": file_path.name,
                    "size": int(stat.st_size),
                    "mtime": int(stat.st_mtime),
                }
            )
    files.sort(key=lambda item: (item.get("mtime", 0), item.get("name", "")), reverse=True)
    return {"files": files}


@router.get("/logs/files/{filename}")
async def view_log_file(filename: str):
    safe_name = str(filename or "").strip()
    if not safe_name.endswith(".log") or "/" in safe_name or "\\" in safe_name:
        raise HTTPException(status_code=400, detail="非法文件名")
    file_path = (LOGS_DIR / safe_name).resolve()
    if not LOGS_DIR.exists() or (file_path != LOGS_DIR and LOGS_DIR not in file_path.parents):
        raise HTTPException(status_code=400, detail="非法文件名")
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="日志文件不存在")
    return FileResponse(str(file_path), media_type="text/plain; charset=utf-8")


@router.delete("/logs/files/{filename}")
async def delete_log_file(filename: str):
    safe_name = str(filename or "").strip()
    if not safe_name.endswith(".log") or "/" in safe_name or "\\" in safe_name:
        raise HTTPException(status_code=400, detail="非法文件名")
    file_path = (LOGS_DIR / safe_name).resolve()
    if not LOGS_DIR.exists() or (file_path != LOGS_DIR and LOGS_DIR not in file_path.parents):
        raise HTTPException(status_code=400, detail="非法文件名")
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="日志文件不存在")
    try:
        file_path.unlink()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"删除失败: {exc}")
    return {"message": "已删除日志文件"}
