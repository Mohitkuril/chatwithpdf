# ChatWithPDF

ChatWithPDF is a web application that allows you to upload PDF documents and have interactive conversations about their content using AI. The application processes your PDF, extracts the text, and uses the Groq AI API to provide contextual responses based on the document's content.

## Features

- **PDF Upload**: Easily upload PDF documents through drag-and-drop or file selection
- **Text Extraction**: Automatically extracts text content from uploaded PDFs
- **AI-Powered Chat**: Ask questions about the PDF content and receive contextual answers
- **PDF Viewer**: View the original PDF side-by-side with the chat interface
- **Persistent Storage**: Documents are stored locally in your browser using IndexedDB
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **React**: Frontend library for building the user interface
- **Tailwind CSS**: Utility-first CSS framework for styling
- **PDF.js**: Mozilla's PDF rendering library for extracting text and displaying PDFs
- **Groq AI API**: AI model for natural language processing and conversation
- **IndexedDB**: Browser-based database for storing PDF files locally

## Installation

1. Clone the repository:

````bash
git clone https://github.com/yourusername/chatwithpdf.git
cd chatwithpdf


```bash
yarn install
````

Create a .env file in the root directory and add your Groq API key:

ini
Copy
Edit
REACT_APP_GROQ_API_KEY=your_groq_api_key_here
🔑 You can get your free API key by signing up at https://console.groq.com/



> ⚠️ Requires **Node.js v18+** and **Yarn v1.22+**

### 3. Start the App

```bash
yarn dev
```

Visit `http://localhost:5173` to view the application in your browser.

---

Project Structure
chatwithpdf/
├── public/
│ └── index.html
├── src/
│ ├── components/
│ │ ├── ChatInterface.jsx # Handles chat UI and interactions
│ │ ├── PDFUploader.jsx # Manages PDF file uploads
│ │ ├── PDFViewer.jsx # Renders the PDF document
│ │ └── UploadProgress.jsx # Shows upload progress indicator
│ ├── utils/
│ │ └── groqChat.js # Handles communication with Groq API
│ ├── App.jsx # Main application component
│ ├── index.jsx # Entry point
│ └── styles.css # Global styles
├── tailwind.config.js # Tailwind CSS configuration
├── package.json # Project dependencies and scripts
├── README.md # Project documentation
└── yarn.lock # Dependency lock file
Usage

Open the application in your browser
Upload a PDF document by clicking the upload button or dragging and dropping a file
Wait for the text extraction process to complete
Start asking questions about the document in the chat interface
View the PDF document in the viewer panel on the right
Use the controls in the PDF viewer to navigate between pages and adjust zoom level
Click the "Start New Chat" button in the top-right corner to upload a different PDF

How It Works

PDF Processing:

When you upload a PDF, the application uses PDF.js to extract the text content
The extracted text is stored in the application state and sent as context to the AI

Chat System:

Your questions are sent to the Groq AI API along with the PDF context
The AI generates responses based on the document content
The chat history is maintained in the application state

Storage:

The PDF file is stored in your browser's IndexedDB storage
The application checks for a stored PDF when it loads and restores your previous session

Performance Considerations

The application processes PDFs locally in your browser
Large PDFs may take longer to process
The current implementation limits the context sent to the AI to prevent exceeding token limits
For very large documents, only the first portion of the text is used as context

Browser Compatibility
ChatWithPDF works in modern browsers that support:

IndexedDB
PDF.js
ES6+ JavaScript features
Fetch API

Development
Adding New Features

Acknowledgments

PDF.js by Mozilla
Groq AI for the language model API
Tailwind CSS for the styling utilities
React for the UI framework
