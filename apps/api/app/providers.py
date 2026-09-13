from abc import ABC, abstractmethod
import httpx
from .config import settings


class ModelProvider(ABC):
    @abstractmethod
    async def complete_json(self, system: str, user: str) -> dict:
        raise NotImplementedError


class OpenAICompatibleProvider(ModelProvider):
    async def complete_json(self, system: str, user: str) -> dict:
        if not all((settings.model_base_url, settings.model_api_key, settings.model_name)):
            raise RuntimeError("Model provider is not configured")
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                f"{settings.model_base_url.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {settings.model_api_key}"},
                json={
                    "model": settings.model_name,
                    "temperature": 0,
                    "response_format": {"type": "json_object"},
                    "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                },
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]


def get_provider() -> ModelProvider | None:
    if settings.model_provider == "openai_compatible":
        return OpenAICompatibleProvider()
    return None

