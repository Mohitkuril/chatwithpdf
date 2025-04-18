// src/components/ChatInterface.jsx
import { useState, useEffect, useRef } from "react";
import { groqChat } from "../utils/groqChat";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.min";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function ChatInterface({ pdfData }) {
  const [messages, setMessages] = useState([]);
  const [pdfText, setPdfText] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const chatContainerRef = useRef(null);

  // Extract text from PDF when pdfData changes
  useEffect(() => {
    if (pdfData) {
      extractTextFromPDF(pdfData);
    }
  }, [pdfData]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Extract text from PDF
  const extractTextFromPDF = async (pdfData) => {
    setExtracting(true);
    try {
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      let fullText = "";

      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n\n";
      }

      setPdfText(fullText);

      // Initialize chat with PDF context
      const initialMessage = {
        role: "system",
        content: `The following is content from a PDF document. Use this information to answer user questions:\n\n${fullText.substring(
          0,
          15000
        )}...`,
      };

      setMessages([initialMessage]);

      // Add welcome message
      const welcomeMessage = {
        role: "assistant",
        content:
          "I've processed your PDF document. What would you like to know about it?",
      };

      setMessages((prev) => [...prev, welcomeMessage]);
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      setMessages([
        {
          role: "assistant",
          content:
            "There was an error processing your PDF. Please try uploading it again.",
        },
      ]);
    } finally {
      setExtracting(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [
      ...prev.filter((msg) => msg.role !== "system"),
      userMsg,
    ]);
    setInput("");
    setLoading(true);

    try {
      // Prepare messages array with system message first
      const systemMsg = {
        role: "system",
        content: `The following is content from a PDF document. Use this information to answer user questions:\n\n${pdfText.substring(
          0,
          15000
        )}...`,
      };

      const chatMessages = [
        systemMsg,
        ...messages.filter(
          (msg) =>
            (msg.role !== "system" && msg.role !== "assistant") ||
            (msg.role === "assistant" &&
              msg.content !==
                "I've processed your PDF document. What would you like to know about it?")
        ),
      ];

      // Add the latest user message
      chatMessages.push(userMsg);

      // Get response from AI
      const reply = await groqChat(chatMessages);

      // Add assistant response to chat
      const botMsg = { role: "assistant", content: reply };
      setMessages((prev) => [
        ...prev.filter((msg) => msg.role !== "system"),
        botMsg,
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg = {
        role: "assistant",
        content: "Sorry, I couldn't process your request. Please try again.",
      };
      setMessages((prev) => [
        ...prev.filter((msg) => msg.role !== "system"),
        errorMsg,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={chatContainerRef}
        className="flex-1 space-y-4 overflow-y-auto p-4 mb-4"
      >
        {extracting ? (
          <div className="w-full flex justify-center items-center h-32">
            <div className="text-center">
              <div className="mb-2">Processing PDF...</div>
              <div className="w-32 h-2 bg-gray-200 rounded-full mx-auto">
                <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : (
          messages
            .filter((msg) => msg.role !== "system")
            .map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg max-w-[90%] ${
                  msg.role === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "mr-auto bg-gray-200 dark:bg-gray-700 dark:text-white"
                }`}
              >
                {msg.content}
              </div>
            ))
        )}
        {loading && (
          <div className="mr-auto bg-gray-300 dark:bg-gray-700 text-sm text-gray-800 dark:text-white px-3 py-2 rounded-md">
            Typing...
          </div>
        )}
      </div>

      <div className="mt-auto flex gap-2 p-4 border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={extracting}
          className="flex-1 border border-gray-300 rounded px-3 py-2 dark:bg-gray-800 dark:text-white disabled:bg-gray-100 disabled:text-gray-400"
          placeholder={
            extracting ? "Processing PDF..." : "Ask something about the PDF..."
          }
        />
        <button
          onClick={handleSend}
          disabled={loading || extracting || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
        >
          Send
        </button>
      </div>
    </div>
  );
}
