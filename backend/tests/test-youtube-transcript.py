import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.youtube.scraper import get_youtube_transcript, is_youtube_url, get_youtube_metadata
from app.services.instagram.scraper import scrape_instagram_reels

YT_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"


if __name__ == "__main__":


    res = get_youtube_metadata(YT_URL)
    print(res)
