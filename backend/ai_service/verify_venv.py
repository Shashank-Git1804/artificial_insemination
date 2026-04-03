import subprocess
from pathlib import Path

venv_python = Path(__file__).parent / ".venv" / "Scripts" / "python.exe"
result = subprocess.run(
    [str(venv_python), "-c", "import onnxruntime; print('onnxruntime', onnxruntime.__version__, 'OK in venv')"],
    capture_output=True, text=True
)
print(result.stdout)
if result.stderr:
    print("ERROR:", result.stderr)
