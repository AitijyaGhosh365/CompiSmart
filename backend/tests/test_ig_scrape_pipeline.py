import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.instagram.scraper import scrape_video

IG_URL = "https://www.instagram.com/p/DXMi_ehk-Ff/"

res = scrape_video(IG_URL)

print(res)