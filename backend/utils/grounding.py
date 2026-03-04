from google.adk.agents import LlmAgent
from google.adk.tools import google_search
from google.adk.tools.agent_tool import AgentTool
from google.adk.tools.google_maps_grounding_tool import GoogleMapsGroundingTool

_maps_agent = LlmAgent(
    name="MapsGroundingAgent",
    model="gemini-2.5-flash",
    instruction=(
        "You are a location research specialist. "
        "Use Google Maps to find accurate information about places.\n\n"
        "When queried, provide:\n"
        "- Full address (street, city, country)\n"
        "- Coordinates (latitude, longitude) if available\n"
        "- Business details: ratings, hours, phone, website\n"
        "- Place type/category\n\n"
        "Be concise and return structured data. "
        "If a place cannot be found, say so clearly."
    ),
    description="Looks up location details using Google Maps",
    tools=[GoogleMapsGroundingTool()],
)

# ============================================
# Google Search Grounding Agent
# ============================================

_search_agent = LlmAgent(
    name="SearchGroundingAgent",
    model="gemini-2.5-flash",
    instruction=(
        "You are a web research specialist. "
        "Use Google Search to find accurate, up-to-date information.\n\n"
        "When queried, provide:\n"
        "- Factual information from reliable sources\n"
        "- Current data (prices, availability, events)\n"
        "- Additional relevant context\n\n"
        "Be concise and cite sources when relevant. "
        "If information cannot be found, say so clearly."
    ),
    description="Searches the web for additional information",
    tools=[google_search],
)

MAPS_TOOL = AgentTool(agent=_maps_agent)
SEARCH_TOOL = AgentTool(agent=_search_agent)

AVAILABLE_TOOLS = {
    "google_maps": MAPS_TOOL,
    "google_search": SEARCH_TOOL,
}
