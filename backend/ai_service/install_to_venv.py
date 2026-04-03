import subprocess, sys
from pathlib import Path

venv_pip = Path(__file__).parent / ".venv" / "Scripts" / "pip.exe"

if not venv_pip.exists():
    print(f"Venv pip not found at {venv_pip}")
    sys.exit(1)

packages = ["onnxruntime", "pillow"]
for pkg in packages:
    print(f"Installing {pkg} into venv...")
    result = subprocess.run(
        [str(venv_pip), "install", pkg],
        capture_output=True, text=True
    )
    print(result.stdout[-500:] if result.stdout else "")
    if result.returncode != 0:
        print("ERROR:", result.stderr[-300:])
    else:
        print(f"  {pkg} installed OK")
