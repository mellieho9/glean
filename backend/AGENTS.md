## background
this is the backend server for glean - a video-to-schema platform that allows users to save videos into the data structure that they want

## workflow
### onboarding
- user signs into the platform
- backend creates user object
- user connects into their db platform (via composio)
- backend fetches schema that the user allows the platform to connect to
- schema by schema
    - backend use question generation agent to generate questions to make a good prompt
    - from the user's answers, backend calls the prompt generation agent to generate prompt that the content extraction agent will base to extract content from youtube videos
    - backend save the schema information and frozen prompt into the db
### when user saves a video into an extension (aka video processing)
- backend fetch the video from the request and find the schema it belongs
- it injects the frozen prompt into the conent extraction agent
- in a 3x loop or until the response is valid  
    - the content extraction outputs details from video that fit the schema
    - critique agent tries to verify that the output will match with the schema
    - if not, it provides the feedback and prompt the content etraction agent to work until the output is satisfactory
- backend will then inject the output data into whatever db platform the schema is connected to

## file structure
- bin/
    - any files that test the system
- models/
    - define the pydantic model
- routes'
    - define the apis for the different services
        - not all methods need an api
        - we just want to have an api for anything service that interacts with the client
- services/
    - define the business logic of the application
- utils/
    - define util functions such as configuration, promtps, grounding tools, db connections, schema handlers

## coding guidelines
- write self-documenting code - don't use comments to explain things; make the variables and code overall easy to read and reason
- base existing code before u write anything new; a logic should only exist in one place
- imports at the top of the file

## progress
completed
- set up agents that work individually (/services/agents/*.py and /utils/prompt.py) (refer to bin/test_agent.py)
- supabase connection (/services/database.py)
- composio connection (/services/adaptor.py)
    - schema_handler - base class for handling db-as-a-service schemas
    - notion_handler - child class of schema_handler for notion connections
- oauth (/services/user.py/)
- set up pipeline for onboarding
- set up pipeline for video processing
