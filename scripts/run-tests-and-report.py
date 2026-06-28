#!/usr/bin/env python3
"""Run backend pytest and frontend vitest; write results to test-results.txt."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "test-results.txt"
lines: list[str] = []


def run(cmd: list[str], cwd: Path) -> int:
    lines.append(f"$ {' '.join(cmd)}  (cwd={cwd})")
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if result.stdout:
        lines.append(result.stdout.rstrip())
    if result.stderr:
        lines.append(result.stderr.rstrip())
    lines.append(f"exit_code={result.returncode}")
    lines.append("")
    return result.returncode


def main() -> int:
    backend = ROOT / "backend"
    frontend = ROOT / "frontend"
    venv_py = backend / ".venv" / "bin" / "python"

    if not venv_py.exists():
        subprocess.check_call([sys.executable, "-m", "venv", str(backend / ".venv")], cwd=backend)
        subprocess.check_call(
            [str(backend / ".venv" / "bin" / "pip"), "install", "-q", "-r", "requirements.txt", "-r", "requirements-dev.txt"],
            cwd=backend,
        )

    rc_backend = run([str(venv_py), "-m", "pytest", "-q", "--tb=short"], backend)
    rc_frontend_install = run(["npm", "install"], frontend)
    rc_frontend = run(["npm", "test"], frontend)

    lines.append("SUMMARY")
    lines.append(f"backend: {'PASS' if rc_backend == 0 else 'FAIL'} ({rc_backend})")
    lines.append(f"frontend_install: {'PASS' if rc_frontend_install == 0 else 'FAIL'} ({rc_frontend_install})")
    lines.append(f"frontend: {'PASS' if rc_frontend == 0 else 'FAIL'} ({rc_frontend})")

    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(OUT.read_text(encoding="utf-8"))
    return 0 if rc_backend == 0 and rc_frontend == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())