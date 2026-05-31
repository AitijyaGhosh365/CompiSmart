from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

from app.services.instagram.scraper import (
    scrape_instagram_profiles,
    scrape_instagram_posts,
    scrape_instagram_reels,
)

router = APIRouter(prefix="/api/instagram", tags=["instagram"])


class UrlRequest(BaseModel):
    url: str


class BatchUrlRequest(BaseModel):
    urls: List[str]


@router.post("/profile")
async def get_profile(request: UrlRequest):
    try:
        profiles = scrape_instagram_profiles([request.url])
        if not profiles:
            raise HTTPException(status_code=404, detail="Profile not found")
        return profiles[0]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scrape profile: {str(e)}")


@router.post("/post")
async def get_post(request: UrlRequest):
    try:
        posts = scrape_instagram_posts([request.url])
        if not posts:
            raise HTTPException(status_code=404, detail="Post not found")
        return posts[0]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scrape post: {str(e)}")


@router.post("/reel")
async def get_reel(request: UrlRequest):
    try:
        reels = scrape_instagram_reels([request.url])
        if not reels:
            raise HTTPException(status_code=404, detail="Reel not found")
        return reels[0]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scrape reel: {str(e)}")


@router.post("/profiles/batch")
async def get_profiles_batch(request: BatchUrlRequest):
    try:
        return scrape_instagram_profiles(request.urls)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scrape batch: {str(e)}")
