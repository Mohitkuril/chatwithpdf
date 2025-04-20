import { useState, useEffect, useRef } from "react";
import { groqChat } from "../utils/groqChat";
import * as pdfjsLib from "pdfjs-dist";
import { FiSend, FiLoader } from "react-icons/fi";
import "pdfjs-dist/build/pdf.worker.min";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function ChatInterface({ pdfData }) {
  const [messages, setMessages] = useState([]);
  const [pdfText, setPdfText] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [showWelcomeCard, setShowWelcomeCard] = useState(false);
  const [processingTimer, setProcessingTimer] = useState(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (pdfData) {
      extractTextFromPDF(pdfData);
    }

    return () => {
      if (processingTimer) {
        clearTimeout(processingTimer);
      }
    };
  }, [pdfData]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!extracting && inputRef.current) {
      inputRef.current.focus();
    }
  }, [extracting]);

  const extractTextFromPDF = async (pdfData) => {
    setExtracting(true);
    let extractionCompleted = false;

    const minProcessingTimer = setTimeout(() => {
      if (extractionCompleted) {
        setExtracting(false);
      }
    }, 4000);

    setProcessingTimer(minProcessingTimer);

    try {
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n\n";
      }

      setPdfText(fullText);

      const initialMessage = {
        role: "system",
        content: `The following is content extracted from a PDF document. Use this information to answer user questions. Note that the text might be truncated if the document is large:\n\n${fullText.substring(
          0,
          15000
        )}`,
      };

      setMessages([initialMessage]);
      setShowWelcomeCard(true);

      const welcomeMessage = {
        role: "assistant",
        content:
          "I've processed your document. What would you like to know about it?",
      };

      setMessages((prev) => [...prev, welcomeMessage]);
      extractionCompleted = true;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      setMessages([
        {
          role: "assistant",
          content:
            "There was an error processing your PDF. Please try uploading it again.",
        },
      ]);
      extractionCompleted = true;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [
      ...prev.filter((msg) => msg.role !== "system"),
      userMsg,
    ]);
    setInput("");
    setLoading(true);
    setShowWelcomeCard(false);

    try {
      const systemMsg = {
        role: "system",
        content: `The following is content extracted from a PDF document. Use this information to answer user questions. Note that the text might be truncated if the document is large:\n\n${pdfText.substring(
          0,
          15000
        )}`,
      };

      const chatMessages = [
        systemMsg,
        ...messages.filter(
          (msg) =>
            (msg.role !== "system" && msg.role !== "assistant") ||
            (msg.role === "assistant" &&
              msg.content !==
                "I've processed your document. What would you like to know about it?")
        ),
      ];

      chatMessages.push(userMsg);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const reply = await groqChat(chatMessages);

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

  const handleSampleQuestionClick = (question) => {
    setInput(question);
    inputRef.current.focus();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="font-medium text-gray-800">Chat with your PDF</h2>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 space-y-4 overflow-y-auto p-4 mb-4"
      >
        {extracting ? (
          <div className="w-full flex justify-center items-center h-32">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-3">
                <svg
                  className="animate-spin h-10 w-10 text-purple-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <div className="font-medium text-gray-700">Processing PDF...</div>
              <div className="text-sm text-gray-500 mt-1">
                Extracting text content
              </div>
            </div>
          </div>
        ) : (
          <>
            {showWelcomeCard && (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-6">
                <div className="flex items-start mb-3">
                  <svg
                    className="w-5 h-5 text-purple-600 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="font-medium text-gray-800">
                      Your document is ready!
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      You can now ask questions about your document. For
                      example:
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      handleSampleQuestionClick(
                        "Can you summarize the key points?"
                      )
                    }
                    className="w-full text-left p-2 rounded-md bg-white hover:bg-gray-50 border border-purple-100 text-sm text-purple-700 transition-colors"
                  >
                    "Can you summarize the key points?"
                  </button>
                  <button
                    onClick={() =>
                      handleSampleQuestionClick(
                        "What are the conclusions or recommendations?"
                      )
                    }
                    className="w-full text-left p-2 rounded-md bg-white hover:bg-gray-50 border border-purple-100 text-sm text-purple-700 transition-colors"
                  >
                    "What are the conclusions or recommendations?"
                  </button>
                </div>
              </div>
            )}

            {messages
              .filter((msg) => msg.role !== "system")
              .map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[85%] ${
                    msg.role === "user" ? "ml-auto" : "mr-auto"
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
          </>
        )}
        {loading && (
          <div className="mr-auto max-w-[85%]">
            <div className="flex items-center space-x-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-lg rounded-bl-none">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
              <div
                className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={extracting || loading}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
            placeholder={
              extracting
                ? "Processing PDF..."
                : "Ask something about the PDF..."
            }
          />
          <button
            onClick={handleSend}
            disabled={loading || extracting || !input.trim()}
            className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-purple-300 transition-colors"
          >
            <FiSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
