# Backend Changes for Chat File Upload

## Overview

The frontend now uploads files to jobs and stores file IDs in chat message metadata. The backend needs to extract file IDs from chat history and include those files in Claude API calls.

## What Changed in Frontend

- Users can click paperclip icon to upload files
- Files are uploaded to the job using existing `/job/rest/jobs/{job_id}/files/` endpoint
- A chat message is created: "Uploaded: filename.pdf"
- Message metadata stores: `{"file_ids": ["uuid1", "uuid2"], "filenames": ["file1.pdf", "file2.jpg"]}`

## Required Backend Changes

### Update Chat Interaction Endpoint

**File:** The endpoint that handles `/job/api/jobs/{job_id}/quote-chat/interaction/`

**Add this logic before calling Claude API:**

```python
# 1. Get chat history (you're already doing this)
chat_messages = get_chat_history(job_id)

# 2. Collect all file IDs from message metadata
file_ids = set()
for message in chat_messages:
    if message.metadata and 'file_ids' in message.metadata:
        file_ids.update(message.metadata['file_ids'])

# 3. Fetch files from database
job_files = []
if file_ids:
    job_files = JobFile.objects.filter(
        job_id=job_id,
        id__in=file_ids,
        status='active'
    )

# 4. Build content for Claude API
file_contents = []
for file in job_files:
    if file.mime_type in ['image/jpeg', 'image/png', 'image/gif', 'image/webp']:
        # Images: send as base64
        with open(file.file_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        file_contents.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": file.mime_type,
                "data": image_data
            }
        })
    elif file.mime_type == 'application/pdf':
        # PDFs: extract text (requires PyPDF2 or pypdf)
        import PyPDF2
        with open(file.file_path, 'rb') as f:
            pdf_reader = PyPDF2.PdfReader(f)
            text_content = ""
            for page in pdf_reader.pages:
                text_content += page.extract_text()
        file_contents.append({
            "type": "text",
            "text": f"\n\n--- PDF: {file.filename} ---\n{text_content}\n--- End PDF ---\n"
        })
    else:
        # Other files (DWG, DXF, etc): just mention them
        file_contents.append({
            "type": "text",
            "text": f"\n\n[File attached: {file.filename} - {file.mime_type}]"
        })

# 5. Build Claude API request with files included
message_content = [
    {"type": "text", "text": user_message}
]
message_content.extend(file_contents)

# 6. Call Claude API
response = anthropic_client.messages.create(
    model="claude-3-5-sonnet-20241022",
    messages=[
        {
            "role": "user",
            "content": message_content  # Text + images + PDFs
        }
    ],
    max_tokens=4096,
    system=get_system_prompt(mode)
)
```

## Example Simplified Flow

```python
def process_chat_interaction(job_id: str, user_message: str, mode: str):
    # Get chat history
    history = ChatMessage.objects.filter(job_id=job_id).order_by('created_at')

    # Extract file IDs from all messages
    file_ids = set()
    for msg in history:
        if msg.metadata and 'file_ids' in msg.metadata:
            file_ids.update(msg.metadata['file_ids'])

    # Fetch files
    files = JobFile.objects.filter(
        job_id=job_id,
        id__in=file_ids,
        status='active'
    ) if file_ids else []

    # Build content with files
    content = [{"type": "text", "text": user_message}]

    for file in files:
        if file.mime_type.startswith('image/'):
            content.append(build_image_content(file))
        elif file.mime_type == 'application/pdf':
            content.append(build_pdf_content(file))

    # Call Claude
    response = claude.messages.create(
        model="claude-3-5-sonnet-20241022",
        messages=[{"role": "user", "content": content}]
    )

    return response
```

## Key Points

1. **No API schema changes needed** - request body stays the same
2. **Files persist across conversation** - once uploaded, always in context
3. **Efficient** - only fetches files that were uploaded in this chat
4. **Automatic** - frontend doesn't need to track or resend file IDs

## Testing Checklist

- [ ] Upload image → ask Claude "what's in this image?"
- [ ] Upload PDF → ask Claude "summarize this document"
- [ ] Upload multiple files → verify all are included
- [ ] Chat without files → verify still works
- [ ] Upload file → clear chat → verify file doesn't appear in new conversation (since metadata is cleared)

## Dependencies

May need to install:

```bash
pip install PyPDF2
# or
pip install pypdf
```
