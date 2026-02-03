from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional

from models.user import User
from services.adaptor import get_composio_client


class SchemaHandler(ABC):
    TOOLKIT_SLUG: str = ""

    def __init__(self, user: User):
        self.user = user
        self.composio = get_composio_client()

    def get_available_actions(self) -> List[Dict[str, Any]]:
        tools = self.composio.tools.get(
            user_id=self.user.id,
            toolkits=[self.TOOLKIT_SLUG]
        )
        return [
            {
                "name": tool.name,
                "slug": tool.slug if hasattr(tool, 'slug') else tool.name,
                "description": tool.description if hasattr(tool, 'description') else "",
            }
            for tool in tools
        ]

    def execute_action(
        self,
        action_slug: str,
        arguments: Dict[str, Any]
    ) -> Dict[str, Any]:
        result = self.composio.tools.execute(
            action_slug,
            user_id=self.user.id,
            arguments=arguments
        )
        return result

    @abstractmethod
    def get_schema(self, source_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def read_data(
        self,
        source_id: str,
        query: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def write_data(
        self,
        source_id: str,
        data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    def update_data(
        self,
        source_id: str,
        record_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    def list_sources(self, query: Optional[str] = None) -> List[Dict[str, Any]]:
        pass

def get_schema_handler(user: User, integration_slug: str) -> "SchemaHandler":
    from services.notion_handler import NotionHandler

    handlers = {
        "notion": NotionHandler,
    }

    slug = integration_slug.lower()
    if slug not in handlers:
        supported = ", ".join(handlers.keys())
        raise ValueError(f"Unsupported integration: {integration_slug}. Supported: {supported}")

    return handlers[slug](user)
