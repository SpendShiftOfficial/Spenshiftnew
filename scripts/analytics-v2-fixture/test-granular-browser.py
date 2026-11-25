# Superseded by test-first-party-browser.py; vendor-positive tests no longer apply.
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('test-first-party-browser.py')),run_name='__main__')
