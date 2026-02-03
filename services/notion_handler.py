from typing import Dict, List, Any, Optional

from models.user import User
from services.schema_handler import SchemaHandler


class NotionHandler(SchemaHandler):
    TOOLKIT_SLUG = "NOTION"

    def __init__(self, user: User):
        super().__init__(user)

    def list_sources(
        self, query: Optional[str] = None, filter_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        arguments = {"get_databases": True}
        result = self.execute_action("NOTION_FETCH_DATA", arguments)
        data = result.get("data", {})
        sources = []
        for schema in data.get("results", []):
            sources.append(
                {
                    "id": schema.get("id"),
                    "title": schema.get("title")[0].get("plain_text"),
                    "properties": schema.get("properties", {}),
                }
            )
        return sources

    def get_schema(self, source_id: str) -> Dict[str, Any]:
        result = self.execute_action(
            "NOTION_FETCH_DATABASE", {"database_id": source_id}
        )

        database = result.get("data", {})
        properties = database.get("properties", {})

        schema = {
            "id": database.get("id"),
            "title": self._extract_title(database.get("title", [])),
            "properties": {},
        }

        for prop_name, prop_def in properties.items():
            schema["properties"][prop_name] = {
                "id": prop_def.get("id"),
                "type": prop_def.get("type"),
                "name": prop_name,
            }

            prop_type = prop_def.get("type")
            if prop_type in ["select", "multi_select"]:
                options = prop_def.get(prop_type, {}).get("options", [])
                schema["properties"][prop_name]["options"] = [
                    {"name": opt.get("name"), "color": opt.get("color")}
                    for opt in options
                ]

        return schema

    def read_data(
        self, source_id: str, query: Optional[str] = None, limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        arguments = {"database_id": source_id}

        if limit:
            arguments["page_size"] = min(limit, 100)

        result = self.execute_action("NOTION_QUERY_DATABASE", arguments)

        rows = []
        for page in result.get("data", {}).get("results", []):
            row = {
                "id": page.get("id"),
                "created_time": page.get("created_time"),
                "last_edited_time": page.get("last_edited_time"),
                "properties": self._extract_properties(page.get("properties", {})),
            }
            rows.append(row)

        return rows

    def write_data(self, source_id: str, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        results = []

        for row in data:
            properties = self._convert_to_notion_properties(row)
            result = self.execute_action(
                "NOTION_INSERT_ROW_DATABASE",
                {"database_id": source_id, "properties": properties},
            )
            results.append(result)

        return {"success": True, "created_count": len(results), "results": results}

    def update_data(
        self, source_id: str, record_id: str, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        if not self._is_notion_format(data):
            properties = self._convert_to_notion_properties(data)
        else:
            properties = data

        return self.execute_action(
            "NOTION_UPDATE_ROW_DATABASE",
            {"page_id": record_id, "properties": properties},
        )

    def _extract_title(self, title_array: List[Dict]) -> str:
        if not title_array:
            return ""
        return "".join(t.get("plain_text", "") for t in title_array)

    def _extract_properties(self, properties: Dict[str, Any]) -> Dict[str, Any]:
        extracted = {}
        for name, prop in properties.items():
            prop_type = prop.get("type")
            extracted[name] = self._extract_property_value(prop, prop_type)
        return extracted

    def _extract_property_value(self, prop: Dict, prop_type: str) -> Any:
        if prop_type == "title":
            return self._extract_title(prop.get("title", []))
        if prop_type == "rich_text":
            return "".join(t.get("plain_text", "") for t in prop.get("rich_text", []))
        if prop_type == "number":
            return prop.get("number")
        if prop_type == "select":
            select = prop.get("select")
            return select.get("name") if select else None
        if prop_type == "multi_select":
            return [opt.get("name") for opt in prop.get("multi_select", [])]
        if prop_type == "date":
            date = prop.get("date")
            return date.get("start") if date else None
        if prop_type == "checkbox":
            return prop.get("checkbox")
        if prop_type in ["url", "email", "phone_number"]:
            return prop.get(prop_type)
        if prop_type == "status":
            status = prop.get("status")
            return status.get("name") if status else None
        return prop.get(prop_type)

    def _convert_to_notion_properties(self, data: Dict[str, Any]) -> Dict[str, Any]:
        properties = {}
        for key, value in data.items():
            if value is None:
                continue
            if isinstance(value, str):
                properties[key] = {"rich_text": [{"text": {"content": value}}]}
            elif isinstance(value, bool):
                properties[key] = {"checkbox": value}
            elif isinstance(value, (int, float)):
                properties[key] = {"number": value}
            elif isinstance(value, list):
                properties[key] = {"multi_select": [{"name": str(v)} for v in value]}
            else:
                properties[key] = {"rich_text": [{"text": {"content": str(value)}}]}
        return properties

    def _is_notion_format(self, properties: Dict[str, Any]) -> bool:
        if not properties:
            return False

        notion_types = [
            "title",
            "rich_text",
            "number",
            "select",
            "multi_select",
            "date",
            "checkbox",
            "url",
            "email",
            "phone_number",
            "status",
        ]
        for value in properties.values():
            if isinstance(value, dict) and any(t in value for t in notion_types):
                return True
        return False
