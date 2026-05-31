import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.youtube.scraper import scrape_video

YT_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

res = scrape_video(YT_URL)

print(res)