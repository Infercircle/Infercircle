# Content Summarizer API Integration

## Overview
The content summarizer has been integrated with real API endpoints for Twitter Spaces and Broadcasts summarization. The system now uses the same logic as the backend but runs directly in Next.js API routes.

## API Endpoints

### 1. Twitter Spaces Summarization
- **Endpoint**: `/api/content-summarizer/spaces`
- **Method**: `POST`
- **Payload**: 
  ```json
  {
    "space_url": "https://twitter.com/i/spaces/1a2b3c4d5e6f",
    "is_ended": false
  }
  ```
- **Response**:
  ```json
  {
    "summary": "# Markdown formatted summary...",
    "transcript": "[00:00:00] Speaker: Full transcript...",
    "success": true
  }
  ```

### 2. Twitter Broadcasts Summarization
- **Endpoint**: `/api/content-summarizer/broadcasts`
- **Method**: `POST`
- **Payload**: 
  ```json
  {
    "broadcast_url": "https://x.com/i/broadcasts/1a2b3c4d5e6f"
  }
  ```
- **Response**:
  ```json
  {
    "summary": "# Markdown formatted summary...",
    "transcript": "[00:00:00] Speaker: Full transcript...",
    "success": true
  }
  ```

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Helper API for downloading and transcribing content
HELPER_APIS_URL=http://localhost:8000

# OpenRouter API for AI summarization
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

## How It Works

1. **Frontend**: User submits a Twitter Space or Broadcast URL
2. **API Route**: Calls the appropriate endpoint (`/api/content-summarizer/spaces` or `/api/content-summarizer/broadcasts`)
3. **Helper API**: Downloads and transcribes the audio content
4. **AI Service**: Generates a structured summary using OpenRouter API
5. **Response**: Returns both summary and transcript to the frontend

## Error Handling

If the API call fails (e.g., missing environment variables, network issues, invalid URLs), the system will:
- Mark the task as failed
- Show an error message to the user
- Allow the user to retry with a different URL
- No fallback to mock data - only real API responses are processed

## Testing

### CLI Testing
You can test the API endpoints directly using curl:

```bash
# Test Spaces API
curl -X POST http://localhost:3000/api/content-summarizer/spaces \
  -H "Content-Type: application/json" \
  -d '{"space_url": "https://twitter.com/i/spaces/1a2b3c4d5e6f", "is_ended": false}'

# Test Broadcasts API
curl -X POST http://localhost:3000/api/content-summarizer/broadcasts \
  -H "Content-Type: application/json" \
  -d '{"broadcast_url": "https://x.com/i/broadcasts/1a2b3c4d5e6f"}'
```

### Frontend Testing
1. Navigate to `/dashboard/content-summarizer`
2. Select content type (Spaces or Broadcasts)
3. Enter a valid Twitter Space or Broadcast URL
4. Click "Summarize"
5. Monitor the console for API call logs

## Error Handling

The system includes comprehensive error handling:
- Missing environment variables
- Network failures
- API response errors
- Invalid URLs
- Transcription failures

All errors are logged to the console and the UI shows appropriate error messages to the user.

## Performance

- **Spaces**: Estimated 15 minutes processing time
- **Broadcasts**: Estimated 30 minutes processing time
- **Background Processing**: Continues even when user switches tabs
- **Caching**: Results are cached and restored on page reload

## Next Steps

1. Set up the `HELPER_APIS_URL` to point to your helper API service
2. Obtain an OpenRouter API key for AI summarization
3. Test with real Twitter Space and Broadcast URLs
4. Monitor performance and adjust timeouts as needed
