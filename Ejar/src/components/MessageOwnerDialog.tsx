import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Send, AlertCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMessages } from "@/hooks/useMessages";

interface MessageOwnerDialogProps {
  ownerId: number;
  ownerName?: string;
  ownerPhone?: string;
  propertyTitle: string;
  onClose: () => void;
}

export const MessageOwnerDialog: React.FC<MessageOwnerDialogProps> = ({
  ownerId,
  ownerName,
  ownerPhone,
  propertyTitle,
  onClose,
}) => {
  const [messageContent, setMessageContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { createConversation, sendMessage } = useMessages();
  const navigate = useNavigate();

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      setError("Message cannot be empty");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create or get existing conversation
      const conversation = await createConversation([ownerId]);

      // Send the message
      await sendMessage(conversation.id, messageContent);

      setSuccess(true);
      setMessageContent("");

      // Auto-close after 2 seconds and navigate to messages
      setTimeout(() => {
        onClose();
        navigate(`/messages?conv=${conversation.id}`);
      }, 1500);
    } catch (err) {
      setError("Failed to send message. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl bg-white">
 
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 flex justify-between items-start rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold">Message Property Owner</h2>
            <p className="text-sm text-blue-100 mt-1">{propertyTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

  
        <div className="p-6 space-y-4">
    
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700 uppercase">Owner</p>
            <p className="text-sm text-blue-900 font-medium">{ownerName || "Property owner"}</p>
            {ownerPhone && (
              <a
                href={`tel:${ownerPhone}`}
                className="mt-1 inline-flex text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
              >
                {ownerPhone}
              </a>
            )}
          </div>

         
          {success && (
            <div className="bg-green-50 border border-green-300 rounded-lg p-3 flex gap-2">
              <div className="text-green-600">✓</div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Message sent successfully!
                </p>
                <p className="text-xs text-green-700">Redirecting to messages...</p>
              </div>
            </div>
          )}

      
          {error && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

       
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Message
            </label>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Hi, I'm interested in this property. Can you tell me more about..."
              disabled={isLoading || success}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {messageContent.length}/500 characters
            </p>
          </div>

        
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <p className="text-xs text-indigo-800">
              💡 Once sent, you'll be able to continue the conversation in your Messages page.
            </p>
          </div>

     
          <div className="flex gap-2">
            <Button
              onClick={onClose}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !messageContent.trim() || success}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MessageOwnerDialog;
