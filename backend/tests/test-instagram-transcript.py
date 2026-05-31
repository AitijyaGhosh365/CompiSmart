import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.instagram.scraper import (
    scrape_instagram_profiles,
    scrape_instagram_posts,
    scrape_instagram_reels,
)

# print("=== Profiles ===")
# profiles = scrape_instagram_profiles(["https://www.instagram.com/cats_of_world_/"])[0]
# print(profiles)
# for p in profiles:
#     print(f"  @{p.user_name} - {p.full_name} - {p.followers} followers - error: {getattr(p, 'error', None)}")

# print("\n=== Posts ===")
# posts = scrape_instagram_posts(["https://www.instagram.com/p/Cuf4s0MNqNr/"])[0]
# print(posts)


# # for p in posts:
# #     print(f"  {p.url} - likes: {p.likes} - caption: {p.caption[:50] if p.caption else None} - error: {p.error}")

print("\n=== Reels ===")
reels = scrape_instagram_reels(["https://www.instagram.com/reels/C5Rdyj_q7YN/"])[0]
print(reels)