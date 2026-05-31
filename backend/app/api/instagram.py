from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

from app.services.instagram.scraper import (
    scrape_instagram_profile,
    scrape_instagram_post,
    scrape_instagram_reel,
)
from app.services.instagram.models import (
    InstagramProfileData,
    InstagramPostData,
    InstagramReelData,
)

router = APIRouter(prefix="/api/instagram", tags=["instagram"])


class UrlRequest(BaseModel):
    url: str


class BatchUrlRequest(BaseModel):
    urls: List[str]


@router.post("/profile", response_model=InstagramProfileData)
async def get_profile(request: UrlRequest):
    try:
        return scrape_instagram_profile(request.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scrape profile: {str(e)}")


@router.post("/post", response_model=InstagramPostData)
async def get_post(request: UrlRequest):
    try:
        return scrape_instagram_post(request.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scrape post: {str(e)}")


@router.post("/reel", response_model=InstagramReelData)
async def get_reel(request: UrlRequest):
    try:
        return scrape_instagram_reel(request.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scrape reel: {str(e)}")


@router.post("/profiles/batch", response_model=List[InstagramProfileData])
async def get_profiles_batch(request: BatchUrlRequest):
    results = []
    for url in request.urls:
        try:
            results.append(scrape_instagram_profile(url))
        except Exception as e:
            results.append(
                InstagramProfileData(
                    user_name="",
                    full_name=f"Error: {str(e)}",
                    biography="",
                    followers=0,
                    following=0,
                    posts_count=0,
                    is_verified=False,
                    url=url,
                )
            )
    return results
