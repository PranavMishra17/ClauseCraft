# ClauseCraft

An agentic document editor powered by AI that enables intelligent document editing through conversational commands and line-based citations.

## Features

- **Multi-Format Support**: Upload and parse DOCX, PDF, and Markdown files
- **AI-Powered Editing**: Use Google Gemini Flash to search, read, and edit documents
- **Line-Based Citations**: Reference specific lines with @line10, @l5-10, or @p3 for page 3, type of syntax
- **Document Locking**: Lock lines to prevent AI modifications
- **Placeholder Detection**: Automatically highlights {{PLACEHOLDERS}}, [CONSTANTS], and _____ patterns
- **Chat History**: Persistent chat history with localStorage (for now, will switch to Supabase)
- **Real-Time Editing**: See document changes instantly as AI makes edits

## Architecture

Built with a modular, clean architecture:

```
/src
  /app
    page.tsx              # Main UI with state management
    layout.tsx
    /api
      /parse              # Document parsing endpoint
      /chat               # Gemini chat endpoint
  /lib
    /parsers              # DOCX, PDF, Markdown parsers
    /citations            # Citation parsing and resolution
    /gemini               # Gemini API client and tools
    /storage              # LocalStorage wrapper
  /components
    /document             # Document viewer and line components
    /chat                 # Chat interface
    /sidebar              # Chat history
```

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **AI**: Google Gemini 1.5 Flash with function calling
- **Parsing**: mammoth (DOCX), pdf-parse (PDF), marked (Markdown)
- **Export**: docx, jsPDF
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/clausecraft.git
cd clausecraft
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

4. Run the development server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## Usage

### Upload a Document

Click "Upload Document" and select a DOCX, PDF, or Markdown file.

### Chat with Your Document

Use natural language to interact with your document:

- "Search for all mentions of 'payment terms'"
- "Read lines 10-20"
- "Replace line 15 with 'New content here'"
- "What does line 25 say?"

### Use Citations

Reference specific parts of the document:

- `@line10` or `@l10` - Reference line 10
- `@l5-10` - Reference lines 5 through 10
- `@page3` or `@p3` - Reference all lines on page 3

Example: "Replace @line10 with 'Updated text'"

### Lock Lines

Click the lock icon next to any line to prevent AI modifications.

### Export

Click the "Export" button to download your edited document in DOCX, PDF, or Markdown format.

## API Endpoints

### POST /api/parse

Upload and parse a document.

**Request:**
- `file`: File (multipart/form-data)

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "...",
    "lines": [...],
    "metadata": {...}
  }
}
```

### POST /api/chat

Send a message and get AI response.

**Request:**
```json
{
  "message": "Search for payment",
  "document": {...},
  "chatHistory": [...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "I found 3 mentions...",
  "actions": [...],
  "document": {...}  // Updated if edits were made
}
```

## AI Tools

The AI assistant has access to three tools:

1. **doc_search(query)** - Search for keywords in the document
2. **doc_read(lines)** - Read specific line numbers
3. **doc_edit(operation, lines, newText)** - Edit lines (replace, insert, delete)

All tools respect line locks and provide detailed error handling.

## Development

### Project Structure

- `/src/lib/parsers` - Document parsing logic
- `/src/lib/citations` - Citation system
- `/src/lib/gemini` - AI integration
- `/src/lib/storage` - Data persistence
- `/src/components` - React components
- `/src/app/api` - API routes

### Code Standards

Follow the rules in `.claude/rules.md`:

- Comprehensive logging with [MODULE] prefix
- Graceful error handling with try-catch
- No hardcoded values - use environment variables
- Clean code structure with TypeScript types

### Testing

```bash
npm run lint        # Run ESLint
npm run build       # Test production build
```

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add `GEMINI_API_KEY` environment variable
4. Deploy

### Docker

```bash
docker build -t clausecraft .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key clausecraft
```

## File Format Support

### DOCX
- Extracts text line by line
- Preserves paragraph structure
- Detects placeholders
- Estimated page numbers (40 lines/page)

### PDF
- Extracts text per page
- Accurate page tracking
- Splits on newlines

### Markdown
- Simple line-by-line parsing
- Detects headers
- Preserves formatting
- Estimated pages (50 lines/page)

## Limitations

- PDF parsing may vary based on PDF structure
- Image content is not extracted
- Complex formatting may be simplified
- Maximum file size: 10MB

## Future Enhancements

- [ ] Real-time collaboration
- [ ] Version history
- [ ] Advanced export options (styling, formatting)
- [ ] Support for more file formats (RTF, ODT)
- [ ] Custom AI models
- [ ] Document templates
- [ ] Batch operations

## License

MIT License - see LICENSE file

## Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/clausecraft/issues
- Documentation: Check the /docs folder

## Acknowledgments

- Built with Next.js and React
- Powered by Google Gemini
- Icons by Lucide
